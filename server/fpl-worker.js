/**
 * Cloudflare Worker that proxies + caches the FPL public API.
 *
 * Deploy this as your own Worker (or Vercel Edge Function with minor tweaks)
 * and point the frontend at it via `VITE_FPL_PROXY` so the app no longer
 * depends on the flaky `corsproxy.io` service.
 *
 * Usage from the frontend:
 *   GET https://<your-worker>.workers.dev/https://fantasy.premierleague.com/api/bootstrap-static/
 *
 * wrangler.toml example:
 *   name = "fpl-fdr-proxy"
 *   main = "server/fpl-worker.js"
 *   compatibility_date = "2024-11-01"
 *
 *   [vars]
 *   ALLOWED_ORIGIN = "https://omed7.github.io"
 */

const ALLOWED_HOSTS = new Set([
  'fantasy.premierleague.com',
]);

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return preflight(env);

    const url = new URL(request.url);
    const target = decodeURIComponent(url.pathname.slice(1)) + url.search;
    let upstream;
    try {
      upstream = new URL(target);
    } catch {
      return new Response('Bad request', { status: 400, headers: corsHeaders(env) });
    }

    if (!ALLOWED_HOSTS.has(upstream.host)) {
      return new Response('Host not allowed', { status: 403, headers: corsHeaders(env) });
    }

    const cache = caches.default;
    const cacheKey = new Request(upstream.toString(), { method: 'GET' });
    const hit = await cache.match(cacheKey);
    if (hit) return withCors(hit, env);

    const res = await fetch(upstream.toString(), {
      headers: { 'user-agent': 'fpl-fdr-proxy/1.0' },
      cf: { cacheTtl: 300, cacheEverything: true },
    });

    // Clone + add cache headers before caching.
    const body = await res.arrayBuffer();
    const cached = new Response(body, {
      status: res.status,
      headers: {
        'content-type': res.headers.get('content-type') || 'application/json',
        'cache-control': 'public, max-age=300',
      },
    });
    cache.put(cacheKey, cached.clone());
    return withCors(cached, env);
  },
};

function corsHeaders(env) {
  return {
    'access-control-allow-origin': env?.ALLOWED_ORIGIN || '*',
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-allow-headers': 'content-type',
  };
}
function preflight(env) {
  return new Response(null, { status: 204, headers: corsHeaders(env) });
}
function withCors(res, env) {
  const h = new Headers(res.headers);
  for (const [k, v] of Object.entries(corsHeaders(env))) h.set(k, v);
  return new Response(res.body, { status: res.status, headers: h });
}

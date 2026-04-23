# FPL API proxy

The app fetches directly from `fantasy.premierleague.com/api/*` via a CORS proxy. By default it uses the public `corsproxy.io` service, which is fine for light usage but can be rate-limited or blocked.

For a more reliable setup, deploy your own edge proxy. A Cloudflare Worker example is in [`fpl-worker.js`](./fpl-worker.js).

## Cloudflare Worker

1. Install Wrangler: `npm i -g wrangler`
2. Create a `wrangler.toml` at the project root:
   ```toml
   name = "fpl-fdr-proxy"
   main = "server/fpl-worker.js"
   compatibility_date = "2024-11-01"

   [vars]
   ALLOWED_ORIGIN = "https://omed7.github.io"
   ```
3. `wrangler deploy`
4. Point the frontend at it:
   ```bash
   # .env.local (dev)
   VITE_FPL_PROXY=https://fpl-fdr-proxy.<your-sub>.workers.dev/
   ```
5. Rebuild / redeploy the site. The app will now fetch through your Worker, which caches bootstrap + fixtures responses for 5 minutes.

## Vercel / Netlify

The same pattern works with Vercel Edge Functions or Netlify Functions — swap the `fetch` handler for the framework's request/response idiom.

## Local dev

For local dev without deploying anything, just leave `VITE_FPL_PROXY` unset; the app falls back to `corsproxy.io`.

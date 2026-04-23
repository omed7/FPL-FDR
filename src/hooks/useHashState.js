import { useCallback, useEffect } from 'react';

/**
 * Encode/decode a small state object into `window.location.hash`. Useful for
 * shareable permalinks — settings like gwStart/gwEnd/sortOrder get packed in.
 *
 * The hash is shaped as `#s=<base64url(json)>`.
 *
 * @param {Record<string, any>} state
 * @param {(incoming: Record<string, any>) => void} onIncoming
 */
export function useHashState(state, onIncoming) {
  // On mount, read hash once and hand off to caller.
  useEffect(() => {
    try {
      const hash = window.location.hash;
      const m = /#s=([^&]+)/.exec(hash);
      if (!m) return;
      const json = atob(m[1].replace(/-/g, '+').replace(/_/g, '/'));
      const parsed = JSON.parse(json);
      onIncoming(parsed);
    } catch {
      /* ignore malformed hash */
    }
    // Only run on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildShareUrl = useCallback(() => {
    const json = JSON.stringify(state);
    const b64 = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const base = window.location.origin + window.location.pathname;
    return `${base}#s=${b64}`;
  }, [state]);

  return { buildShareUrl };
}

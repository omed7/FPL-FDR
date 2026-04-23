import { useCallback, useEffect, useState } from 'react';
import { fetchFPLData } from '../api.js';

/**
 * Fetch + cache the bootstrap + fixtures payload. Cache lives in
 * sessionStorage for up to `CACHE_TTL_MS` so reloads during the same session
 * don't hammer the proxy.
 */
const CACHE_KEY = 'fpl:data:v1';
const CACHE_TTL_MS = 15 * 60 * 1000;

export function useFPLData() {
  const [data, setData] = useState({
    teams: [],
    events: [],
    allEvents: [],
    fixturesData: [],
    elements: [],
    elementTypes: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const load = useCallback(async ({ force = false } = {}) => {
    setLoading(true);
    setError(null);
    try {
      if (!force) {
        try {
          const raw = sessionStorage.getItem(CACHE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Date.now() - parsed.at < CACHE_TTL_MS) {
              setData(parsed.data);
              setLastRefreshed(new Date(parsed.at));
              setLoading(false);
              return parsed.data;
            }
          }
        } catch {
          /* fall through to network */
        }
      }

      const result = await fetchFPLData();
      setData(result);
      const now = Date.now();
      setLastRefreshed(new Date(now));
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: now, data: result }));
      } catch {
        /* ignore storage errors */
      }
      return result;
    } catch (err) {
      console.error(err);
      setError('Failed to load FPL data. Please try again later.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const refresh = useCallback(() => load({ force: true }), [load]);

  return { data, loading, error, lastRefreshed, refresh };
}

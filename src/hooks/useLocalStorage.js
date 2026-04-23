import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * `useState` that mirrors into `localStorage` under `key`. The stored value is
 * JSON-encoded; if parsing fails on first read we fall back to `initial`.
 *
 * @template T
 * @param {string} key
 * @param {T} initial
 * @returns {[T, (v: T | ((prev: T) => T)) => void]}
 */
export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw == null) return initial;
      return JSON.parse(raw);
    } catch {
      return initial;
    }
  });

  const keyRef = useRef(key);
  useEffect(() => { keyRef.current = key; }, [key]);

  useEffect(() => {
    try {
      window.localStorage.setItem(keyRef.current, JSON.stringify(value));
    } catch {
      // Quota exceeded or private-mode — ignore.
    }
  }, [value]);

  const set = useCallback((v) => setValue(v), []);
  return [value, set];
}

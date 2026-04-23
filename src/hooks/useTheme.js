import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage.js';

/**
 * Theme is applied by toggling `dark` on <html>. Tailwind is configured in
 * class-based dark mode so every utility reads from that class.
 *
 * @returns {['dark'|'light', () => void]}
 */
export function useTheme() {
  const [theme, setTheme] = useLocalStorage('theme', 'dark');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  return [theme, toggle];
}

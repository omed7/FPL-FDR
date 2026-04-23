import { useEffect } from 'react';

/**
 * Register global keyboard shortcuts. Each entry is `{ key, handler, alt? }`.
 * Shortcuts are ignored while the user is typing into an input/textarea/select.
 *
 * @param {Array<{ key: string, handler: (e: KeyboardEvent) => void, shift?: boolean, meta?: boolean }>} shortcuts
 */
export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const onKey = (e) => {
      const target = e.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return;
      }
      for (const s of shortcuts) {
        if (e.key !== s.key) continue;
        if (s.shift && !e.shiftKey) continue;
        if (s.meta && !(e.metaKey || e.ctrlKey)) continue;
        s.handler(e);
        break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shortcuts]);
}

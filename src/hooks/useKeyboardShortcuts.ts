import { useEffect } from 'react';

export interface ShortcutAction {
  key: string;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutAction[]) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Skip if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      // Skip if focus is inside xterm terminal (except for ⌘K which always opens palette)
      const inTerminal = !!(e.target as HTMLElement)?.closest('.xterm');
      if (inTerminal && !(e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey))) return;

      for (const s of shortcuts) {
        const metaMatch = s.meta ? (e.metaKey || e.ctrlKey) : true;
        const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = s.alt ? e.altKey : !e.altKey;

        if (e.key.toLowerCase() === s.key.toLowerCase() && metaMatch && shiftMatch && altMatch) {
          e.preventDefault();
          s.action();
          return;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

/** Format shortcut for display: ⌘T, ⇧⌘K, etc. */
export function formatShortcut(s: { meta?: boolean; shift?: boolean; alt?: boolean; key: string }): string {
  const parts: string[] = [];
  if (s.meta) parts.push('⌘');
  if (s.shift) parts.push('⇧');
  if (s.alt) parts.push('⌥');
  parts.push(s.key.toUpperCase());
  return parts.join('');
}

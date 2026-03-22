import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

const RECENT_KEY = 'termdeck:recent-commands';
const MAX_RECENT = 5;

function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}

function saveRecent(ids: string[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, MAX_RECENT)));
}

export default function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>(loadRecent);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  function recordRecent(id: string) {
    const next = [id, ...recentIds.filter((r) => r !== id)].slice(0, MAX_RECENT);
    setRecentIds(next);
    saveRecent(next);
  }

  const filtered = useMemo(() => {
    const base = query
      ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()) || c.description?.toLowerCase().includes(query.toLowerCase()))
      : commands;

    if (query) return base;

    // No query: sort recent to top
    const recentSet = new Set(recentIds);
    const recent = recentIds.map((id) => base.find((c) => c.id === id)).filter(Boolean) as CommandItem[];
    const rest = base.filter((c) => !recentSet.has(c.id));
    return [...recent, ...rest];
  }, [commands, query, recentIds]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        recordRecent(filtered[selectedIndex].id);
        filtered[selectedIndex].action();
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [filtered, selectedIndex, onClose],
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 w-full max-w-lg rounded-xl bg-[#1a1d24] border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white/30 flex-shrink-0">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command..."
                className="flex-1 bg-transparent text-sm text-white placeholder-white/30 outline-none"
              />
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-white/40">ESC</kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[300px] overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-white/30 mb-2">No commands found</p>
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        const newAgentCmd = commands.find((c) => c.id === 'new-agent');
                        if (newAgentCmd) { newAgentCmd.action(); onClose(); }
                      }}
                      className="text-xs text-white/40 hover:text-white/60 transition-colors"
                    >
                      + Create a new agent instead
                    </button>
                  )}
                </div>
              ) : (
                filtered.map((cmd, i) => (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => { recordRecent(cmd.id); cmd.action(); onClose(); }}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      i === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white/80 truncate">{cmd.label}</div>
                      {cmd.description && (
                        <div className="text-xs text-white/30 truncate">{cmd.description}</div>
                      )}
                    </div>
                    {cmd.shortcut && (
                      <kbd className="flex-shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-white/30">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChecklistProps } from '../../types';

export default function Checklist({
  items,
  onAdd,
  onToggle,
  onRemove,
  accentColor,
}: ChecklistProps) {
  const [inputValue, setInputValue] = useState('');
  const completedCount = items.filter((i) => i.completed).length;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInputValue('');
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Add input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Add a task..."
          aria-label="Add a checklist task"
          className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 transition-all focus-visible:ring-2 focus-visible:ring-white/30"
        />
      </form>

      {/* Item list */}
      <div className="flex flex-col gap-1">
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white/5"
            >
              {/* Custom checkbox */}
              <button
                type="button"
                role="checkbox"
                aria-checked={item.completed}
                aria-label={`${item.completed ? 'Uncheck' : 'Check'} task: ${item.title}`}
                onClick={() => onToggle(item.id)}
                className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                style={{
                  borderColor: item.completed ? accentColor : 'rgba(255,255,255,0.2)',
                  backgroundColor: item.completed ? accentColor : 'transparent',
                }}
              >
                {item.completed && (
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6L5 8.5L9.5 3.5"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>

              {/* Title */}
              <span
                className={`flex-1 text-sm transition-all ${
                  item.completed
                    ? 'text-white/30 line-through'
                    : 'text-white/80'
                }`}
              >
                {item.title}
              </span>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                aria-label={`Remove task: ${item.title}`}
                className="flex-shrink-0 rounded p-0.5 text-white/0 transition-colors group-hover:text-white/30 hover:!text-red-400 outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:text-white/30"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 4L12 12M12 4L4 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="py-4 text-center text-sm text-white/30">
          No tasks yet
        </div>
      )}

      {/* Progress text */}
      {items.length > 0 && (
        <div className="text-xs text-white/40">
          {completedCount} of {items.length} completed
        </div>
      )}
    </div>
  );
}

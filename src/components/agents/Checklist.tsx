import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChecklistProps, ChecklistItem } from '../../types';

function ChecklistRow({
  item,
  accentColor,
  onToggle,
  onRemove,
  onEdit,
  onMoveUp,
  onMoveDown,
}: {
  item: ChecklistItem;
  accentColor: string;
  onToggle: () => void;
  onRemove: () => void;
  onEdit: (title: string) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  function submitEdit() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== item.title) onEdit(trimmed);
    setEditing(false);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white/5"
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={item.completed}
        onClick={onToggle}
        className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        style={{
          borderColor: item.completed ? accentColor : 'rgba(255,255,255,0.2)',
          backgroundColor: item.completed ? accentColor : 'transparent',
        }}
      >
        {item.completed && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={submitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitEdit();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="flex-1 bg-transparent text-sm text-white outline-none border-b border-white/30"
        />
      ) : (
        <span
          className={`flex-1 text-sm transition-all cursor-pointer ${
            item.completed ? 'text-white/30 line-through' : 'text-white/80'
          }`}
          onDoubleClick={() => {
            setEditValue(item.title);
            setEditing(true);
          }}
        >
          {item.title}
        </span>
      )}

      <div className="flex-shrink-0 flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {onMoveUp && (
          <button type="button" onClick={onMoveUp} className="rounded p-0.5 text-white/20 hover:text-white/50 transition-colors" aria-label="Move up">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 7L6 4L9 7"/></svg>
          </button>
        )}
        {onMoveDown && (
          <button type="button" onClick={onMoveDown} className="rounded p-0.5 text-white/20 hover:text-white/50 transition-colors" aria-label="Move down">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 5L6 8L9 5"/></svg>
          </button>
        )}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove task: ${item.title}`}
          className="rounded p-0.5 text-white/20 hover:!text-red-400 transition-colors"
        >
          <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

export default function Checklist({
  items,
  onAdd,
  onToggle,
  onRemove,
  onEdit,
  onMove,
  onClearCompleted,
  accentColor,
}: ChecklistProps) {
  const [inputValue, setInputValue] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);
  const pending = items.filter((i) => !i.completed);
  const completed = items.filter((i) => i.completed);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInputValue('');
    // Keep focus on input for continuous entry
    requestAnimationFrame(() => addInputRef.current?.focus());
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          ref={addInputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Add a task..."
          aria-label="Add a checklist task"
          className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 transition-all focus-visible:ring-2 focus-visible:ring-white/30"
        />
      </form>

      {/* Pending items */}
      <div className="flex flex-col gap-1">
        <AnimatePresence mode="popLayout" initial={false}>
          {pending.map((item, i) => (
            <ChecklistRow
              key={item.id}
              item={item}
              accentColor={accentColor}
              onToggle={() => onToggle(item.id)}
              onRemove={() => onRemove(item.id)}
              onEdit={(title) => onEdit(item.id, title)}
              onMoveUp={i > 0 ? () => onMove(item.id, 'up') : undefined}
              onMoveDown={i < pending.length - 1 ? () => onMove(item.id, 'down') : undefined}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Completed section */}
      {completed.length > 0 && (
        <>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-white/30">{completed.length} completed</span>
            <button
              type="button"
              onClick={onClearCompleted}
              className="text-[11px] text-white/30 hover:text-red-400 transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-col gap-1">
            <AnimatePresence mode="popLayout" initial={false}>
              {completed.map((item) => (
                <ChecklistRow
                  key={item.id}
                  item={item}
                  accentColor={accentColor}
                  onToggle={() => onToggle(item.id)}
                  onRemove={() => onRemove(item.id)}
                  onEdit={(title) => onEdit(item.id, title)}
                />
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      {items.length === 0 && (
        <div className="py-4 text-center text-sm text-white/30">No tasks yet</div>
      )}

      {items.length > 0 && (
        <div className="text-xs text-white/40">
          {completed.length} of {items.length} completed
        </div>
      )}
    </div>
  );
}

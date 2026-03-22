import { useState, useRef, useEffect } from 'react';
import type { TerminalContainerProps, AgentTerminal } from '../../types';
import TerminalPanel from './TerminalPanel';
import ConfirmDialog from '../common/ConfirmDialog';

export default function TerminalContainer({ agent, onUpdateTerminals, isExpanded, onToggleExpand }: TerminalContainerProps) {
  const [activeIndex, setActiveIndex] = useState(agent.terminals[0]?.index ?? 0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [splitIndex, setSplitIndex] = useState<number | null>(null);
  const [confirmRemoveIndex, setConfirmRemoveIndex] = useState<number | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const terminals = agent.terminals;

  // Focus input when editing starts
  useEffect(() => {
    if (editingIndex !== null) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingIndex]);

  function handleRename(index: number) {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== terminals.find((t) => t.index === index)?.name) {
      const updated = terminals.map((t) =>
        t.index === index ? { ...t, name: trimmed } : t,
      );
      onUpdateTerminals(updated);
    }
    setEditingIndex(null);
  }

  // Ensure activeIndex is valid
  const activeTerminal = terminals.find((t) => t.index === activeIndex) ?? terminals[0] ?? null;

  function handleAdd() {
    const maxIndex = terminals.reduce((max, t) => Math.max(max, t.index), -1);
    const newIndex = maxIndex + 1;
    const newTerminal: AgentTerminal = {
      index: newIndex,
      name: `Terminal ${newIndex + 1}`,
    };
    const updated = [...terminals, newTerminal];
    onUpdateTerminals(updated);
    setActiveIndex(newIndex);
  }

  function handleRemove(index: number) {
    // Kill pty and clear session for this terminal
    const id = `${agent.id}:${index}`;
    window.terminal?.kill({ id });
    window.terminal?.clearHistory(id);

    const updated = terminals.filter((t) => t.index !== index);
    onUpdateTerminals(updated);

    // Reset split if the split terminal was deleted
    if (splitIndex === index) {
      setSplitIndex(null);
    }

    // Switch to another terminal if we deleted the active one
    if (activeIndex === index) {
      setActiveIndex(updated[0]?.index ?? 0);
    }
  }

  if (terminals.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 gap-2">
        <p className="text-sm text-white/30">No terminals open</p>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-white/15 hover:text-white/80 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6 2v8M2 6h8" />
          </svg>
          New Terminal
        </button>
        <span className="text-[10px] text-white/20">or <kbd className="rounded bg-white/10 px-1 py-0.5 font-mono">⌘K</kbd> → "Add terminal"</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-xl overflow-hidden border border-white/10">
      {/* Tab bar */}
      <div className="flex items-center gap-0 bg-white/5 border-b border-white/10 px-1">
        <div
          className="flex items-center gap-0.5 flex-1 overflow-x-auto py-1 scrollbar-none"
          style={{
            maskImage: 'linear-gradient(90deg, transparent 0, black 8px, black calc(100% - 24px), transparent 100%)',
            WebkitMaskImage: 'linear-gradient(90deg, transparent 0, black 8px, black calc(100% - 24px), transparent 100%)',
          }}
        >
          {terminals.map((t) => {
            const isActive = t.index === activeTerminal!.index;
            return (
              <div
                key={t.index}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer transition-colors select-none ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : splitIndex === t.index
                    ? 'bg-white/5 text-white/70 ring-1 ring-white/15'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                }`}
                onClick={() => setActiveIndex(t.index)}
                onDoubleClick={() => {
                  setEditingIndex(t.index);
                  setEditValue(t.name);
                }}
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="flex-shrink-0"
                >
                  <path d="M2 8L5 5L2 2" />
                  <path d="M6 9H10" />
                </svg>
                {editingIndex === t.index ? (
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleRename(t.index)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(t.index);
                      if (e.key === 'Escape') setEditingIndex(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-16 bg-transparent text-xs text-white outline-none border-b border-white/30"
                  />
                ) : (
                  <span className="text-xs truncate whitespace-nowrap">{t.name}</span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmRemoveIndex(t.index);
                  }}
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-4 h-4 flex items-center justify-center rounded text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  aria-label={`Remove ${t.name}`}
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M1 1l6 6M7 1L1 7" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex-shrink-0 flex items-center gap-0.5 mx-1">
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center justify-center w-6 h-6 rounded text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
            aria-label="Add terminal"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M6 2v8M2 6h8" />
            </svg>
          </button>
          {terminals.length >= 2 && (
            <button
              type="button"
              onClick={() => setSplitIndex((prev) => prev !== null ? null : (terminals.find((t) => t.index !== activeTerminal!.index)?.index ?? null))}
              className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
                splitIndex !== null ? 'text-white/80 bg-white/10' : 'text-white/40 hover:text-white/80 hover:bg-white/10'
              }`}
              aria-label={splitIndex !== null ? 'Close split' : 'Split view'}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="1" y="1" width="10" height="10" rx="1" />
                <path d="M6 1v10" />
              </svg>
            </button>
          )}
          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="flex items-center justify-center w-6 h-6 rounded text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
              aria-label={isExpanded ? 'Collapse terminal' : 'Expand terminal'}
            >
              {isExpanded ? (
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 10L8 14L12 10" />
                  <path d="M4 6L8 2L12 6" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 6L8 2L12 6" />
                  <path d="M4 10L8 14L12 10" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Terminal panels */}
      <div className={`flex-1 min-h-0 ${splitIndex !== null ? 'flex' : 'relative'}`}>
        {splitIndex !== null ? (
          <>
            {/* Left split: active terminal (exclude split terminal) */}
            <div className="flex-1 min-w-0 relative">
              {terminals.filter((t) => t.index !== splitIndex).map((t) => {
                const compositeId = `${agent.id}:${t.index}`;
                const isActive = t.index === activeTerminal!.index;
                return (
                  <div
                    key={compositeId}
                    className="absolute inset-0"
                    style={{ visibility: isActive ? 'visible' : 'hidden', zIndex: isActive ? 1 : 0 }}
                  >
                    <TerminalPanel terminalId={compositeId} cwd={agent.path} />
                  </div>
                );
              })}
            </div>
            {/* Divider */}
            <div className="w-px bg-white/10 flex-shrink-0" />
            {/* Right split: dedicated to splitIndex terminal */}
            <div className="flex-1 min-w-0 relative">
              {terminals.filter((t) => t.index === splitIndex).map((t) => (
                <div key={`${agent.id}:${t.index}`} className="absolute inset-0">
                  <TerminalPanel terminalId={`${agent.id}:${t.index}`} cwd={agent.path} />
                </div>
              ))}
            </div>
          </>
        ) : (
          terminals.map((t) => {
            const compositeId = `${agent.id}:${t.index}`;
            const isActive = t.index === activeTerminal!.index;
            return (
              <div
                key={compositeId}
                className="absolute inset-0"
                style={{ visibility: isActive ? 'visible' : 'hidden', zIndex: isActive ? 1 : 0 }}
              >
                <TerminalPanel terminalId={compositeId} cwd={agent.path} />
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmRemoveIndex !== null}
        title="Close Terminal"
        message={`"${terminals.find((t) => t.index === confirmRemoveIndex)?.name ?? 'Terminal'}" will be closed and its session data deleted.`}
        confirmLabel="Close"
        onConfirm={() => {
          if (confirmRemoveIndex !== null) handleRemove(confirmRemoveIndex);
          setConfirmRemoveIndex(null);
        }}
        onCancel={() => setConfirmRemoveIndex(null)}
      />
    </div>
  );
}

import { useState } from 'react';
import type { TerminalContainerProps, AgentTerminal } from '../../types';
import TerminalPanel from './TerminalPanel';

export default function TerminalContainer({ agent, onUpdateTerminals }: TerminalContainerProps) {
  const [activeIndex, setActiveIndex] = useState(agent.terminals[0]?.index ?? 0);

  const terminals = agent.terminals;

  // Ensure activeIndex is valid
  const activeTerminal = terminals.find((t) => t.index === activeIndex) ?? terminals[0];

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
    if (terminals.length <= 1) return;

    // Kill pty and clear session for this terminal
    const id = `${agent.id}:${index}`;
    window.terminal?.kill({ id });
    window.terminal?.clearHistory(id);

    const updated = terminals.filter((t) => t.index !== index);
    onUpdateTerminals(updated);

    // Switch to another terminal if we deleted the active one
    if (activeIndex === index) {
      setActiveIndex(updated[0].index);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-xl overflow-hidden border border-white/10">
      {/* Tab bar */}
      <div className="flex items-center gap-0 bg-white/5 border-b border-white/10 px-1">
        <div className="flex items-center gap-0.5 flex-1 overflow-x-auto py-1">
          {terminals.map((t) => {
            const isActive = t.index === activeTerminal.index;
            return (
              <div
                key={t.index}
                className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-md cursor-pointer transition-colors select-none ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                }`}
                onClick={() => setActiveIndex(t.index)}
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
                <span className="text-xs truncate whitespace-nowrap">{t.name}</span>
                {terminals.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(t.index);
                    }}
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-4 h-4 flex items-center justify-center rounded text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    aria-label={`Remove ${t.name}`}
                  >
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <path d="M1 1l6 6M7 1L1 7" />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors mx-1"
          aria-label="Add terminal"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6 2v8M2 6h8" />
          </svg>
        </button>
      </div>

      {/* Terminal panels — all mounted, only active is visible */}
      <div className="flex-1 min-h-0 relative">
        {terminals.map((t) => {
          const compositeId = `${agent.id}:${t.index}`;
          const isActive = t.index === activeTerminal.index;
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
    </div>
  );
}

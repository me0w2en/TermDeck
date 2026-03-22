import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { AgentListItemProps, AgentStatus } from '../../types';
import InitialAvatar from './InitialAvatar';
import ConfirmDialog from '../common/ConfirmDialog';

const statusColors: Record<AgentStatus, string> = {
  running: '#22c55e',
  idle: '#eab308',
  offline: '#6b7280',
};

export default function AgentListItem({
  agent,
  isSelected,
  onSelect,
  onRemove,
  onMoveUp,
  onMoveDown,
  onRename,
  onSetStatus,
}: AgentListItemProps) {
  const [hovered, setHovered] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const dotColor = statusColors[agent.status];
  const isRunning = agent.status === 'running';
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isSelected) {
      btnRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isSelected]);

  // Close context menu on outside click
  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('contextmenu', close);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('contextmenu', close);
    };
  }, [ctxMenu]);

  return (
    <motion.button
      ref={btnRef}
      layout
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setCtxMenu({ x: e.clientX, y: e.clientY });
      }}
      aria-label={`Select agent ${agent.name}`}
      className={`
        group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5
        text-left transition-colors duration-150 outline-none
        focus-visible:ring-2 focus-visible:ring-white/30
        ${isSelected ? 'bg-white/10' : 'hover:bg-white/5'}
      `}
      style={{
        borderLeft: isSelected ? `3px solid ${agent.color}` : '3px solid transparent',
      }}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <InitialAvatar name={agent.name} color={agent.color} size={32} />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-white">{agent.name}</div>
        {agent.role && <div className="truncate text-xs text-white/50">{agent.role}</div>}
        {agent.path && (
          <div className="truncate text-[10px] font-mono text-white/25">{agent.path.replace(/^\/Users\/[^/]+/, '~')}</div>
        )}
      </div>

      {/* Status dot / Action buttons — swap on hover */}
      <div className="flex-shrink-0 flex items-center justify-center">
        {hovered ? (
          <motion.div
            className="flex items-center gap-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            {onMoveUp && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                className="rounded p-0.5 text-white/25 hover:text-white/60 hover:bg-white/10 transition-colors"
                aria-label="Move up"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 7L6 4L9 7"/></svg>
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                className="rounded p-0.5 text-white/25 hover:text-white/60 hover:bg-white/10 transition-colors"
                aria-label="Move down"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 5L6 8L9 5"/></svg>
              </button>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
              aria-label={`Remove agent ${agent.name}`}
              className="rounded p-0.5 text-white/25 hover:text-red-400 hover:bg-white/10 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </motion.div>
        ) : (
          <span className="relative flex h-2.5 w-2.5">
            {isRunning && (
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"
                style={{ backgroundColor: dotColor }}
              />
            )}
            <span
              className="relative inline-flex h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: dotColor }}
            />
          </span>
        )}
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        title="Delete Agent"
        message={`"${agent.name}" agent and all session data will be permanently deleted.`}
        onConfirm={() => {
          setShowConfirm(false);
          onRemove();
        }}
        onCancel={() => setShowConfirm(false)}
      />

      {/* Context menu */}
      {ctxMenu && (
        <div
          className="fixed z-50 min-w-[140px] rounded-lg bg-[#1e2128] border border-white/10 py-1 shadow-xl"
          style={{
            left: Math.min(ctxMenu.x, window.innerWidth - 160),
            top: ctxMenu.y + 180 > window.innerHeight ? ctxMenu.y - 180 : ctxMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {onRename && (
            <button type="button" onClick={() => { setCtxMenu(null); onRename(); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 transition-colors">
              Rename
            </button>
          )}
          {onSetStatus && (
            <>
              {(['idle', 'running', 'offline'] as const).map((s) => (
                <button key={s} type="button" onClick={() => { setCtxMenu(null); onSetStatus(s); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-white/70 hover:bg-white/10 transition-colors capitalize">
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusColors[s] }} />
                  Set {s}
                </button>
              ))}
            </>
          )}
          <div className="my-1 border-t border-white/10" />
          <button type="button" onClick={() => { setCtxMenu(null); setShowConfirm(true); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10 transition-colors">
            Delete
          </button>
        </div>
      )}
    </motion.button>
  );
}

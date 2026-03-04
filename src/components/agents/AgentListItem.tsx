import { useState } from 'react';
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
}: AgentListItemProps) {
  const [hovered, setHovered] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const dotColor = statusColors[agent.status];
  const isRunning = agent.status === 'running';

  return (
    <motion.button
      layout
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
        <div className="truncate text-xs text-white/50">{agent.role}</div>
      </div>

      {/* Status dot / Remove button — swap on hover */}
      <div className="flex-shrink-0 flex items-center justify-center w-5 h-5">
        {hovered ? (
          <motion.button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowConfirm(true);
            }}
            aria-label={`Remove agent ${agent.name}`}
            className="rounded p-0.5 text-white/30 transition-colors hover:bg-white/10 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4L12 12M12 4L4 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </motion.button>
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
    </motion.button>
  );
}

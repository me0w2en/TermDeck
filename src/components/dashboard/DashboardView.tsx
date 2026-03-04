import { motion } from 'framer-motion';
import type { DashboardViewProps, AgentStatus } from '../../types';
import InitialAvatar from '../agents/InitialAvatar';
import { formatTokens } from '../../utils/format';

const statusColors: Record<AgentStatus, string> = {
  running: '#22c55e',
  idle: '#eab308',
  offline: '#6b7280',
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export default function DashboardView({
  agents,
  onSelectAgent,
  getClaudeSummary,
}: DashboardViewProps) {
  if (agents.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          className="text-white/10"
          aria-hidden="true"
        >
          <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" />
          <circle cx="32" cy="28" r="10" stroke="currentColor" strokeWidth="2" />
          <path
            d="M16 52C16 44 23 38 32 38C41 38 48 44 48 52"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M44 20L52 20M48 16L48 24"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <p className="text-lg font-medium text-white/30">
          Add your first agent to get started
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {agents.map((agent) => {
        const dotColor = statusColors[agent.status];
        const totalTasks = agent.checklist.length;
        const doneTasks = agent.checklist.filter((t) => t.completed).length;
        const progress = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;
        const claude = getClaudeSummary(agent.id);

        return (
          <motion.button
            key={agent.id}
            variants={item}
            type="button"
            onClick={() => onSelectAgent(agent.id)}
            aria-label={`View agent ${agent.name}`}
            className="flex flex-col gap-3 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 text-left outline-none transition-colors hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-white/30"
          >
            {/* Header: avatar + name + role */}
            <div className="flex items-center gap-3">
              <InitialAvatar name={agent.name} color={agent.color} size={48} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-white">
                  {agent.name}
                </div>
                <div className="truncate text-sm text-white/50">{agent.role}</div>
              </div>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: dotColor }}
                aria-hidden="true"
              />
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium capitalize"
                style={{
                  backgroundColor: dotColor + '20',
                  color: dotColor,
                }}
              >
                {agent.status}
              </span>
            </div>

            {/* Checklist summary */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/50">
                {doneTasks}/{totalTasks} tasks
              </span>
              {totalTasks > 0 && (
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: agent.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              )}
            </div>

            {/* Claude token/cost info */}
            {claude.detected && (claude.inputTokens > 0 || claude.outputTokens > 0) && (
              <div className="flex items-center gap-2 text-[11px] text-white/40">
                <span>{formatTokens(claude.inputTokens)}↑ {formatTokens(claude.outputTokens)}↓</span>
                {claude.cost > 0 && (
                  <>
                    <span className="text-white/20">·</span>
                    <span>${claude.cost.toFixed(2)}</span>
                  </>
                )}
              </div>
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
}

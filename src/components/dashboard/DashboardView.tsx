import { useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import type { DashboardViewProps, AgentStatus } from '../../types';
import InitialAvatar from '../agents/InitialAvatar';
import { formatTokens } from '../../utils/format';

type SortMode = 'default' | 'name' | 'status' | 'activity';

const statusOrder: Record<AgentStatus, number> = { running: 0, idle: 1, offline: 2 };

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

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DashboardView({
  agents,
  onSelectAgent,
  onAddAgent,
  getClaudeSummary,
  getLastActivity,
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
        {onAddAgent && (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={onAddAgent}
              className="flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/15 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M8 3V13M3 8H13" />
              </svg>
              Add Agent
            </button>
            <span className="text-[11px] text-white/20">or press <kbd className="rounded bg-white/10 px-1 py-0.5 text-[10px] font-mono">⌘N</kbd></span>
          </div>
        )}
      </div>
    );
  }

  const hasAnimated = useRef(false);

  const [sortMode, setSortModeRaw] = useState<SortMode>(() => {
    const saved = localStorage.getItem('termdeck:dashboard-sort');
    return (saved === 'name' || saved === 'status' || saved === 'activity') ? saved : 'default';
  });
  const setSortMode = (m: SortMode) => {
    setSortModeRaw(m);
    localStorage.setItem('termdeck:dashboard-sort', m);
  };

  const sortedAgents = useMemo(() => {
    if (sortMode === 'default') return agents;
    const sorted = [...agents];
    switch (sortMode) {
      case 'name': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'status': sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]); break;
      case 'activity': sorted.sort((a, b) => {
        const ta = getLastActivity?.(a.id) || '';
        const tb = getLastActivity?.(b.id) || '';
        return tb.localeCompare(ta); // newest first
      }); break;
    }
    return sorted;
  }, [agents, sortMode, getLastActivity]);

  const sortOptions: { value: SortMode; label: string }[] = [
    { value: 'default', label: 'Default' },
    { value: 'name', label: 'Name' },
    { value: 'status', label: 'Status' },
    { value: 'activity', label: 'Recent' },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* Sort bar — only show when 3+ agents */}
      {agents.length >= 3 && (
      <div className="flex items-center gap-1">
        <span className="text-[11px] text-white/30 mr-1">Sort:</span>
        {sortOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSortMode(opt.value)}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
              sortMode === opt.value
                ? 'bg-white/10 text-white/70'
                : 'text-white/30 hover:text-white/50 hover:bg-white/5'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      )}

      <motion.div
        variants={container}
        initial={hasAnimated.current ? false : 'hidden'}
        animate="show"
        onAnimationComplete={() => { hasAnimated.current = true; }}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
      {sortedAgents.map((agent) => {
        const dotColor = statusColors[agent.status];
        const totalTasks = agent.checklist.length;
        const doneTasks = agent.checklist.filter((t) => t.completed).length;
        const progress = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;
        const claude = getClaudeSummary(agent.id);

        return (
          <motion.button
            key={agent.id}
            variants={item}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => onSelectAgent(agent.id)}
            aria-label={`View agent ${agent.name}`}
            className="flex flex-col gap-2.5 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 text-left outline-none transition-colors hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-white/30 overflow-hidden"
          >
            {/* Header: avatar + name + role */}
            <div className="flex items-center gap-3">
              <InitialAvatar name={agent.name} color={agent.color} size={48} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-white">
                  {agent.name}
                </div>
                {agent.role && <div className="truncate text-sm text-white/50">{agent.role}</div>}
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
              {(() => {
                const last = getLastActivity?.(agent.id);
                if (!last) return null;
                return <span className="text-[10px] text-white/25 ml-auto">{timeAgo(last)}</span>;
              })()}
            </div>

            {/* Checklist summary */}
            {totalTasks > 0 && (
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
            )}

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

            {/* Active terminals */}
            {agent.terminals.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {agent.terminals.map((t) => (
                  <span
                    key={t.index}
                    className="inline-flex items-center gap-1 rounded bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-white/30"
                  >
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="flex-shrink-0">
                      <path d="M2 8L5 5L2 2" />
                      <path d="M6 9H10" />
                    </svg>
                    {t.name}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-white/20 italic flex items-center gap-1">
                <span>No terminals</span>
              </div>
            )}
          </motion.button>
        );
      })}
    </motion.div>
    </div>
  );
}

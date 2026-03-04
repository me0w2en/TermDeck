import type { StatusBarProps } from '../../types';

const statusConfig = [
  { key: 'running' as const, label: 'Running', color: '#22c55e' },
  { key: 'idle' as const, label: 'Idle', color: '#eab308' },
  { key: 'offline' as const, label: 'Offline', color: '#6b7280' },
];

export default function StatusBar({ counts, totalTasks, completedTasks, totalCost }: StatusBarProps) {
  return (
    <footer className="flex h-8 items-center justify-between rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 px-4 text-xs text-white/50">
      {/* Agent status counts */}
      <div className="flex items-center gap-3">
        {statusConfig.map(({ key, label, color }) => (
          <span key={key} className="flex items-center gap-1">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            {label}: {counts[key]}
          </span>
        ))}
      </div>

      {/* Task counts + cost */}
      <div className="flex items-center gap-3">
        <span>Tasks: {completedTasks}/{totalTasks} completed</span>
        {totalCost > 0 && (
          <span className="text-white/40">Cost: ${totalCost.toFixed(2)}</span>
        )}
      </div>
    </footer>
  );
}

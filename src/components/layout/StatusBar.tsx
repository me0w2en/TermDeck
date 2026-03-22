import type { StatusBarProps } from '../../types';

const statusConfig = [
  { key: 'running' as const, label: 'Run', color: '#22c55e' },
  { key: 'idle' as const, label: 'Idle', color: '#eab308' },
  { key: 'offline' as const, label: 'Off', color: '#6b7280' },
];

const themeIcons = {
  dark: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M13.5 8.5a5.5 5.5 0 11-6-6 4.5 4.5 0 006 6z" />
    </svg>
  ),
  light: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.5 1.5M11 11l1.5 1.5M3.5 12.5l1.5-1.5M11 5l1.5-1.5" />
    </svg>
  ),
  system: (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="3" width="12" height="9" rx="1.5" />
      <path d="M6 14h4" />
    </svg>
  ),
};

export default function StatusBar({ counts, totalTasks, completedTasks, totalCost, totalAllTimeCost, themeMode, onCycleTheme }: StatusBarProps) {
  return (
    <footer className="flex h-8 items-center justify-between rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 px-3 text-[11px] text-white/50 gap-2 overflow-hidden">
      {/* Agent status counts */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {statusConfig.map(({ key, label, color }) => (
          <span key={key} className="flex items-center gap-1">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">{label}:</span> {counts[key]}
          </span>
        ))}
      </div>

      {/* Task counts + cost + theme */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="truncate">
          <span className="hidden sm:inline">Tasks: </span>{completedTasks}/{totalTasks}
        </span>
        {totalCost > 0 && (
          <span className="text-white/40 flex-shrink-0" title={totalAllTimeCost ? `All-time: $${totalAllTimeCost.toFixed(2)}` : undefined}>
            ${totalCost.toFixed(2)}
          </span>
        )}
        {onCycleTheme && themeMode && (
          <button
            type="button"
            onClick={onCycleTheme}
            className="flex items-center gap-1 text-white/30 hover:text-white/60 transition-colors flex-shrink-0"
            title={`Theme: ${themeMode}`}
          >
            {themeIcons[themeMode]}
            <span className="capitalize hidden sm:inline">{themeMode}</span>
          </button>
        )}
      </div>
    </footer>
  );
}

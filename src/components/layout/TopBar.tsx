import type { TopBarProps, ViewMode } from '../../types';
import Tooltip from '../common/Tooltip';

const viewOptions: { mode: ViewMode; label: string; icon: JSX.Element }[] = [
  {
    mode: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
        <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
        <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
        <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
      </svg>
    ),
  },
  {
    mode: 'detail',
    label: 'Detail',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M1 3H15M1 6H10M1 9H15M1 12H10" />
        <rect x="12" y="7.5" width="3" height="6" rx="0.5" />
      </svg>
    ),
  },
];

export default function TopBar({
  viewMode,
  onViewChange,
  onAddAgent,
  runningCount,
  sidebarCollapsed,
  onToggleSidebar,
}: TopBarProps) {
  return (
    <header
      className="flex h-12 items-center justify-between rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 px-4"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2">
        {/* Sidebar toggle */}
        <Tooltip text={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'} shortcut="⌘B">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex items-center justify-center w-8 h-8 rounded-md text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
            aria-label={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 3H14M2 8H14M2 13H14" />
            </svg>
          </button>
        </Tooltip>

        {/* View mode switcher */}
        <Tooltip text="Toggle view" shortcut="⌘D">
          <div
            className="flex rounded-lg bg-white/5 p-0.5"
            role="tablist"
            aria-label="View mode"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {viewOptions.map(({ mode, label, icon }) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={viewMode === mode}
                aria-label={`${label} view`}
                onClick={() => onViewChange(mode)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                  viewMode === mode
                    ? 'bg-white/15 text-white'
                    : 'text-white/50 hover:text-white/70'
                }`}
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </Tooltip>
      </div>

      {/* Center status */}
      <div className="flex items-center gap-2 text-sm text-white/60">
        {runningCount > 0 && (
          <>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            <span>{runningCount} running</span>
          </>
        )}
      </div>

      {/* Right: Add Agent button */}
      <div
        className="flex items-center"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <Tooltip text="Add agent" shortcut="⌘N">
          <button
            type="button"
            onClick={onAddAgent}
            aria-label="Add new agent"
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/15 outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M8 3V13M3 8H13" />
            </svg>
            Add Agent
          </button>
        </Tooltip>
      </div>
    </header>
  );
}

import type { ActivityEvent } from '../../hooks/useActivityLog';

const typeIcons: Record<ActivityEvent['type'], { color: string; icon: JSX.Element }> = {
  claude_start: {
    color: '#22c55e',
    icon: <circle cx="6" cy="6" r="4" fill="#22c55e" />,
  },
  claude_done: {
    color: '#3b82f6',
    icon: <path d="M3 6L5.5 8.5L9 4" stroke="#3b82f6" strokeWidth="1.5" fill="none" strokeLinecap="round" />,
  },
  terminal_open: {
    color: '#8b5cf6',
    icon: <path d="M3 8L5 6L3 4" stroke="#8b5cf6" strokeWidth="1.5" fill="none" strokeLinecap="round" />,
  },
  terminal_close: {
    color: '#6b7280',
    icon: <path d="M3 3L9 9M9 3L3 9" stroke="#6b7280" strokeWidth="1.5" fill="none" strokeLinecap="round" />,
  },
  agent_created: {
    color: '#f59e0b',
    icon: <path d="M6 2V10M2 6H10" stroke="#f59e0b" strokeWidth="1.5" fill="none" strokeLinecap="round" />,
  },
  status_change: {
    color: '#eab308',
    icon: <circle cx="6" cy="6" r="3" stroke="#eab308" strokeWidth="1.5" fill="none" />,
  },
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface Props {
  events: ActivityEvent[];
  onClear?: () => void;
}

export default function ActivityTimeline({ events, onClear }: Props) {
  if (events.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-white/30">No activity yet</div>
    );
  }

  const reversed = [...events].reverse();

  return (
    <div className="flex flex-col gap-0">
      {onClear && events.length > 0 && (
        <div className="flex justify-end mb-1">
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] text-white/25 hover:text-red-400 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
      {reversed.map((ev, i) => {
        const { icon } = typeIcons[ev.type] || typeIcons.status_change;
        const evDate = ev.timestamp.slice(0, 10);
        const prevDate = i > 0 ? reversed[i - 1].timestamp.slice(0, 10) : null;
        const showDateHeader = i === 0 || evDate !== prevDate;
        return (
          <div key={ev.id}>
            {showDateHeader && (
              <div className="text-[10px] text-white/20 px-1 pt-2 pb-1 font-medium">
                {evDate === new Date().toISOString().slice(0, 10) ? 'Today' : evDate}
              </div>
            )}
          <div className="flex items-start gap-2.5 py-1.5 px-1">
            <div className="flex-shrink-0 mt-0.5">
              <svg width="12" height="12" viewBox="0 0 12 12">{icon}</svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white/60 truncate">{ev.message}</div>
              {ev.meta && <div className="text-[10px] text-white/30 truncate">{ev.meta}</div>}
            </div>
            <span className="flex-shrink-0 text-[10px] text-white/25 tabular-nums">{formatTime(ev.timestamp)}</span>
          </div>
          </div>
        );
      })}
    </div>
  );
}

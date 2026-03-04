import type { SidebarProps } from '../../types';
import AgentListItem from '../agents/AgentListItem';

export default function Sidebar({ agents }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 z-30 flex h-full w-[280px] flex-col bg-white/5 backdrop-blur-xl border-r border-white/10">
      {/* Draggable spacer for macOS traffic lights */}
      <div
        className="h-10 flex-shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30"
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search agents..."
            value={agents.filterText}
            onChange={(e) => agents.setFilterText(e.target.value)}
            aria-label="Search agents"
            className="w-full rounded-lg bg-white/5 py-2 pl-8 pr-3 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 transition-all focus-visible:ring-2 focus-visible:ring-white/30"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {agents.filteredAgents.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-white/30">
            {agents.agents.length === 0 ? 'No agents yet' : 'No agents found'}
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {agents.filteredAgents.map((agent) => (
              <AgentListItem
                key={agent.id}
                agent={agent}
                isSelected={agents.selectedId === agent.id}
                onSelect={() => agents.selectAgent(agent.id)}
                onRemove={() => {
                  window.terminal?.clearAgentHistory(agent.id);
                  agents.removeAgent(agent.id);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

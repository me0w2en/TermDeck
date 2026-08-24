import { useState, useEffect, useRef } from 'react';
import type { Agent } from '../../types';
import TerminalPanel from '../terminal/TerminalPanel';

interface MonitorSelection {
  agentId: string;
  terminalIndex: number;
}

interface MonitorViewProps {
  agents: Agent[];
  onSelectAgent: (id: string) => void;
}

const STORAGE_KEY = 'termdeck:monitor-selection';
const MAX_TERMINALS = 6;

function loadSelection(): MonitorSelection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSelection(sel: MonitorSelection[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sel));
}

function getGridClass(count: number): string {
  switch (count) {
    case 1: return 'grid-cols-1 grid-rows-1';
    case 2: return 'grid-cols-2 grid-rows-1';
    case 3: return 'grid-cols-2 grid-rows-2';
    case 4: return 'grid-cols-2 grid-rows-2';
    case 5: case 6: return 'grid-cols-3 grid-rows-2';
    default: return 'grid-cols-2 grid-rows-2';
  }
}

export default function MonitorView({ agents, onSelectAgent }: MonitorViewProps) {
  const [selected, setSelected] = useState<MonitorSelection[]>(() => {
    const saved = loadSelection();
    // Filter out stale selections (agent/terminal no longer exists)
    return saved.filter((s) => {
      const agent = agents.find((a) => a.id === s.agentId);
      return agent && agent.terminals.some((t) => t.index === s.terminalIndex);
    });
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { saveSelection(selected); }, [selected]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    const close = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showDropdown]);

  function toggleTerminal(agentId: string, terminalIndex: number) {
    setSelected((prev) => {
      const exists = prev.some((s) => s.agentId === agentId && s.terminalIndex === terminalIndex);
      if (exists) return prev.filter((s) => !(s.agentId === agentId && s.terminalIndex === terminalIndex));
      if (prev.length >= MAX_TERMINALS) return prev;
      return [...prev, { agentId, terminalIndex }];
    });
  }

  function removeTerminal(agentId: string, terminalIndex: number) {
    setSelected((prev) => prev.filter((s) => !(s.agentId === agentId && s.terminalIndex === terminalIndex)));
  }

  // Build resolved list with agent data
  const resolved = selected.map((s) => {
    const agent = agents.find((a) => a.id === s.agentId);
    const terminal = agent?.terminals.find((t) => t.index === s.terminalIndex);
    return agent && terminal ? { ...s, agent, terminal } : null;
  }).filter(Boolean) as { agentId: string; terminalIndex: number; agent: Agent; terminal: Agent['terminals'][0] }[];

  // All available terminals grouped by agent
  const allTerminals = agents.flatMap((a) =>
    a.terminals.map((t) => ({
      agentId: a.id,
      agentName: a.name,
      agentColor: a.color,
      terminalIndex: t.index,
      terminalName: t.name,
      isSelected: selected.some((s) => s.agentId === a.id && s.terminalIndex === t.index),
    }))
  );

  if (resolved.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-white/15">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M12 10V10.01" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
        </svg>
        <p className="text-sm text-white/30">No terminals selected</p>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/15 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3V13M3 8H13" /></svg>
            Add Terminals
          </button>
          {showDropdown && <TerminalDropdown items={allTerminals} onToggle={toggleTerminal} />}
        </div>
        <p className="text-[11px] text-white/20">Select terminals from different agents to monitor simultaneously</p>
      </div>
    );
  }

  const count = resolved.length;
  // For 3 terminals, use special grid
  const isThree = count === 3;

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Selection bar */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {resolved.map(({ agentId, terminalIndex, agent, terminal }) => (
          <div
            key={`${agentId}:${terminalIndex}`}
            className="flex items-center gap-1.5 rounded-md bg-white/5 border border-white/10 px-2 py-1 text-xs"
          >
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: agent.color }} />
            <span className="text-white/60 font-medium">{agent.name}</span>
            <span className="text-white/30">{terminal.name}</span>
            <button
              type="button"
              onClick={() => removeTerminal(agentId, terminalIndex)}
              className="text-white/20 hover:text-red-400 transition-colors ml-0.5"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 1l6 6M7 1L1 7" /></svg>
            </button>
          </div>
        ))}
        {selected.length < MAX_TERMINALS && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowDropdown((v) => !v)}
              className="flex items-center justify-center w-7 h-7 rounded-md text-white/30 hover:text-white/60 hover:bg-white/10 transition-colors"
              aria-label="Add terminal"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 3V13M3 8H13" /></svg>
            </button>
            {showDropdown && <TerminalDropdown items={allTerminals} onToggle={toggleTerminal} />}
          </div>
        )}
      </div>

      {/* Terminal grid */}
      <div className={`flex-1 min-h-0 grid gap-2 ${isThree ? '' : getGridClass(count)}`}
        style={isThree ? {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
        } : undefined}
      >
        {resolved.map(({ agentId, terminalIndex, agent, terminal }, idx) => (
          <div
            key={`${agentId}:${terminalIndex}`}
            className="flex flex-col rounded-xl border border-white/10 overflow-hidden min-h-0"
            style={isThree && idx === 2 ? { gridColumn: '1 / -1' } : undefined}
          >
            {/* Header */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border-b border-white/10 flex-shrink-0 cursor-pointer hover:bg-white/[0.08] transition-colors"
              style={{ borderLeft: `3px solid ${agent.color}` }}
              onClick={() => onSelectAgent(agentId)}
              title={`Go to ${agent.name}`}
            >
              <span className="text-xs font-semibold text-white/80 truncate">{agent.name}</span>
              <span className="text-[10px] text-white/30 truncate">{terminal.name}</span>
              {agent.path && (
                <span className="text-[10px] text-white/20 font-mono truncate ml-auto hidden lg:block">
                  {agent.path.replace(/^\/Users\/[^/]+/, '~')}
                </span>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeTerminal(agentId, terminalIndex); }}
                className="flex-shrink-0 text-white/20 hover:text-red-400 transition-colors ml-auto lg:ml-0"
                aria-label="Remove from monitor"
              >
                <svg width="10" height="10" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 1l6 6M7 1L1 7" /></svg>
              </button>
            </div>
            {/* Terminal */}
            <div className="flex-1 min-h-0">
              <TerminalPanel terminalId={`${agentId}:${terminalIndex}`} cwd={agent.path} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TerminalDropdown({
  items,
  onToggle,
}: {
  items: { agentId: string; agentName: string; agentColor: string; terminalIndex: number; terminalName: string; isSelected: boolean }[];
  onToggle: (agentId: string, terminalIndex: number) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="absolute top-full left-0 mt-1 z-50 w-64 rounded-lg bg-[#1e2128] border border-white/10 py-2 px-3 shadow-xl">
        <p className="text-xs text-white/30">No terminals available. Create an agent with a terminal first.</p>
      </div>
    );
  }

  // Group by agent
  const grouped = new Map<string, typeof items>();
  for (const item of items) {
    const group = grouped.get(item.agentId) || [];
    group.push(item);
    grouped.set(item.agentId, group);
  }

  return (
    <div className="absolute top-full left-0 mt-1 z-50 w-64 max-h-[300px] overflow-y-auto rounded-lg bg-[#1e2128] border border-white/10 py-1 shadow-xl">
      {[...grouped.entries()].map(([agentId, terminals]) => (
        <div key={agentId}>
          <div className="flex items-center gap-2 px-3 py-1.5">
            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: terminals[0].agentColor }} />
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider truncate">{terminals[0].agentName}</span>
          </div>
          {terminals.map((t) => (
            <button
              key={`${t.agentId}:${t.terminalIndex}`}
              type="button"
              onClick={() => onToggle(t.agentId, t.terminalIndex)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/5 transition-colors"
            >
              <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${t.isSelected ? 'border-white/40 bg-white/10' : 'border-white/15'}`}>
                {t.isSelected && (
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 5L4 7L8 3" /></svg>
                )}
              </span>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-white/30 flex-shrink-0"><path d="M2 8L5 5L2 2" /><path d="M6 9H10" /></svg>
              <span className={t.isSelected ? 'text-white/70' : 'text-white/50'}>{t.terminalName}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

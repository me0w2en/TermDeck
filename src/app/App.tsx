import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

import type { ViewMode, Agent, AgentTerminal } from '../types';
import { useAgents } from '../hooks/useAgents';
import { useClaudeMonitor } from '../hooks/useClaudeMonitor';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../hooks/useTheme';
import { useCostHistory } from '../hooks/useCostHistory';

import Background from '../components/layout/Background';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import StatusBar from '../components/layout/StatusBar';
import DashboardView from '../components/dashboard/DashboardView';
import AgentDetailPanel from '../components/agents/AgentDetailPanel';
import AddAgentModal from '../components/agents/AddAgentModal';
import CommandPalette from '../components/common/CommandPalette';
import type { CommandItem } from '../components/common/CommandPalette';
import MonitorView from '../components/monitor/MonitorView';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('termdeck:viewMode');
    return (saved === 'detail' || saved === 'dashboard' || saved === 'monitor') ? saved : 'dashboard';
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('termdeck:sidebar') === 'collapsed';
  });
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  useEffect(() => {
    localStorage.setItem('termdeck:sidebar', sidebarCollapsed ? 'collapsed' : 'open');
  }, [sidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('termdeck:viewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 900) setSidebarCollapsed(true);
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const agents = useAgents();
  const { getAgentSummary, totalCost } = useClaudeMonitor();
  const { toast } = useToast();
  const theme = useTheme();
  const costHistory = useCostHistory();

  const updateAgentRef = useRef(agents.updateAgent);
  updateAgentRef.current = agents.updateAgent;
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const prevClaudeStatuses = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    for (const agent of agents.agents) {
      const summary = getAgentSummary(agent.id);
      const prevStatus = prevClaudeStatuses.current.get(agent.id);

      if (!summary.detected) {
        if (prevStatus !== undefined) {
          prevClaudeStatuses.current.delete(agent.id);
          if (agent.status === 'running') {
            updateAgentRef.current(agent.id, { status: 'idle' });
          }
        }
        continue;
      }

      const newStatus = summary.status === 'running' ? 'running' : 'idle';
      if (prevStatus !== newStatus) {
        prevClaudeStatuses.current.set(agent.id, newStatus);
        updateAgentRef.current(agent.id, { status: newStatus });
        toastRef.current(
          newStatus === 'running'
            ? `${agent.name}: Claude Code started`
            : `${agent.name}: Claude Code finished${summary.cost > 0 ? ` ($${summary.cost.toFixed(2)})` : ''}`,
          'info',
        );
      }
    }
  }, [getAgentSummary, agents.agents]);

  const handleSelectAgent = useCallback(
    (id: string) => {
      agents.selectAgent(id);
      setViewMode('detail');
    },
    [agents],
  );

  const handleAddAgent = useCallback(
    (data: Omit<Agent, 'id' | 'createdAt' | 'terminals'>) => {
      agents.addAgent(data);
      setShowAddModal(false);
      setViewMode('detail');
      toast(`Agent "${data.name}" created`);
    },
    [agents, toast],
  );

  const costRecordRef = useRef(costHistory.record);
  costRecordRef.current = costHistory.record;
  const getAgentSummaryRef = useRef(getAgentSummary);
  getAgentSummaryRef.current = getAgentSummary;
  const agentsListRef = useRef(agents.agents);
  agentsListRef.current = agents.agents;

  useEffect(() => {
    if (totalCost > 0) {
      let totalIn = 0, totalOut = 0;
      for (const a of agentsListRef.current) {
        const s = getAgentSummaryRef.current(a.id);
        totalIn += s.inputTokens;
        totalOut += s.outputTokens;
      }
      costRecordRef.current(totalCost, totalIn, totalOut);
    }
  }, [totalCost]);

  useKeyboardShortcuts(useMemo(() => [
    { key: 'k', meta: true, action: () => setShowCommandPalette((v) => !v), description: 'Command palette' },
    { key: 'n', meta: true, action: () => setShowAddModal(true), description: 'New agent' },
    { key: 'd', meta: true, action: () => setViewMode((v) => v === 'dashboard' ? 'detail' : 'dashboard'), description: 'Toggle view' },
    { key: 'm', meta: true, action: () => setViewMode((v) => v === 'monitor' ? 'dashboard' : 'monitor'), description: 'Monitor view' },
    { key: 'b', meta: true, action: () => setSidebarCollapsed((v) => !v), description: 'Toggle sidebar' },
    { key: '1', meta: true, action: () => { const a = agents.agents[0]; if (a) handleSelectAgent(a.id); }, description: 'Select agent 1' },
    { key: '2', meta: true, action: () => { const a = agents.agents[1]; if (a) handleSelectAgent(a.id); }, description: 'Select agent 2' },
    { key: '3', meta: true, action: () => { const a = agents.agents[2]; if (a) handleSelectAgent(a.id); }, description: 'Select agent 3' },
    { key: '4', meta: true, action: () => { const a = agents.agents[3]; if (a) handleSelectAgent(a.id); }, description: 'Select agent 4' },
    { key: '5', meta: true, action: () => { const a = agents.agents[4]; if (a) handleSelectAgent(a.id); }, description: 'Select agent 5' },
  ], [agents.agents, handleSelectAgent]));

  const paletteCommands = useMemo<CommandItem[]>(() => {
    const cmds: CommandItem[] = [
      { id: 'new-agent', label: 'New Agent', description: 'Create a new agent', shortcut: '⌘N', action: () => setShowAddModal(true) },
      { id: 'toggle-view', label: 'Toggle View', description: 'Switch dashboard/detail', shortcut: '⌘D', action: () => setViewMode((v) => v === 'dashboard' ? 'detail' : 'dashboard') },
      { id: 'toggle-sidebar', label: 'Toggle Sidebar', description: 'Show/hide sidebar', shortcut: '⌘B', action: () => setSidebarCollapsed((v) => !v) },
      { id: 'dashboard', label: 'Go to Dashboard', action: () => setViewMode('dashboard') },
      { id: 'monitor', label: 'Monitor View', description: 'Multi-terminal monitor', shortcut: '⌘M', action: () => setViewMode('monitor') },
      { id: 'theme-cycle', label: 'Change Theme', description: 'Cycle dark / light / system', action: () => theme.cycleTheme() },
    ];
    agents.agents.forEach((a, i) => {
      cmds.push({
        id: `agent-${a.id}`,
        label: `Go to ${a.name}`,
        description: a.path?.replace(/^\/Users\/[^/]+/, '~'),
        shortcut: i < 5 ? `⌘${i + 1}` : undefined,
        action: () => handleSelectAgent(a.id),
      });
    });
    if (agents.selectedAgent) {
      const sa = agents.selectedAgent;
      (['idle', 'running', 'offline'] as const).forEach((s) => {
        cmds.push({
          id: `status-${s}`,
          label: `Set ${sa.name} to ${s}`,
          description: 'Change agent status',
          action: () => agents.updateAgent(sa.id, { status: s }),
        });
      });
      cmds.push({
        id: 'add-terminal',
        label: `Add terminal to ${sa.name}`,
        description: 'Create a new terminal tab',
        action: () => {
          const maxIdx = sa.terminals.reduce((m, t) => Math.max(m, t.index), -1);
          const newIdx = maxIdx + 1;
          agents.updateAgent(sa.id, {
            terminals: [...sa.terminals, { index: newIdx, name: `Terminal ${newIdx + 1}` }],
          });
          toast('Terminal added');
        },
      });
      if (sa.terminals.length > 0) {
        cmds.push({
          id: 'clear-all-terminals',
          label: `Close all terminals of ${sa.name}`,
          description: 'Remove all terminal tabs',
          action: () => {
            sa.terminals.forEach((t) => {
              const tid = `${sa.id}:${t.index}`;
              window.terminal?.kill({ id: tid });
              window.terminal?.clearHistory(tid);
            });
            agents.updateAgent(sa.id, { terminals: [] });
            toast('All terminals closed');
          },
        });
      }
    }
    return cmds;
  }, [agents.agents, agents.selectedAgent, agents.updateAgent, handleSelectAgent, theme]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
      <Background theme={theme.resolved} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar agents={agents} collapsed={sidebarCollapsed} />

        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'ml-0' : 'ml-[280px]'}`}>
          <div
            className="h-10 flex-shrink-0"
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
          />

          <div className="px-3 pb-0">
            <TopBar
              viewMode={viewMode}
              onViewChange={setViewMode}
              onAddAgent={() => setShowAddModal(true)}
              runningCount={agents.statusCounts.running}
              sidebarCollapsed={sidebarCollapsed}
              onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
            />
          </div>

          <main className="flex-1 overflow-y-auto p-4">
            {viewMode === 'dashboard' && (
              <div className="anim-fade-slide is-visible">
                <DashboardView
                  agents={agents.agents}
                  onSelectAgent={handleSelectAgent}
                  onAddAgent={() => setShowAddModal(true)}
                  getClaudeSummary={getAgentSummary}
                />
              </div>
            )}

            {viewMode === 'detail' && agents.selectedAgent && (
              <div key={agents.selectedAgent.id} className="anim-fade-slide is-visible">
                <AgentDetailPanel
                  agent={agents.selectedAgent}
                  onUpdateStatus={(status) =>
                    agents.updateAgent(agents.selectedAgent!.id, { status })
                  }
                  onRemoveAgent={() => {
                    const ag = agents.selectedAgent!;
                    window.terminal?.clearAgentHistory(ag.id);
                    agents.removeAgent(ag.id);
                    setViewMode('dashboard');
                    toast(`Agent "${ag.name}" deleted`);
                  }}
                  onUpdateTerminals={(terminals: AgentTerminal[]) =>
                    agents.updateAgent(agents.selectedAgent!.id, { terminals })
                  }
                  onUpdateName={(name: string) =>
                    agents.updateAgent(agents.selectedAgent!.id, { name })
                  }
                  onUpdateAgent={(updates) =>
                    agents.updateAgent(agents.selectedAgent!.id, updates)
                  }
                  claudeSummary={getAgentSummary(agents.selectedAgent.id)}
                />
              </div>
            )}

            {viewMode === 'monitor' && (
              <div className="anim-fade-slide is-visible h-full">
                <MonitorView
                  agents={agents.agents}
                  onSelectAgent={(id) => { agents.selectAgent(id); setViewMode('detail'); }}
                />
              </div>
            )}

            {viewMode === 'detail' && !agents.selectedAgent && (
              <div className="flex items-center justify-center h-full text-white/30 text-sm">
                <p>Select an agent from the sidebar to view details</p>
              </div>
            )}
          </main>

          <StatusBar
            counts={agents.statusCounts}
            totalCost={totalCost}
            totalAllTimeCost={costHistory.totalAllTime}
            themeMode={theme.mode}
            onCycleTheme={theme.cycleTheme}
          />
        </div>
      </div>

      <AddAgentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddAgent}
      />

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={paletteCommands}
      />
    </div>
  );
}

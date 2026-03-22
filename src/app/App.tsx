import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import type { ViewMode, Agent, AgentTerminal } from '../types';
import { useAgents } from '../hooks/useAgents';
import { useClaudeMonitor } from '../hooks/useClaudeMonitor';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useToast } from '../hooks/useToast';
import { useActivityLog } from '../hooks/useActivityLog';
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

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('termdeck:viewMode');
    return (saved === 'detail' || saved === 'dashboard') ? saved : 'dashboard';
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('termdeck:sidebar') === 'collapsed';
  });
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('termdeck:sidebar', sidebarCollapsed ? 'collapsed' : 'open');
  }, [sidebarCollapsed]);

  // Persist viewMode
  useEffect(() => {
    localStorage.setItem('termdeck:viewMode', viewMode);
  }, [viewMode]);

  // Auto-collapse sidebar on narrow windows
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
  const activity = useActivityLog();
  const theme = useTheme();
  const costHistory = useCostHistory();

  // Auto-update agent status based on Claude Code detection
  // Only auto-update when Claude's OWN status changes (not on every render),
  // so manual overrides by the user are preserved.
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
        // Claude Code was previously detected but now gone → reset to idle
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
        activity.log(
          agent.id,
          newStatus === 'running' ? 'claude_start' : 'claude_done',
          newStatus === 'running' ? 'Claude Code started' : 'Claude Code finished',
          summary.cost > 0 ? `$${summary.cost.toFixed(2)}` : undefined,
        );
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
    (data: Omit<Agent, 'id' | 'createdAt' | 'checklist' | 'terminals'>) => {
      agents.addAgent(data);
      setShowAddModal(false);
      setViewMode('detail');
      toast(`Agent "${data.name}" created`);
    },
    [agents, toast],
  );

  // Record cost history when totalCost changes
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

  // ─── Keyboard Shortcuts ─────────────────────────────────────────────────
  useKeyboardShortcuts(useMemo(() => [
    { key: 'k', meta: true, action: () => setShowCommandPalette((v) => !v), description: 'Command palette' },
    { key: 'n', meta: true, action: () => setShowAddModal(true), description: 'New agent' },
    { key: 'd', meta: true, action: () => setViewMode((v) => v === 'dashboard' ? 'detail' : 'dashboard'), description: 'Toggle view' },
    { key: 'b', meta: true, action: () => setSidebarCollapsed((v) => !v), description: 'Toggle sidebar' },
    { key: '1', meta: true, action: () => { const a = agents.agents[0]; if (a) handleSelectAgent(a.id); }, description: 'Select agent 1' },
    { key: '2', meta: true, action: () => { const a = agents.agents[1]; if (a) handleSelectAgent(a.id); }, description: 'Select agent 2' },
    { key: '3', meta: true, action: () => { const a = agents.agents[2]; if (a) handleSelectAgent(a.id); }, description: 'Select agent 3' },
    { key: '4', meta: true, action: () => { const a = agents.agents[3]; if (a) handleSelectAgent(a.id); }, description: 'Select agent 4' },
    { key: '5', meta: true, action: () => { const a = agents.agents[4]; if (a) handleSelectAgent(a.id); }, description: 'Select agent 5' },
  ], [agents.agents, handleSelectAgent]));

  // ─── Command Palette ────────────────────────────────────────────────────
  const paletteCommands = useMemo<CommandItem[]>(() => {
    const cmds: CommandItem[] = [
      { id: 'new-agent', label: 'New Agent', description: 'Create a new agent', shortcut: '⌘N', action: () => setShowAddModal(true) },
      { id: 'toggle-view', label: 'Toggle View', description: 'Switch dashboard/detail', shortcut: '⌘D', action: () => setViewMode((v) => v === 'dashboard' ? 'detail' : 'dashboard') },
      { id: 'toggle-sidebar', label: 'Toggle Sidebar', description: 'Show/hide sidebar', shortcut: '⌘B', action: () => setSidebarCollapsed((v) => !v) },
      { id: 'dashboard', label: 'Go to Dashboard', action: () => setViewMode('dashboard') },
      { id: 'theme-cycle', label: 'Change Theme', description: 'Cycle dark / light / system', action: () => theme.cycleTheme() },
    ];
    // Agent-specific commands
    agents.agents.forEach((a, i) => {
      cmds.push({
        id: `agent-${a.id}`,
        label: `Go to ${a.name}`,
        description: a.path?.replace(/^\/Users\/[^/]+/, '~'),
        shortcut: i < 5 ? `⌘${i + 1}` : undefined,
        action: () => handleSelectAgent(a.id),
      });
    });
    // Selected agent commands
    if (agents.selectedAgent) {
      const sa = agents.selectedAgent;
      // Status change
      (['idle', 'running', 'offline'] as const).forEach((s) => {
        cmds.push({
          id: `status-${s}`,
          label: `Set ${sa.name} to ${s}`,
          description: 'Change agent status',
          action: () => agents.updateAgent(sa.id, { status: s }),
        });
      });
      // Terminal commands
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

  const { totalTasks, completedTasks } = useMemo(() => {
    let total = 0;
    let completed = 0;
    agents.agents.forEach((a) => {
      total += a.checklist.length;
      completed += a.checklist.filter((i) => i.completed).length;
    });
    return { totalTasks: total, completedTasks: completed };
  }, [agents.agents]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
      <Background theme={theme.resolved} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar agents={agents} collapsed={sidebarCollapsed} />

        {/* Main Content */}
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'ml-0' : 'ml-[280px]'}`}>
          {/* Draggable spacer for macOS traffic lights */}
          <div
            className="h-10 flex-shrink-0"
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
          />

          {/* Top Bar */}
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

          {/* View Content */}
          <main className="flex-1 overflow-y-auto p-4">
            <AnimatePresence mode="wait">
              {viewMode === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <DashboardView
                    agents={agents.agents}
                    onSelectAgent={handleSelectAgent}
                    onAddAgent={() => setShowAddModal(true)}
                    getClaudeSummary={getAgentSummary}
                    getLastActivity={(id) => {
                      const evts = activity.getAgentEvents(id);
                      return evts.length > 0 ? evts[evts.length - 1].timestamp : null;
                    }}
                  />
                </motion.div>
              )}

              {viewMode === 'detail' && agents.selectedAgent && (
                <motion.div
                  key={`detail-${agents.selectedAgent.id}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <AgentDetailPanel
                    agent={agents.selectedAgent}
                    onUpdateStatus={(status) =>
                      agents.updateAgent(agents.selectedAgent!.id, { status })
                    }
                    onAddChecklistItem={(title) =>
                      agents.addChecklistItem(agents.selectedAgent!.id, title)
                    }
                    onToggleChecklistItem={(itemId) =>
                      agents.toggleChecklistItem(agents.selectedAgent!.id, itemId)
                    }
                    onRemoveChecklistItem={(itemId) =>
                      agents.removeChecklistItem(agents.selectedAgent!.id, itemId)
                    }
                    onEditChecklistItem={(itemId, title) =>
                      agents.editChecklistItem(agents.selectedAgent!.id, itemId, title)
                    }
                    onMoveChecklistItem={(itemId, direction) =>
                      agents.moveChecklistItem(agents.selectedAgent!.id, itemId, direction)
                    }
                    onClearCompletedItems={() =>
                      agents.clearCompletedItems(agents.selectedAgent!.id)
                    }
                    onUpdateTerminals={(terminals: AgentTerminal[]) =>
                      agents.updateAgent(agents.selectedAgent!.id, { terminals })
                    }
                    onUpdateName={(name: string) =>
                      agents.updateAgent(agents.selectedAgent!.id, { name })
                    }
                    onUpdateAgent={(updates) =>
                      agents.updateAgent(agents.selectedAgent!.id, updates)
                    }
                    onRemoveAgent={() => {
                      const ag = agents.selectedAgent!;
                      window.terminal?.clearAgentHistory(ag.id);
                      agents.removeAgent(ag.id);
                      activity.clearAgentEvents(ag.id);
                      setViewMode('dashboard');
                      toast(`Agent "${ag.name}" deleted`);
                    }}
                    claudeSummary={getAgentSummary(agents.selectedAgent.id)}
                    activityEvents={activity.getAgentEvents(agents.selectedAgent.id)}
                    onClearActivity={() => activity.clearAgentEvents(agents.selectedAgent!.id)}
                  />
                </motion.div>
              )}

              {viewMode === 'detail' && !agents.selectedAgent && (
                <motion.div
                  key="no-agent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center h-full text-white/30 text-sm"
                >
                  <p>Select an agent from the sidebar to view details</p>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Status Bar */}
          <StatusBar
            counts={agents.statusCounts}
            totalTasks={totalTasks}
            completedTasks={completedTasks}
            totalCost={totalCost}
            totalAllTimeCost={costHistory.totalAllTime}
            themeMode={theme.mode}
            onCycleTheme={theme.cycleTheme}
          />
        </div>
      </div>

      {/* Add Agent Modal */}
      <AddAgentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddAgent}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={paletteCommands}
      />
    </div>
  );
}

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import type { ViewMode, Agent, AgentTerminal } from '../types';
import { useAgents } from '../hooks/useAgents';
import { useClaudeMonitor } from '../hooks/useClaudeMonitor';

import Background from '../components/layout/Background';
import Sidebar from '../components/layout/Sidebar';
import TopBar from '../components/layout/TopBar';
import StatusBar from '../components/layout/StatusBar';
import DashboardView from '../components/dashboard/DashboardView';
import AgentDetailPanel from '../components/agents/AgentDetailPanel';
import AddAgentModal from '../components/agents/AddAgentModal';

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);

  const agents = useAgents();
  const { getAgentSummary, totalCost } = useClaudeMonitor();

  // Auto-update agent status based on Claude Code detection
  // Only auto-update when Claude's OWN status changes (not on every render),
  // so manual overrides by the user are preserved.
  const updateAgentRef = useRef(agents.updateAgent);
  updateAgentRef.current = agents.updateAgent;
  const prevClaudeStatuses = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    for (const agent of agents.agents) {
      const summary = getAgentSummary(agent.id);
      if (!summary.detected) {
        prevClaudeStatuses.current.delete(agent.id);
        continue;
      }
      const newStatus = summary.status === 'running' ? 'running' : 'idle';
      const prevStatus = prevClaudeStatuses.current.get(agent.id);
      if (prevStatus !== newStatus) {
        prevClaudeStatuses.current.set(agent.id, newStatus);
        updateAgentRef.current(agent.id, { status: newStatus });
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
    },
    [agents],
  );

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
      <Background />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar agents={agents} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden ml-[280px]">
          {/* Top Bar */}
          <div className="p-3 pb-0">
            <TopBar
              viewMode={viewMode}
              onViewChange={setViewMode}
              onAddAgent={() => setShowAddModal(true)}
              runningCount={agents.statusCounts.running}
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
                    getClaudeSummary={getAgentSummary}
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
                    onUpdateTerminals={(terminals: AgentTerminal[]) =>
                      agents.updateAgent(agents.selectedAgent!.id, { terminals })
                    }
                    onRemoveAgent={() => {
                      const id = agents.selectedAgent!.id;
                      window.terminal?.clearAgentHistory(id);
                      agents.removeAgent(id);
                      setViewMode('dashboard');
                    }}
                    claudeSummary={getAgentSummary(agents.selectedAgent.id)}
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
          />
        </div>
      </div>

      {/* Add Agent Modal */}
      <AddAgentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddAgent}
      />
    </div>
  );
}

export type AgentStatus = 'idle' | 'running' | 'offline';

export type ViewMode = 'dashboard' | 'detail';

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface AgentTerminal {
  index: number;
  name: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  color: string;
  path?: string;
  checklist: ChecklistItem[];
  terminals: AgentTerminal[];
  createdAt: string;
}

export interface ClaudeAgentSummary {
  detected: boolean;
  status: 'idle' | 'running';
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface UseAgentsReturn {
  agents: Agent[];
  selectedId: string | null;
  selectedAgent: Agent | null;
  selectAgent: (id: string) => void;
  addAgent: (data: Omit<Agent, 'id' | 'createdAt' | 'checklist' | 'terminals'>) => void;
  removeAgent: (id: string) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  addChecklistItem: (agentId: string, title: string) => void;
  toggleChecklistItem: (agentId: string, itemId: string) => void;
  removeChecklistItem: (agentId: string, itemId: string) => void;
  filterText: string;
  setFilterText: (text: string) => void;
  filteredAgents: Agent[];
  statusCounts: Record<AgentStatus, number>;
}

export interface SidebarProps {
  agents: UseAgentsReturn;
}

export interface AgentListItemProps {
  agent: Agent;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export interface TopBarProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  onAddAgent: () => void;
  runningCount: number;
}

export interface StatusBarProps {
  counts: Record<AgentStatus, number>;
  totalTasks: number;
  completedTasks: number;
  totalCost: number;
}

export interface DashboardViewProps {
  agents: Agent[];
  onSelectAgent: (id: string) => void;
  getClaudeSummary: (agentId: string) => ClaudeAgentSummary;
}

export interface AgentDetailPanelProps {
  agent: Agent;
  onUpdateStatus: (status: AgentStatus) => void;
  onAddChecklistItem: (title: string) => void;
  onToggleChecklistItem: (itemId: string) => void;
  onRemoveChecklistItem: (itemId: string) => void;
  onRemoveAgent: () => void;
  onUpdateTerminals: (terminals: AgentTerminal[]) => void;
  claudeSummary: ClaudeAgentSummary;
}

export interface ChecklistProps {
  items: ChecklistItem[];
  onAdd: (title: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  accentColor: string;
}

export interface TerminalPanelProps {
  terminalId: string;
  cwd?: string;
}

export interface TerminalContainerProps {
  agent: Agent;
  onUpdateTerminals: (terminals: AgentTerminal[]) => void;
}

export interface InitialAvatarProps {
  name: string;
  color: string;
  size?: number;
}

export interface AddAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: Omit<Agent, 'id' | 'createdAt' | 'checklist' | 'terminals'>) => void;
}

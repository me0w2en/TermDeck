export type AgentStatus = 'idle' | 'running' | 'offline';

export type ViewMode = 'dashboard' | 'detail' | 'monitor';

export interface AgentTerminal {
  index: number;
  name: string;
}

export interface Agent {
  id: string;
  name: string;
  role?: string;
  status: AgentStatus;
  color: string;
  path?: string;
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
  addAgent: (data: Omit<Agent, 'id' | 'createdAt' | 'terminals'>) => void;
  removeAgent: (id: string) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  moveAgent: (id: string, direction: 'up' | 'down') => void;
  filterText: string;
  setFilterText: (text: string) => void;
  filteredAgents: Agent[];
  statusCounts: Record<AgentStatus, number>;
}

export interface SidebarProps {
  agents: UseAgentsReturn;
  collapsed: boolean;
}

export interface AgentListItemProps {
  agent: Agent;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRename?: () => void;
  onSetStatus?: (status: AgentStatus) => void;
}

export interface TopBarProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  onAddAgent: () => void;
  runningCount: number;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export interface StatusBarProps {
  counts: Record<AgentStatus, number>;
  totalCost: number;
  totalAllTimeCost?: number;
  themeMode?: import('../hooks/useTheme').ThemeMode;
  onCycleTheme?: () => void;
}

export interface DashboardViewProps {
  agents: Agent[];
  onSelectAgent: (id: string) => void;
  onAddAgent?: () => void;
  getClaudeSummary: (agentId: string) => ClaudeAgentSummary;
}

export interface AgentDetailPanelProps {
  agent: Agent;
  onUpdateStatus: (status: AgentStatus) => void;
  onRemoveAgent: () => void;
  onUpdateTerminals: (terminals: AgentTerminal[]) => void;
  onUpdateName: (name: string) => void;
  onUpdateAgent: (updates: Partial<Agent>) => void;
  claudeSummary: ClaudeAgentSummary;
}

export interface TerminalPanelProps {
  terminalId: string;
  cwd?: string;
}

export interface TerminalContainerProps {
  agent: Agent;
  onUpdateTerminals: (terminals: AgentTerminal[]) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export interface InitialAvatarProps {
  name: string;
  color: string;
  size?: number;
}

export interface AddAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: Omit<Agent, 'id' | 'createdAt' | 'terminals'>) => void;
}

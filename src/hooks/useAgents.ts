import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Agent, AgentStatus, UseAgentsReturn } from '../types';

const STORAGE_KEY = 'termdeck:agents';
const SELECTION_KEY = 'termdeck:selected';

function loadAgents(): Agent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const agents = JSON.parse(raw) as Agent[];
    return agents.map(({ checklist, avatarStyle, ...rest }: Agent & { checklist?: unknown; avatarStyle?: unknown }) => ({
      ...rest,
      terminals: rest.terminals ?? [{ index: 0, name: 'Terminal 1' }],
      status: rest.status === 'running' ? 'idle' : rest.status,
    }));
  } catch {
    return [];
  }
}

function loadSelection(agents: Agent[]): string | null {
  const saved = localStorage.getItem(SELECTION_KEY);
  if (saved && agents.some((a) => a.id === saved)) return saved;
  return agents.length > 0 ? agents[0].id : null;
}

export function useAgents(): UseAgentsReturn {
  const [agents, setAgents] = useState<Agent[]>(loadAgents);
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    loadSelection(loadAgents()),
  );
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
  }, [agents]);

  useEffect(() => {
    if (selectedId) localStorage.setItem(SELECTION_KEY, selectedId);
    else localStorage.removeItem(SELECTION_KEY);
  }, [selectedId]);

  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedId) ?? null,
    [agents, selectedId],
  );

  const filteredAgents = useMemo(() => {
    if (!filterText) return agents;
    const q = filterText.toLowerCase();
    return agents.filter(
      (a) => a.name.toLowerCase().includes(q) || (a.role && a.role.toLowerCase().includes(q)),
    );
  }, [agents, filterText]);

  const statusCounts = useMemo(() => {
    const counts: Record<AgentStatus, number> = { idle: 0, running: 0, offline: 0 };
    agents.forEach((a) => { counts[a.status]++; });
    return counts;
  }, [agents]);

  const selectAgent = useCallback((id: string) => setSelectedId(id), []);

  const addAgent = useCallback(
    (data: Omit<Agent, 'id' | 'createdAt' | 'terminals'>) => {
      const agent: Agent = {
        ...data,
        id: crypto.randomUUID(),
        terminals: [{ index: 0, name: 'Terminal 1' }],
        createdAt: new Date().toISOString(),
      };
      setAgents((prev) => [...prev, agent]);
      setSelectedId(agent.id);
    },
    [],
  );

  const removeAgent = useCallback((id: string) => {
    setAgents((prev) => {
      const next = prev.filter((a) => a.id !== id);
      setSelectedId((cur) => {
        if (cur !== id) return cur;
        return next.length > 0 ? next[0].id : null;
      });
      return next;
    });
  }, []);

  const updateAgent = useCallback(
    (id: string, updates: Partial<Agent>) => {
      setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    },
    [],
  );

  return {
    agents,
    selectedId,
    selectedAgent,
    selectAgent,
    addAgent,
    removeAgent,
    updateAgent,
    moveAgent: useCallback((id: string, direction: 'up' | 'down') => {
      setAgents((prev) => {
        const idx = prev.findIndex((a) => a.id === id);
        if (idx === -1) return prev;
        const target = direction === 'up' ? idx - 1 : idx + 1;
        if (target < 0 || target >= prev.length) return prev;
        const next = [...prev];
        [next[idx], next[target]] = [next[target], next[idx]];
        return next;
      });
    }, []),
    filterText,
    setFilterText: useCallback((t: string) => setFilterText(t), []),
    filteredAgents,
    statusCounts,
  };
}

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Agent, AgentStatus, ChecklistItem, UseAgentsReturn } from '../types';

const STORAGE_KEY = 'termdeck:agents';
const SELECTION_KEY = 'termdeck:selected';

function loadAgents(): Agent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const agents = JSON.parse(raw) as Agent[];
    return agents.map(({ avatarStyle, ...rest }: Agent & { avatarStyle?: unknown }) => ({
      ...rest,
      terminals: rest.terminals ?? [{ index: 0, name: 'Terminal 1' }],
      // Reset running status on load — actual status is determined by Claude monitor
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

  // Persist agents
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
  }, [agents]);

  // Persist selection
  useEffect(() => {
    if (selectedId) localStorage.setItem(SELECTION_KEY, selectedId);
    else localStorage.removeItem(SELECTION_KEY);
  }, [selectedId]);

  // ─── Computed ──────────────────────────────────────────────────────────────

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

  // ─── Agent CRUD ────────────────────────────────────────────────────────────

  const selectAgent = useCallback((id: string) => setSelectedId(id), []);

  const addAgent = useCallback(
    (data: Omit<Agent, 'id' | 'createdAt' | 'checklist' | 'terminals'>) => {
      const agent: Agent = {
        ...data,
        id: crypto.randomUUID(),
        checklist: [],
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

  // ─── Checklist ─────────────────────────────────────────────────────────────

  const addChecklistItem = useCallback((agentId: string, title: string) => {
    if (!title.trim()) return;
    const item: ChecklistItem = { id: crypto.randomUUID(), title: title.trim(), completed: false };
    setAgents((prev) =>
      prev.map((a) =>
        a.id === agentId ? { ...a, checklist: [...a.checklist, item] } : a,
      ),
    );
  }, []);

  const toggleChecklistItem = useCallback((agentId: string, itemId: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id !== agentId) return a;
        return {
          ...a,
          checklist: a.checklist.map((i) =>
            i.id === itemId ? { ...i, completed: !i.completed } : i,
          ),
        };
      }),
    );
  }, []);

  const removeChecklistItem = useCallback((agentId: string, itemId: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id !== agentId) return a;
        return { ...a, checklist: a.checklist.filter((i) => i.id !== itemId) };
      }),
    );
  }, []);

  const editChecklistItem = useCallback((agentId: string, itemId: string, title: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id !== agentId) return a;
        return {
          ...a,
          checklist: a.checklist.map((i) => (i.id === itemId ? { ...i, title } : i)),
        };
      }),
    );
  }, []);

  const moveChecklistItem = useCallback((agentId: string, itemId: string, direction: 'up' | 'down') => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id !== agentId) return a;
        const idx = a.checklist.findIndex((i) => i.id === itemId);
        if (idx === -1) return a;
        const target = direction === 'up' ? idx - 1 : idx + 1;
        if (target < 0 || target >= a.checklist.length) return a;
        const next = [...a.checklist];
        [next[idx], next[target]] = [next[target], next[idx]];
        return { ...a, checklist: next };
      }),
    );
  }, []);

  const clearCompletedItems = useCallback((agentId: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id !== agentId) return a;
        return { ...a, checklist: a.checklist.filter((i) => !i.completed) };
      }),
    );
  }, []);

  return {
    agents,
    selectedId,
    selectedAgent,
    selectAgent,
    addAgent,
    removeAgent,
    updateAgent,
    addChecklistItem,
    toggleChecklistItem,
    removeChecklistItem,
    editChecklistItem,
    moveChecklistItem,
    clearCompletedItems,
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

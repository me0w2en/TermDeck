import { useState, useCallback, useEffect } from 'react';

export interface ActivityEvent {
  id: string;
  agentId: string;
  type: 'claude_start' | 'claude_done' | 'terminal_open' | 'terminal_close' | 'agent_created' | 'status_change';
  message: string;
  timestamp: string;
  meta?: string;
}

const MAX_EVENTS = 100;
const STORAGE_KEY = 'termdeck:activity';

function loadEvents(): ActivityEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function useActivityLog() {
  const [events, setEvents] = useState<ActivityEvent[]>(loadEvents);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  const log = useCallback((agentId: string, type: ActivityEvent['type'], message: string, meta?: string) => {
    const event: ActivityEvent = {
      id: crypto.randomUUID(),
      agentId,
      type,
      message,
      timestamp: new Date().toISOString(),
      meta,
    };
    setEvents((prev) => [...prev, event].slice(-MAX_EVENTS));
  }, []);

  const getAgentEvents = useCallback(
    (agentId: string) => events.filter((e) => e.agentId === agentId),
    [events],
  );

  const clearAgentEvents = useCallback((agentId: string) => {
    setEvents((prev) => prev.filter((e) => e.agentId !== agentId));
  }, []);

  return { events, log, getAgentEvents, clearAgentEvents };
}

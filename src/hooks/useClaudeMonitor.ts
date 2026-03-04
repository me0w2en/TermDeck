import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ClaudeAgentSummary } from '../types';

interface TerminalClaudeState {
  detected: boolean;
  status: 'idle' | 'running';
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

const defaultSummary: ClaudeAgentSummary = {
  detected: false,
  status: 'idle',
  inputTokens: 0,
  outputTokens: 0,
  cost: 0,
};

function extractAgentId(terminalId: string): string {
  const sep = terminalId.lastIndexOf(':');
  return sep === -1 ? terminalId : terminalId.substring(0, sep);
}

export function useClaudeMonitor() {
  const [stateMap, setStateMap] = useState<Map<string, TerminalClaudeState>>(
    () => new Map(),
  );

  useEffect(() => {
    if (!window.terminal?.onClaudeState) return;

    const cleanup = window.terminal.onClaudeState((data) => {
      // Validate IPC data defensively
      if (!data || typeof data.id !== 'string') return;
      const status = data.status === 'running' ? 'running' : 'idle';
      const inputTokens = typeof data.inputTokens === 'number' && Number.isFinite(data.inputTokens)
        ? Math.max(0, data.inputTokens) : 0;
      const outputTokens = typeof data.outputTokens === 'number' && Number.isFinite(data.outputTokens)
        ? Math.max(0, data.outputTokens) : 0;
      const cost = typeof data.cost === 'number' && Number.isFinite(data.cost)
        ? Math.max(0, data.cost) : 0;

      setStateMap((prev) => {
        const next = new Map(prev);
        next.set(data.id, {
          detected: !!data.detected,
          status,
          inputTokens,
          outputTokens,
          cost,
        });
        return next;
      });
    });

    return cleanup;
  }, []);

  const getAgentSummary = useCallback(
    (agentId: string): ClaudeAgentSummary => {
      let detected = false;
      let hasRunning = false;
      let inputTokens = 0;
      let outputTokens = 0;
      let cost = 0;

      for (const [termId, state] of stateMap) {
        if (extractAgentId(termId) !== agentId) continue;
        if (!state.detected) continue;
        detected = true;
        if (state.status === 'running') hasRunning = true;
        inputTokens += state.inputTokens;
        outputTokens += state.outputTokens;
        cost += state.cost;
      }

      if (!detected) return defaultSummary;

      return {
        detected,
        status: hasRunning ? 'running' : 'idle',
        inputTokens,
        outputTokens,
        cost,
      };
    },
    [stateMap],
  );

  const totalCost = useMemo(() => {
    let sum = 0;
    for (const [, state] of stateMap) {
      if (state.detected) sum += state.cost;
    }
    return sum;
  }, [stateMap]);

  return { getAgentSummary, totalCost };
}

import { useState, useEffect, useCallback } from 'react';

interface CostEntry {
  date: string; // YYYY-MM-DD
  cost: number;
  inputTokens: number;
  outputTokens: number;
}

const STORAGE_KEY = 'termdeck:cost-history';
const MAX_DAYS = 30;

function loadHistory(): CostEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useCostHistory() {
  const [history, setHistory] = useState<CostEntry[]>(loadHistory);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const record = useCallback((cost: number, inputTokens: number, outputTokens: number) => {
    if (cost <= 0 && inputTokens <= 0 && outputTokens <= 0) return;
    setHistory((prev) => {
      const d = today();
      const existing = prev.find((e) => e.date === d);
      let next: CostEntry[];
      if (existing) {
        next = prev.map((e) =>
          e.date === d
            ? { ...e, cost: Math.max(e.cost, cost), inputTokens: Math.max(e.inputTokens, inputTokens), outputTokens: Math.max(e.outputTokens, outputTokens) }
            : e,
        );
      } else {
        next = [...prev, { date: d, cost, inputTokens, outputTokens }];
      }
      return next.slice(-MAX_DAYS);
    });
  }, []);

  const totalAllTime = history.reduce((sum, e) => sum + e.cost, 0);

  return { history, record, totalAllTime };
}

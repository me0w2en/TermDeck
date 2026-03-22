import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'dark' | 'light' | 'system';

function getSystemTheme(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode: ThemeMode): 'dark' | 'light' {
  return mode === 'system' ? getSystemTheme() : mode;
}

const STORAGE_KEY = 'termdeck:theme';

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'dark';
  });

  const resolved = resolveTheme(mode);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  // Apply theme class on <html>
  useEffect(() => {
    const el = document.documentElement;
    el.classList.remove('theme-dark', 'theme-light');
    el.classList.add(`theme-${resolved}`);
  }, [resolved]);

  // Listen to system theme changes
  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const el = document.documentElement;
      el.classList.remove('theme-dark', 'theme-light');
      el.classList.add(`theme-${getSystemTheme()}`);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const cycleTheme = useCallback(() => {
    setMode((prev) => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'system';
      return 'dark';
    });
  }, []);

  return { mode, resolved, setMode, cycleTheme };
}

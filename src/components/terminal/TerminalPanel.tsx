import { useEffect, useRef, useState } from 'react';
import type { TerminalPanelProps } from '../../types';

/**
 * Terminal panel that connects to a pty process in the Electron main process
 * via the window.terminal API exposed by preload.js.
 *
 * xterm.js is loaded dynamically to avoid bundling issues and to handle
 * the case where the app runs in a browser (no Electron).
 */
export default function TerminalPanel({ terminalId, cwd }: TerminalPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<unknown>(null);
  const fitAddonRef = useRef<unknown>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Check if terminal API is available
    if (!window.terminal) {
      setError('Terminal API not available. Run this app with Electron.');
      return;
    }

    let disposed = false;

    async function init() {
      try {
        // Dynamic import to avoid bundling xterm when not needed
        const [{ Terminal }, { FitAddon }, { Unicode11Addon }] = await Promise.all([
          import('@xterm/xterm'),
          import('@xterm/addon-fit'),
          import('@xterm/addon-unicode11'),
        ]);

        // xterm CSS is imported in main.tsx

        if (disposed || !containerRef.current) return;

        const term = new Terminal({
          theme: {
            background: '#111318',
            foreground: '#e2e8f0',
            cursor: '#a0aec0',
            cursorAccent: '#111318',
            selectionBackground: '#a0aec033',
            black: '#1a1e36',
            red: '#f43f5e',
            green: '#10b981',
            yellow: '#f59e0b',
            blue: '#3b82f6',
            magenta: '#8b5cf6',
            cyan: '#06b6d4',
            white: '#e2e8f0',
            brightBlack: '#4a5568',
            brightRed: '#fb7185',
            brightGreen: '#34d399',
            brightYellow: '#fbbf24',
            brightBlue: '#60a5fa',
            brightMagenta: '#a78bfa',
            brightCyan: '#22d3ee',
            brightWhite: '#f8fafc',
          },
          fontSize: 13,
          fontFamily: '"Source Code Pro for Powerline", "SF Mono", Menlo, Monaco, "Courier New", monospace, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"',
          cursorBlink: true,
          cursorStyle: 'bar',
          scrollback: 5000,
          allowProposedApi: true,
        });

        const fitAddon = new FitAddon();
        const unicode11Addon = new Unicode11Addon();
        term.loadAddon(fitAddon);
        term.loadAddon(unicode11Addon);
        term.unicode.activeVersion = '11';
        term.open(containerRef.current);

        // Small delay to ensure DOM is settled before fitting
        requestAnimationFrame(() => {
          if (!disposed) fitAddon.fit();
        });

        termRef.current = term;
        fitAddonRef.current = fitAddon;

        // Restore previous session history before connecting live pty
        const history = await window.terminal.loadHistory(terminalId);
        if (history && !disposed) {
          term.write(history);
        }

        // Create pty process in main
        const created = await window.terminal.create({
          id: terminalId,
          cols: term.cols,
          rows: term.rows,
          ...(cwd && { cwd }),
        });

        if (!created) {
          term.writeln('\x1b[33mnode-pty is not installed.\x1b[0m');
          term.writeln('');
          term.writeln('To enable terminal functionality:');
          term.writeln('  \x1b[36mnpm run rebuild\x1b[0m');
          term.writeln('');
          term.writeln('Then restart the app.');
          return;
        }

        // Wire pty output → xterm
        const removeDataListener = window.terminal.onData(terminalId, (data: string) => {
          if (!disposed) term.write(data);
        });

        // Wire pty exit
        const removeExitListener = window.terminal.onExit(terminalId, () => {
          if (!disposed) {
            term.writeln('');
            term.writeln('\x1b[90m[Process exited]\x1b[0m');
          }
        });

        // Wire xterm input → pty
        const inputDisposable = term.onData((data: string) => {
          window.terminal.write({ id: terminalId, data });
        });

        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
          if (disposed) return;
          fitAddon.fit();
          window.terminal.resize({ id: terminalId, cols: term.cols, rows: term.rows });
        });
        resizeObserver.observe(containerRef.current!);

        // Store cleanup — disconnect UI only, keep pty alive
        cleanupRef.current = () => {
          resizeObserver.disconnect();
          removeDataListener();
          removeExitListener();
          inputDisposable.dispose();
          term.dispose();
        };
      } catch (err) {
        if (!disposed) {
          setError(`Terminal init failed: ${err instanceof Error ? err.message : err}`);
        }
      }
    }

    init();

    return () => {
      disposed = true;
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [terminalId]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg bg-black/30 p-6">
        <div className="text-center text-sm text-white/40">
          <svg
            className="mx-auto mb-3 text-white/20"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <path d="M4 17L10 11L4 5" />
            <path d="M12 19H20" />
          </svg>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden rounded-lg bg-[#111318]"
    />
  );
}

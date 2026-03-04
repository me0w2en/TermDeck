export {};

declare global {
  interface Window {
    terminal: {
      create: (opts: { id: string; cols: number; rows: number; cwd?: string }) => Promise<boolean>;
      write: (opts: { id: string; data: string }) => Promise<void>;
      resize: (opts: { id: string; cols: number; rows: number }) => Promise<void>;
      kill: (opts: { id: string }) => Promise<void>;
      loadHistory: (id: string) => Promise<string>;
      clearHistory: (id: string) => Promise<void>;
      clearAgentHistory: (agentId: string) => Promise<void>;
      onData: (id: string, callback: (data: string) => void) => () => void;
      onExit: (id: string, callback: (code: number) => void) => () => void;
      onClaudeState: (callback: (data: {
        id: string;
        detected: boolean;
        status: 'idle' | 'running';
        inputTokens: number;
        outputTokens: number;
        cost: number;
      }) => void) => () => void;
    };
    electronAPI: {
      platform: string;
      openDirectory: () => Promise<string | null>;
    };
  }
}

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  openDirectory: () => ipcRenderer.invoke('dialog:open-directory'),
});

contextBridge.exposeInMainWorld('terminal', {
  create: (opts) => ipcRenderer.invoke('terminal:create', opts),
  write: (opts) => ipcRenderer.invoke('terminal:write', opts),
  resize: (opts) => ipcRenderer.invoke('terminal:resize', opts),
  kill: (opts) => ipcRenderer.invoke('terminal:kill', opts),
  loadHistory: (id) => ipcRenderer.invoke('terminal:load-history', { id }),
  clearHistory: (id) => ipcRenderer.invoke('terminal:clear-history', { id }),
  clearAgentHistory: (agentId) => ipcRenderer.invoke('terminal:clear-agent-history', { agentId }),

  onData: (id, callback) => {
    const channel = `terminal:data:${id}`;
    const handler = (_event, data) => callback(data);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },

  onExit: (id, callback) => {
    const channel = `terminal:exit:${id}`;
    const handler = (_event, code) => callback(code);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },

  onClaudeState: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('terminal:claude-state', handler);
    return () => ipcRenderer.removeListener('terminal:claude-state', handler);
  },
});

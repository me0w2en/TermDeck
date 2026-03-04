const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

let pty;
try {
  pty = require('node-pty');
} catch {
  console.warn('[TermDeck] node-pty not available. Run: npm run rebuild');
}

const isDev = !app.isPackaged;

const terminals = new Map();
const sessionStreams = new Map();

// ── Claude Code Monitor ──────────────────────────────────────────────────────

const claudeStates = new Map();

function stripAnsi(str) {
  // eslint-disable-next-line no-control-regex
  return str
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, '')
    .replace(/\x1b\[\?[0-9;]*[a-zA-Z]/g, '')
    .replace(/\x1b[()][A-Z0-9]/g, '')
    .replace(/\x1b[>=]/g, '')
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
}

const CLAUDE_SPINNERS = /[✻✽✶✳✢]/;
const TOKEN_MAX = 100_000_000;
const COST_MAX = 10_000;

function safeParseTokens(str, hasK) {
  const raw = parseFloat(str);
  if (!Number.isFinite(raw) || raw < 0) return 0;
  const val = hasK ? Math.round(raw * 1000) : Math.round(raw);
  return Math.min(val, TOKEN_MAX);
}

function monitorClaudeOutput(id, rawData, sender) {
  const prev = claudeStates.get(id) || {
    detected: false, status: 'idle',
    inputTokens: 0, outputTokens: 0, cost: 0,
  };
  let changed = false;
  const state = { ...prev };

  const safeRaw = rawData.length > 16384 ? rawData.slice(0, 16384) : rawData;
  const clean = stripAnsi(safeRaw);

  // ─── 1. Detection ─────────────────────────────────────────────────────────

  if (!state.detected) {
    if (safeRaw.includes('Claude Code') || clean.includes('Claude Code')) {
      state.detected = true;
      state.status = 'idle';
      changed = true;
    }
    if (!state.detected) return;
  }

  if (safeRaw.indexOf('\x1b]7;') !== -1 && !safeRaw.includes('Claude Code')) {
    state.detected = false;
    state.status = 'idle';
    state.inputTokens = 0;
    state.outputTokens = 0;
    state.cost = 0;
    claudeStates.set(id, state);
    if (sender && !sender.isDestroyed()) {
      sender.send('terminal:claude-state', { id, ...state });
    }
    return;
  }

  // ─── 2. Status ────────────────────────────────────────────────────────────

  const hasSpinner = CLAUDE_SPINNERS.test(clean);
  const isThinking = clean.includes('(thinking)');
  const isRunning = hasSpinner || isThinking;

  if (isRunning) {
    if (state.status !== 'running') {
      state.status = 'running';
      changed = true;
    }
  } else {
    const hasDone = clean.includes('Done (') || clean.includes('Done(');
    const hasPrompt = clean.includes('❯');
    if (hasDone || hasPrompt) {
      if (state.status !== 'idle') {
        state.status = 'idle';
        changed = true;
      }
    }
  }

  // ─── 3. Token parsing ─────────────────────────────────────────────────────

  const inMatch = clean.match(/↑\s{0,3}(\d{1,7}(?:\.\d{1,2})?)\s{0,3}(k)?\s{0,3}tokens/i);
  if (inMatch) {
    const newVal = safeParseTokens(inMatch[1], !!inMatch[2]);
    if (newVal !== state.inputTokens) {
      state.inputTokens = newVal;
      changed = true;
    }
  }

  const outMatch = clean.match(/↓\s{0,3}(\d{1,7}(?:\.\d{1,2})?)\s{0,3}(k)?\s{0,3}tokens/i);
  if (outMatch) {
    const newVal = safeParseTokens(outMatch[1], !!outMatch[2]);
    if (newVal !== state.outputTokens) {
      state.outputTokens = newVal;
      changed = true;
    }
  }

  const doneIdx = clean.indexOf('Done');
  if (doneIdx !== -1) {
    const doneWindow = clean.substring(doneIdx, doneIdx + 120);
    const doneMatch = doneWindow.match(/(\d{1,7}(?:\.\d{1,2})?)\s{0,3}(k)?\s{0,3}tokens/i);
    if (doneMatch) {
      const total = safeParseTokens(doneMatch[1], !!doneMatch[2]);
      let newOut;
      if (state.inputTokens > 0 && total > state.inputTokens) {
        newOut = total - state.inputTokens;
      } else {
        newOut = total;
      }
      if (newOut !== state.outputTokens) {
        state.outputTokens = newOut;
        changed = true;
      }
    }
  }

  // ─── 4. Cost ──────────────────────────────────────────────────────────────

  const dollarIdx = clean.indexOf('$');
  if (dollarIdx !== -1) {
    const costWindow = clean.substring(Math.max(0, dollarIdx - 40), dollarIdx + 20);
    if (/tokens|Done/i.test(costWindow)) {
      const costMatch = clean.substring(dollarIdx).match(/^\$(\d{1,6}\.\d{2})/);
      if (costMatch) {
        const newCost = parseFloat(costMatch[1]);
        if (Number.isFinite(newCost) && newCost >= 0 && newCost <= COST_MAX && newCost !== state.cost) {
          state.cost = newCost;
          changed = true;
        }
      }
    }
  }

  // ─── 5. Emit ──────────────────────────────────────────────────────────────

  if (changed) {
    claudeStates.set(id, state);
    if (sender && !sender.isDestroyed()) {
      sender.send('terminal:claude-state', { id, ...state });
    }
  }
}

function cleanupClaudeState(id) {
  claudeStates.delete(id);
}

function getSessionDir() {
  return path.join(app.getPath('userData'), 'sessions');
}

function ensureSessionDir() {
  const dir = getSessionDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function parseTerminalId(id) {
  const sep = id.lastIndexOf(':');
  if (sep === -1) return { agentId: id, index: '0' };
  return { agentId: id.substring(0, sep), index: id.substring(sep + 1) };
}

function getLogPath(id) {
  const { agentId, index } = parseTerminalId(id);
  const dir = path.join(getSessionDir(), agentId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${index}.log`);
}

function getCwdPath(id) {
  const { agentId, index } = parseTerminalId(id);
  const dir = path.join(getSessionDir(), agentId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${index}.cwd`);
}

function migrateOldSessions() {
  const sessDir = getSessionDir();
  if (!fs.existsSync(sessDir)) return;
  const files = fs.readdirSync(sessDir);
  for (const file of files) {
    const full = path.join(sessDir, file);
    if (!fs.statSync(full).isFile()) continue;
    const match = file.match(/^(.+)\.(log|cwd)$/);
    if (!match) continue;
    const agentId = match[1];
    const ext = match[2];
    const agentDir = path.join(sessDir, agentId);
    if (!fs.existsSync(agentDir)) fs.mkdirSync(agentDir, { recursive: true });
    const dest = path.join(agentDir, `0.${ext}`);
    if (!fs.existsSync(dest)) {
      fs.renameSync(full, dest);
    } else {
      fs.unlinkSync(full);
    }
  }
}

function saveCwd(id, cwd) {
  try {
    ensureSessionDir();
    fs.writeFileSync(getCwdPath(id), cwd, 'utf-8');
  } catch { /* ignore */ }
}

function loadSavedCwd(id) {
  try {
    return fs.readFileSync(getCwdPath(id), 'utf-8').trim();
  } catch {
    return null;
  }
}

function getProcessCwd(pid) {
  try {
    const output = execSync(
      `lsof -a -p ${pid} -d cwd -Fn 2>/dev/null`,
      { encoding: 'utf-8', timeout: 2000 },
    );
    const match = output.match(/^n(.+)$/m);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function saveTerminalCwd(id) {
  const term = terminals.get(id);
  if (!term) return;
  const cwd = getProcessCwd(term.pid);
  if (cwd) saveCwd(id, cwd);
}

function resolveCwd(id, requestedCwd) {
  const saved = loadSavedCwd(id);
  if (saved && fs.existsSync(saved)) return saved;
  if (requestedCwd) {
    const expanded = requestedCwd.replace(/^~/, process.env.HOME || '');
    if (fs.existsSync(expanded)) return expanded;
  }
  return process.env.HOME || process.cwd();
}

const LOG_MAX_SIZE = 2 * 1024 * 1024;
const LOG_TRIM_TO = 1 * 1024 * 1024;

function trimLogFile(logPath) {
  try {
    const stat = fs.statSync(logPath);
    if (stat.size <= LOG_MAX_SIZE) return;
    const buf = Buffer.alloc(LOG_TRIM_TO);
    const fd = fs.openSync(logPath, 'r');
    fs.readSync(fd, buf, 0, LOG_TRIM_TO, stat.size - LOG_TRIM_TO);
    fs.closeSync(fd);
    fs.writeFileSync(logPath, buf);
  } catch { /* ignore */ }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'TermDeck',
    backgroundColor: '#111318',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

// ── App Lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  if (process.platform === 'darwin' && isDev) {
    app.dock.setIcon(path.join(__dirname, '..', 'build', 'icon.png'));
  }

  migrateOldSessions();
  registerTerminalIPC();

  ipcMain.handle('dialog:open-directory', async () => {
    const win = BrowserWindow.getFocusedWindow();
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  for (const [id] of terminals) {
    saveTerminalCwd(id);
  }
  for (const [, term] of terminals) {
    try { term.kill(); } catch { /* ignore */ }
  }
  terminals.clear();
  for (const [, stream] of sessionStreams) {
    try { stream.end(); } catch { /* ignore */ }
  }
  sessionStreams.clear();
  if (process.platform !== 'darwin') app.quit();
});

// ── Terminal IPC ─────────────────────────────────────────────────────────────

function registerTerminalIPC() {
  ipcMain.handle('terminal:create', (event, { id, cols, rows, cwd }) => {
    if (!pty) return false;

    if (terminals.has(id)) {
      try { terminals.get(id).resize(cols || 80, rows || 24); } catch { /* ignore */ }
      return true;
    }

    const shell =
      process.platform === 'win32'
        ? 'powershell.exe'
        : process.env.SHELL || '/bin/zsh';

    const resolvedCwd = resolveCwd(id, cwd);

    const ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: cols || 80,
      rows: rows || 24,
      cwd: resolvedCwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        LANG: process.env.LANG || 'en_US.UTF-8',
        LC_ALL: process.env.LC_ALL || 'en_US.UTF-8',
        SHELL_SESSIONS_DISABLE: '1',
      },
      encoding: 'utf-8',
    });

    terminals.set(id, ptyProcess);

    ensureSessionDir();
    const logPath = getLogPath(id);
    trimLogFile(logPath);
    fs.appendFileSync(logPath, '\r\n\x1b[90m--- session restarted ---\x1b[0m\r\n');
    const stream = fs.createWriteStream(logPath, { flags: 'a' });
    sessionStreams.set(id, stream);

    ptyProcess.onData((data) => {
      const s = sessionStreams.get(id);
      if (s) s.write(data);
      monitorClaudeOutput(id, data, event.sender);
      if (!event.sender.isDestroyed()) {
        event.sender.send(`terminal:data:${id}`, data);
      }
    });

    ptyProcess.onExit(() => {
      saveTerminalCwd(id);
      cleanupClaudeState(id);
      terminals.delete(id);
      const s = sessionStreams.get(id);
      if (s) { try { s.end(); } catch { /* ignore */ } }
      sessionStreams.delete(id);
      if (!event.sender.isDestroyed()) {
        event.sender.send(`terminal:exit:${id}`, 0);
      }
    });

    return true;
  });

  ipcMain.handle('terminal:write', (_event, { id, data }) => {
    const term = terminals.get(id);
    if (term) term.write(data);
  });

  ipcMain.handle('terminal:resize', (_event, { id, cols, rows }) => {
    const term = terminals.get(id);
    if (term) {
      try { term.resize(cols, rows); } catch { /* ignore */ }
    }
  });

  ipcMain.handle('terminal:kill', (_event, { id }) => {
    saveTerminalCwd(id);
    cleanupClaudeState(id);
    const term = terminals.get(id);
    if (term) {
      try { term.kill(); } catch { /* ignore */ }
      terminals.delete(id);
    }
    const s = sessionStreams.get(id);
    if (s) {
      try { s.end(); } catch { /* ignore */ }
      sessionStreams.delete(id);
    }
  });

  ipcMain.handle('terminal:load-history', (_event, { id }) => {
    const logPath = getLogPath(id);
    try {
      return fs.readFileSync(logPath, 'utf-8');
    } catch {
      return '';
    }
  });

  ipcMain.handle('terminal:clear-history', (_event, { id }) => {
    try { fs.unlinkSync(getLogPath(id)); } catch { /* ignore */ }
    try { fs.unlinkSync(getCwdPath(id)); } catch { /* ignore */ }
  });

  ipcMain.handle('terminal:clear-agent-history', (_event, { agentId }) => {
    const agentDir = path.join(getSessionDir(), agentId);
    if (fs.existsSync(agentDir)) {
      fs.rmSync(agentDir, { recursive: true, force: true });
    }
  });
}

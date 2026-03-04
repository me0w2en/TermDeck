# TermDeck

**Multi-agent terminal management dashboard with Claude Code monitoring.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-33-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)

TermDeck lets you manage multiple AI agents — each with its own terminal session, checklist, and real-time status. Switch between agents instantly, monitor Claude Code activity, and keep track of parallel workstreams from a single dashboard.

<!-- ![TermDeck Screenshot](docs/screenshot.png) -->

## Features

- **Multi-Agent Management** — Create, configure, and switch between multiple agents with custom avatars
- **Embedded Terminal** — Full terminal emulator per agent (xterm.js + node-pty)
- **Claude Code Monitoring** — Real-time tracking of Claude Code sessions and activity
- **Per-Agent Checklist** — Task tracking for each agent, persisted to localStorage
- **Dashboard Overview** — Grid view of all agents with status and checklist progress
- **Frameless Window** — Clean, modern UI with custom title bar and drag regions
- **Keyboard-First** — Designed for fast navigation between agents

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- npm or yarn
- macOS / Windows / Linux

### Setup

```bash
# Clone the repository
git clone https://github.com/me0w2en/TermDeck.git
cd TermDeck

# Install dependencies (automatically rebuilds node-pty for Electron)
npm install

# Start development mode
npm run dev
```

### Build

```bash
# Build for production
npm run build
```

If the terminal doesn't work, manually rebuild native modules:

```bash
npm run rebuild
```

## Project Structure

```
src/
  app/App.tsx                              Main layout
  components/
    agents/                                AgentListItem, AgentDetailPanel,
                                           Checklist, AddAgentModal, InitialAvatar
    dashboard/DashboardView.tsx            Overview grid
    terminal/                              TerminalPanel, TerminalContainer
    layout/                                Sidebar, TopBar, StatusBar, Background
    common/ConfirmDialog.tsx               Shared UI components
  hooks/
    useAgents.ts                           Agent CRUD + checklist + persistence
    useClaudeMonitor.ts                    Claude Code session monitoring
  utils/format.ts                          Utility functions
  types/                                   TypeScript interfaces + Electron API
  styles/globals.css                       Global styles
electron/
  main.js                                  BrowserWindow + terminal IPC (node-pty)
  preload.js                               contextBridge terminal API
```

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Electron 33 |
| Frontend | React 18 · TypeScript 5 |
| Build | Vite 6 |
| Styling | Tailwind CSS 3 · Framer Motion 11 |
| Terminal | xterm.js 5 · node-pty |

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

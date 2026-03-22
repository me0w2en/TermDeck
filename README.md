# TermDeck

**멀티 에이전트 터미널 대시보드**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-33-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)

여러 AI 에이전트의 터미널 세션을 하나의 대시보드에서 통합 관리할 수 있는 데스크톱 애플리케이션입니다. 동시에 여러 프로젝트에서 Claude Code를 실행하고 감독해야 할 때 생기는 창 전환과 상태 추적의 비효율을 해결합니다.

![TermDeck Screenshot](docs/screenshot.png)

## Features

- **멀티 터미널 세션 관리** — 에이전트별 독립 터미널, 탭 별칭, 분할 뷰, 세션 자동 복원
- **Claude Code 모니터링** — 실시간 상태 감지, 토큰/비용 추적, 일별 히스토리
- **에이전트 관리** — 생성/편집/삭제, 색상/경로 설정, 순서 변경, 우클릭 메뉴
- **체크리스트** — 인라인 편집, 순서 변경, 완료 항목 분리, 연속 입력
- **대시보드 오버뷰** — 카드 그리드, 정렬, 활동 시간 표시
- **커맨드 팔레트** — `⌘K`로 모든 명령에 빠르게 접근
- **키보드 단축키** — `⌘N` `⌘D` `⌘B` `⌘1~5` + 버튼 hover 시 힌트 표시
- **다크/라이트/시스템 테마** — StatusBar에서 전환
- **Activity 타임라인** — Claude 시작/종료, 상태 변경 이벤트를 날짜별 기록

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- npm 또는 yarn
- macOS / Windows / Linux

### Setup

```bash
# Clone the repository
git clone https://github.com/me0w2en/TermDeck.git
cd TermDeck

# Install dependencies (node-pty가 Electron용으로 자동 빌드됩니다)
npm install

# Start development mode
npm run dev
```

### Build

```bash
# Build for production (.dmg / .exe)
npm run build

# 터미널이 동작하지 않는 경우 네이티브 모듈 수동 재빌드
npm run rebuild
```

## Project Structure

```
src/
  app/App.tsx                              메인 레이아웃 + 단축키 + 상태 관리
  components/
    agents/                                AgentListItem, AgentDetailPanel,
                                           Checklist, AddAgentModal, InitialAvatar,
                                           ActivityTimeline
    dashboard/DashboardView.tsx            대시보드 그리드 뷰 + 정렬
    terminal/                              TerminalPanel, TerminalContainer (분할 뷰)
    layout/                                Sidebar, TopBar, StatusBar, Background
    common/                                ConfirmDialog, CommandPalette, Tooltip,
                                           ErrorBoundary
  hooks/
    useAgents.ts                           에이전트 CRUD + 체크리스트 + 정렬
    useClaudeMonitor.ts                    Claude Code 세션 모니터링
    useKeyboardShortcuts.ts                글로벌 키보드 단축키
    useToast.tsx                           토스트 알림 시스템
    useTheme.ts                            다크/라이트/시스템 테마
    useActivityLog.ts                      활동 타임라인 (localStorage 영속)
    useCostHistory.ts                      일별 비용/토큰 히스토리
    useFocusTrap.ts                        모달 포커스 트래핑
  utils/format.ts                          유틸리티 함수
  types/                                   TypeScript 인터페이스 + Electron API 선언
  styles/globals.css                       전역 스타일 + 테마 변수
electron/
  main.js                                  BrowserWindow + 터미널 IPC + Claude 모니터
  preload.js                               contextBridge 터미널 API
```

## Tech Stack

| 분류 | 기술 |
|------|------|
| 프레임워크 | Electron 33 |
| 프론트엔드 | React 18 · TypeScript 5 |
| 빌드 도구 | Vite 6 |
| 스타일링 | Tailwind CSS 3 · Framer Motion 11 |
| 터미널 | xterm.js 5 · node-pty |

## License

이 프로젝트는 MIT 라이선스를 따릅니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

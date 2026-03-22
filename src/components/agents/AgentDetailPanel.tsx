import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AgentDetailPanelProps, AgentStatus } from '../../types';
import InitialAvatar from './InitialAvatar';
import Checklist from './Checklist';
import TerminalContainer from '../terminal/TerminalContainer';
import ConfirmDialog from '../common/ConfirmDialog';
import { formatTokens } from '../../utils/format';
import ActivityTimeline from './ActivityTimeline';

const statusColors: Record<AgentStatus, string> = {
  running: '#22c55e',
  idle: '#eab308',
  offline: '#6b7280',
};

const statuses: AgentStatus[] = ['idle', 'running', 'offline'];

export default function AgentDetailPanel({
  agent,
  onUpdateStatus,
  onAddChecklistItem,
  onToggleChecklistItem,
  onRemoveChecklistItem,
  onEditChecklistItem,
  onMoveChecklistItem,
  onClearCompletedItems,
  onRemoveAgent,
  onUpdateTerminals,
  onUpdateName,
  onUpdateAgent,
  claudeSummary,
  activityEvents = [],
  onClearActivity,
}: AgentDetailPanelProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(false);
  const [sideTab, setSideTab] = useState<'checklist' | 'activity'>('checklist');
  const [showSettings, setShowSettings] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const dotColor = statusColors[agent.status];

  useEffect(() => {
    if (isEditingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [isEditingName]);

  // Reset UI state when agent changes
  useEffect(() => {
    setShowSettings(false);
    setIsEditingName(false);
  }, [agent.id]);

  function handleNameSubmit() {
    const trimmed = editNameValue.trim();
    if (trimmed && trimmed !== agent.name && onUpdateName) {
      onUpdateName(trimmed);
    }
    setIsEditingName(false);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start gap-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
        <InitialAvatar name={agent.name} color={agent.color} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <input
                ref={nameInputRef}
                type="text"
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
                onBlur={handleNameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNameSubmit();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                className="text-xl font-bold text-white bg-transparent outline-none border-b border-white/30 w-48"
              />
            ) : (
              <h2
                role="button"
                tabIndex={0}
                className="group/name flex items-center gap-1.5 text-xl font-bold text-white cursor-pointer hover:text-white/80 transition-colors truncate max-w-[300px]"
                onDoubleClick={() => {
                  setEditNameValue(agent.name);
                  setIsEditingName(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setEditNameValue(agent.name);
                    setIsEditingName(true);
                  }
                }}
                title="Double-click to rename"
              >
                <span className="truncate">{agent.name}</span>
                <svg
                  width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                  className="flex-shrink-0 opacity-0 group-hover/name:opacity-40 transition-opacity"
                >
                  <path d="M11 2l3 3L5 14H2v-3z" />
                </svg>
              </h2>
            )}
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium capitalize"
              style={{
                backgroundColor: dotColor + '20',
                color: dotColor,
              }}
            >
              {agent.status}
            </span>
          </div>
          {agent.role && <div className="mt-0.5 text-sm text-white/50">{agent.role}</div>}
          {agent.path && (
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(agent.path!)}
              className="mt-0.5 flex items-center gap-1 text-xs text-white/30 hover:text-white/50 transition-colors"
              title="Click to copy path"
            >
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M3 5V13H11" />
                <rect x="5" y="3" width="8" height="8" rx="1" />
              </svg>
              <span className="font-mono truncate max-w-[240px]">{agent.path.replace(/^\/Users\/[^/]+/, '~')}</span>
            </button>
          )}
          {claudeSummary.detected && (claudeSummary.inputTokens > 0 || claudeSummary.outputTokens > 0) && (
            <div className="mt-1 text-xs text-white/40">
              Tokens: {formatTokens(claudeSummary.inputTokens)}↑ {formatTokens(claudeSummary.outputTokens)}↓
              {claudeSummary.cost > 0 && ` · Cost: $${claudeSummary.cost.toFixed(2)}`}
            </div>
          )}

          {/* Status buttons */}
          <div className="mt-3 flex items-center gap-1">
            {statuses.map((s) => {
              const color = statusColors[s];
              const isActive = agent.status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onUpdateStatus(s)}
                  aria-label={`Set status to ${s}`}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                    isActive
                      ? 'text-white'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                  style={{
                    backgroundColor: isActive ? color + '30' : 'rgba(255,255,255,0.05)',
                    borderWidth: 1,
                    borderColor: isActive ? color + '50' : 'transparent',
                  }}
                >
                  {s}
                </button>
              );
            })}

            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowSettings((v) => !v)}
                aria-label="Agent settings"
                className="rounded-md px-2.5 py-1 text-xs font-medium text-white/30 transition-colors hover:bg-white/10 hover:text-white/60 outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                Settings
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                aria-label="Delete agent"
                className="rounded-md px-2.5 py-1 text-xs font-medium text-white/30 transition-colors hover:bg-red-500/10 hover:text-red-400 outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings panel */}
      <AnimatePresence>
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 flex flex-col gap-3 overflow-hidden"
        >
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Agent Settings</h3>
          {/* Color */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40 w-20">Color</span>
            <button
              type="button"
              onClick={() => colorInputRef.current?.click()}
              className="w-7 h-7 rounded-full ring-1 ring-white/20 hover:ring-white/40 transition-all"
              style={{ backgroundColor: agent.color }}
              aria-label="Change color"
            />
            <input
              ref={colorInputRef}
              type="color"
              value={agent.color}
              onChange={(e) => onUpdateAgent({ color: e.target.value })}
              className="sr-only"
              tabIndex={-1}
            />
          </div>
          {/* Working Directory */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40 w-20">Path</span>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={agent.path || ''}
                onChange={(e) => onUpdateAgent({ path: e.target.value || undefined })}
                placeholder="~/projects/my-app"
                className="flex-1 rounded-lg bg-white/5 px-2 py-1.5 text-xs text-white font-mono placeholder-white/30 outline-none ring-1 ring-white/10 focus-visible:ring-2 focus-visible:ring-white/30"
              />
              <button
                type="button"
                onClick={async () => {
                  const selected = await window.electronAPI?.openDirectory();
                  if (selected) onUpdateAgent({ path: selected });
                }}
                className="rounded-lg bg-white/5 px-2 py-1.5 text-xs text-white/50 hover:bg-white/10 hover:text-white/70 ring-1 ring-white/10 transition-colors"
              >
                Browse
              </button>
            </div>
          </div>
          {/* Role */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40 w-20">Role</span>
            <input
              type="text"
              value={agent.role || ''}
              onChange={(e) => onUpdateAgent({ role: e.target.value || undefined })}
              placeholder="e.g. Developer, Designer..."
              className="flex-1 rounded-lg bg-white/5 px-2 py-1.5 text-xs text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus-visible:ring-2 focus-visible:ring-white/30"
            />
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Main content: terminal + checklist */}
      <div className={`flex flex-col gap-4 ${isTerminalExpanded ? '' : 'lg:flex-row'}`}>
        {/* Terminal area */}
        <div className={`${isTerminalExpanded ? 'h-[calc(100vh-220px)]' : 'h-[400px] lg:min-w-[60%]'}`}>
          <TerminalContainer
            agent={agent}
            onUpdateTerminals={onUpdateTerminals}
            isExpanded={isTerminalExpanded}
            onToggleExpand={() => setIsTerminalExpanded((prev) => !prev)}
          />
        </div>

        {/* Side panel: Checklist / Activity */}
        <div className={`rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 flex flex-col ${isTerminalExpanded ? 'w-full max-h-[300px]' : 'w-full lg:w-80 h-[400px]'}`}>
          {/* Tabs */}
          <div className="mb-3 flex items-center gap-1 rounded-lg bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => setSideTab('checklist')}
              className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                sideTab === 'checklist' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              Checklist
              <span className="ml-1 text-[10px] text-white/30">{agent.checklist.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setSideTab('activity')}
              className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                sideTab === 'activity' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              Activity
              {activityEvents.length > 0 && (
                <span className="ml-1 text-[10px] text-white/30">{activityEvents.length}</span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
          {sideTab === 'checklist' ? (
            <Checklist
              items={agent.checklist}
              onAdd={onAddChecklistItem}
              onToggle={onToggleChecklistItem}
              onRemove={onRemoveChecklistItem}
              onEdit={onEditChecklistItem}
              onMove={onMoveChecklistItem}
              onClearCompleted={onClearCompletedItems}
              accentColor={agent.color}
            />
          ) : (
            <ActivityTimeline events={activityEvents} onClear={onClearActivity} />
          )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Agent"
        message={`"${agent.name}" agent and all session data will be permanently deleted.`}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onRemoveAgent();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

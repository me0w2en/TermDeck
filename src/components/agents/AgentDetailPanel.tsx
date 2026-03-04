import { useState } from 'react';
import type { AgentDetailPanelProps, AgentStatus } from '../../types';
import InitialAvatar from './InitialAvatar';
import Checklist from './Checklist';
import TerminalContainer from '../terminal/TerminalContainer';
import ConfirmDialog from '../common/ConfirmDialog';
import { formatTokens } from '../../utils/format';

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
  onRemoveAgent,
  onUpdateTerminals,
  claudeSummary,
}: AgentDetailPanelProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const dotColor = statusColors[agent.status];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start gap-4 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
        <InitialAvatar name={agent.name} color={agent.color} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">{agent.name}</h2>
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
          <div className="mt-0.5 text-sm text-white/50">{agent.role}</div>
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

            <div className="ml-auto">
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

      {/* Main content: terminal + checklist */}
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Terminal area */}
        <div className="flex-1 min-h-[400px] lg:min-w-[60%]">
          <TerminalContainer agent={agent} onUpdateTerminals={onUpdateTerminals} />
        </div>

        {/* Checklist panel */}
        <div className="w-full lg:w-80 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 p-4">
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white/70">Checklist</h3>
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/50">
              {agent.checklist.length}
            </span>
          </div>
          <Checklist
            items={agent.checklist}
            onAdd={onAddChecklistItem}
            onToggle={onToggleChecklistItem}
            onRemove={onRemoveChecklistItem}
            accentColor={agent.color}
          />
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

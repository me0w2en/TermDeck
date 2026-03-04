import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AddAgentModalProps } from '../../types';
import InitialAvatar from './InitialAvatar';

const presetColors = [
  '#6b7280',
  '#6d8a96',
  '#7c8b74',
  '#8a7e72',
  '#7a7089',
  '#7d8590',
];

export default function AddAgentModal({
  isOpen,
  onClose,
  onAdd,
}: AddAgentModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [agentPath, setAgentPath] = useState('');
  const [color, setColor] = useState(presetColors[0]);
  const [showPicker, setShowPicker] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setRole('');
      setAgentPath('');
      setColor(presetColors[0]);
      setShowPicker(false);
    }
  }, [isOpen]);

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !role.trim()) return;

    onAdd({
      name: name.trim(),
      role: role.trim(),
      status: 'idle',
      color,
      ...(agentPath.trim() && { path: agentPath.trim() }),
    });
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            role="dialog"
            aria-modal="true"
            aria-label="Add new agent"
            className="relative z-10 w-full max-w-md rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6"
          >
            <h2 className="text-lg font-semibold text-white">Create Agent</h2>
            <p className="mt-1 text-sm text-white/40">
              Add a new agent to your team.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
              {/* Avatar preview */}
              <div className="flex justify-center">
                <InitialAvatar
                  name={name || '?'}
                  color={color}
                  size={72}
                />
              </div>

              {/* Name */}
              <div>
                <label
                  htmlFor="agent-name"
                  className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40"
                >
                  Name
                </label>
                <input
                  id="agent-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Agent name"
                  className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus-visible:ring-2 focus-visible:ring-white/30"
                  autoFocus
                />
              </div>

              {/* Role */}
              <div>
                <label
                  htmlFor="agent-role"
                  className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40"
                >
                  Role
                </label>
                <input
                  id="agent-role"
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Developer, Designer, QA..."
                  className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus-visible:ring-2 focus-visible:ring-white/30"
                />
              </div>

              {/* Working Directory */}
              <div>
                <label
                  htmlFor="agent-path"
                  className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/40"
                >
                  Working Directory
                </label>
                <div className="flex gap-2">
                  <input
                    id="agent-path"
                    type="text"
                    value={agentPath}
                    onChange={(e) => setAgentPath(e.target.value)}
                    placeholder="~/projects/my-app"
                    className="min-w-0 flex-1 rounded-lg bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none ring-1 ring-white/10 focus-visible:ring-2 focus-visible:ring-white/30 font-mono"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const selected = await window.electronAPI?.openDirectory();
                      if (selected) setAgentPath(selected);
                    }}
                    className="flex-shrink-0 rounded-lg bg-white/5 px-3 py-2 text-sm text-white/50 transition-colors hover:bg-white/10 hover:text-white/70 outline-none ring-1 ring-white/10 focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    Browse
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-white/30">
                  Leave empty to use home directory
                </p>
              </div>

              {/* Color picker */}
              <div>
                <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">
                  Color
                </span>
                <div className="flex flex-wrap gap-2">
                  {presetColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setColor(c); setShowPicker(false); }}
                      aria-label={`Select color ${c}`}
                      className={`h-7 w-7 rounded-full transition-all outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                        color === c && !showPicker
                          ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-[#111318]'
                          : 'ring-1 ring-white/10 hover:ring-white/30'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}

                  {/* Custom color button */}
                  <button
                    type="button"
                    onClick={() => {
                      colorInputRef.current?.click();
                    }}
                    aria-label="Pick custom color"
                    className={`relative h-7 w-7 rounded-full transition-all outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
                      showPicker
                        ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-[#111318]'
                        : 'ring-1 ring-white/10 hover:ring-white/30'
                    }`}
                    style={{
                      background: showPicker
                        ? color
                        : 'conic-gradient(from 0deg, #8a7074, #8a8370, #6f8a74, #6f7a8a, #7a6f8a, #8a7074)',
                    }}
                  >
                    {!showPicker && (
                      <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        +
                      </span>
                    )}
                  </button>

                  <input
                    ref={colorInputRef}
                    type="color"
                    value={color}
                    onChange={(e) => {
                      setColor(e.target.value);
                      setShowPicker(true);
                    }}
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-4 py-2 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white/70 outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || !role.trim()}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                >
                  Create Agent
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

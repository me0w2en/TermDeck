import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  undo?: () => void;
}

interface ToastContextValue {
  toast: (message: string, type?: Toast['type'], undo?: () => void) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current.clear();
    };
  }, []);

  const toast = useCallback((message: string, type: Toast['type'] = 'success', undo?: () => void) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev.slice(-4), { id, message, type, undo }]);
    const timer = setTimeout(() => dismiss(id), 3500);
    timers.current.set(id, timer);
  }, [dismiss]);

  const iconMap = {
    success: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round">
        <path d="M3 8.5L6.5 12L13 4" />
      </svg>
    ),
    error: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round">
        <path d="M4 4L12 12M12 4L4 12" />
      </svg>
    ),
    info: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
        <circle cx="8" cy="8" r="6" />
        <path d="M8 5V8.5M8 11H8.01" />
      </svg>
    ),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-14 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-center gap-2 rounded-lg bg-[#1e2128] border border-white/10 px-3 py-2 shadow-xl backdrop-blur-xl"
            >
              {iconMap[t.type]}
              <span className="text-xs text-white/80">{t.message}</span>
              {t.undo && (
                <button
                  type="button"
                  onClick={() => { t.undo!(); dismiss(t.id); }}
                  className="ml-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-blue-400 hover:bg-blue-400/10 transition-colors"
                >
                  Undo
                </button>
              )}
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="ml-1 text-white/30 hover:text-white/60 transition-colors"
              >
                <svg width="10" height="10" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M1 1l6 6M7 1L1 7" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

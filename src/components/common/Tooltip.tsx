import { useState, useRef, useEffect, useCallback } from 'react';

interface TooltipProps {
  text: string;
  shortcut?: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
}

export default function Tooltip({ text, shortcut, children, position = 'bottom' }: TooltipProps) {
  const [show, setShow] = useState(false);
  const [nudge, setNudge] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const tipRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  function handleEnter() {
    timeoutRef.current = setTimeout(() => setShow(true), 500);
  }

  function handleLeave() {
    clearTimeout(timeoutRef.current);
    setShow(false);
    setNudge(0);
  }

  // Adjust position if overflowing viewport
  const adjustPosition = useCallback(() => {
    if (!tipRef.current) return;
    const rect = tipRef.current.getBoundingClientRect();
    let shift = 0;
    if (rect.right > window.innerWidth - 8) {
      shift = window.innerWidth - 8 - rect.right;
    } else if (rect.left < 8) {
      shift = 8 - rect.left;
    }
    if (shift !== nudge) setNudge(shift);
  }, [nudge]);

  useEffect(() => {
    if (show) adjustPosition();
  }, [show, adjustPosition]);

  const posClass = position === 'top'
    ? 'bottom-full mb-2'
    : 'top-full mt-2';

  return (
    <div ref={wrapRef} className="relative inline-flex" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      {show && (
        <div
          ref={tipRef}
          className={`absolute z-50 whitespace-nowrap pointer-events-none left-1/2 ${posClass}`}
          style={{ transform: `translateX(calc(-50% + ${nudge}px))` }}
        >
          <div className="rounded-md bg-[#1e2128] border border-white/10 px-2 py-1 text-[11px] text-white/70 shadow-lg flex items-center gap-1.5">
            <span>{text}</span>
            {shortcut && (
              <kbd className="rounded bg-white/10 px-1 py-0.5 text-[10px] font-mono text-white/50">{shortcut}</kbd>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

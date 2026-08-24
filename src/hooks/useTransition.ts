import { useState, useEffect } from 'react';

/**
 * Delays unmount so CSS exit animations can play.
 * Returns `shouldRender` (keep in DOM) and `isVisible` (apply visible class).
 */
export function useTransition(isOpen: boolean, duration = 150) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const raf = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration]);

  return { shouldRender, isVisible };
}

/**
 * Manages a list with exit animations for removed items.
 */
type WithExiting<T> = T & { _exiting?: boolean };

export function useListTransition<T extends { id: string }>(
  items: T[],
  duration = 200,
): WithExiting<T>[] {
  const [rendered, setRendered] = useState<WithExiting<T>[]>(
    items.map((i) => ({ ...i })),
  );

  useEffect(() => {
    const currentIds = new Set(items.map((i) => i.id));
    const renderedIds = new Set(rendered.map((i) => i.id));

    const next = rendered.map((r) => {
      if (!currentIds.has(r.id) && !r._exiting) {
        return { ...r, _exiting: true };
      }
      const updated = items.find((i) => i.id === r.id);
      if (updated) return { ...updated };
      return r;
    });

    for (const item of items) {
      if (!renderedIds.has(item.id)) {
        next.push({ ...item });
      }
    }

    setRendered(next);

    const exitingIds = next.filter((i: WithExiting<T>) => i._exiting).map((i) => i.id);
    if (exitingIds.length > 0) {
      const timer = setTimeout(() => {
        setRendered((prev) => prev.filter((i) => !exitingIds.includes(i.id)));
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [items, duration]);

  return rendered;
}

import { useCallback, useEffect, useRef } from 'react';

/** A reset or unmount invalidates every delayed animation and bot action. */
export function useGameTimers() {
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const intervals = useRef(new Set<ReturnType<typeof setInterval>>());
  const cancelAll = useCallback(() => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current.clear();
    for (const interval of intervals.current) clearInterval(interval);
    intervals.current.clear();
  }, []);
  const schedule = useCallback((callback: (value?: any) => void, delay = 0) => {
    const timer = setTimeout(() => { timers.current.delete(timer); callback(); }, delay);
    timers.current.add(timer);
    return timer;
  }, []);
  const repeat = useCallback((callback: () => void, delay: number) => {
    const interval = setInterval(callback, delay);
    intervals.current.add(interval);
    return interval;
  }, []);
  useEffect(() => cancelAll, [cancelAll]);
  return { schedule, repeat, cancelAll };
}

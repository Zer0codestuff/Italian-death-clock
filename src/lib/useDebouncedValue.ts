import { useEffect, useState } from "react";

export const SIMULATOR_ANNOUNCE_DELAY_MS = 220;

export const useDebouncedValue = <T,>(value: T, delay = SIMULATOR_ANNOUNCE_DELAY_MS): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
};

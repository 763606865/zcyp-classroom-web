"use client";

import { useCallback, useEffect, useState } from "react";

export function useCountdown(initialSeconds = 0) {
  const [remaining, setRemaining] = useState(Math.max(0, initialSeconds));

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setRemaining((value) => Math.max(0, value - 1)), 1_000);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  const start = useCallback((seconds: number) => {
    setRemaining(Math.max(0, Math.floor(seconds)));
  }, []);
  const reset = useCallback(() => setRemaining(0), []);

  return { isRunning: remaining > 0, remaining, reset, start } as const;
}

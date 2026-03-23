import { useState, useRef, useCallback, useEffect } from 'react';
import { GAME_DURATION } from '../utils/gameConfig';

interface TimerCallbacks {
  onTenSeconds?: () => void;
  onFiveSeconds?: () => void;
  onTimeUp?: () => void;
}

export function useGameTimer(callbacks?: TimerCallbacks) {
  const [timeRemaining, setTimeRemaining] = useState(GAME_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const firedRef = useRef({ ten: false, five: false, zero: false });

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    firedRef.current = { ten: false, five: false, zero: false };
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeRemaining(GAME_DURATION);
    firedRef.current = { ten: false, five: false, zero: false };
  }, []);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, GAME_DURATION - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 10 && !firedRef.current.ten) {
        firedRef.current.ten = true;
        callbacks?.onTenSeconds?.();
      }
      if (remaining <= 5 && !firedRef.current.five) {
        firedRef.current.five = true;
        callbacks?.onFiveSeconds?.();
      }
      if (remaining <= 0 && !firedRef.current.zero) {
        firedRef.current.zero = true;
        callbacks?.onTimeUp?.();
        setIsRunning(false);
      }
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, callbacks]);

  const progress = timeRemaining / GAME_DURATION; // 1.0 → 0.0

  return { timeRemaining, progress, isRunning, start, pause, reset };
}

import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MAX_HEARTS, HEART_REGEN_MS } from '../utils/gameConfig';

const STORAGE_KEY = '@momo_hearts';

interface HeartData {
  hearts: number;
  depletedAt: number | null; // timestamp เมื่อหัวใจลดครั้งล่าสุด (ใช้คำนวณ regen)
}

export function useHearts() {
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [depletedAt, setDepletedAt] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [nextRegenIn, setNextRegenIn] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // === โหลดจาก AsyncStorage ===
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const data: HeartData = JSON.parse(raw);
          let h = data.hearts;
          let da = data.depletedAt;

          // คำนวณ regen ระหว่างที่ปิดแอป
          if (da && h < MAX_HEARTS) {
            const elapsed = Date.now() - da;
            const regenCount = Math.floor(elapsed / HEART_REGEN_MS);
            if (regenCount > 0) {
              h = Math.min(MAX_HEARTS, h + regenCount);
              da = h >= MAX_HEARTS ? null : da + regenCount * HEART_REGEN_MS;
            }
          }

          setHearts(h);
          setDepletedAt(da);
          saveData({ hearts: h, depletedAt: da });
        }
      } catch (e) {
        console.warn('useHearts load error:', e);
      }
      setIsLoaded(true);
    })();
  }, []);

  // === Regen timer — ทุก 1 วิ ===
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (hearts >= MAX_HEARTS || !depletedAt) {
      setNextRegenIn(null);
      return;
    }

    const tick = () => {
      const elapsed = Date.now() - (depletedAt as number);
      const remaining = HEART_REGEN_MS - (elapsed % HEART_REGEN_MS);
      setNextRegenIn(Math.ceil(remaining / 1000));

      // ถึงเวลา regen
      if (elapsed >= HEART_REGEN_MS) {
        const regenCount = Math.floor(elapsed / HEART_REGEN_MS);
        setHearts((prev) => {
          const newH = Math.min(MAX_HEARTS, prev + regenCount);
          const newDa = newH >= MAX_HEARTS ? null : (depletedAt as number) + regenCount * HEART_REGEN_MS;
          setDepletedAt(newDa);
          saveData({ hearts: newH, depletedAt: newDa });
          return newH;
        });
      }
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hearts, depletedAt]);

  // === เสียหัวใจ 1 ดวง ===
  const loseHeart = useCallback(() => {
    setHearts((prev) => {
      if (prev <= 0) return 0;
      const newH = prev - 1;
      const newDa = depletedAt ?? Date.now(); // ถ้าเต็มอยู่ เริ่มจับเวลา regen
      setDepletedAt(newDa);
      saveData({ hearts: newH, depletedAt: newDa });
      return newH;
    });
  }, [depletedAt]);

  return {
    hearts,
    maxHearts: MAX_HEARTS,
    isLoaded,
    canPlay: hearts > 0,
    loseHeart,
    nextRegenIn,
  };
}

async function saveData(data: HeartData) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('useHearts save error:', e);
  }
}

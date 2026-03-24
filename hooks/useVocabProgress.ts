import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@momo_completed_vocab';

export function useVocabProgress() {
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // โหลดจาก AsyncStorage (ครั้งแรก + ทุกครั้งที่เรียก reload)
  const reload = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const ids: number[] = JSON.parse(raw);
        setCompletedIds(new Set(ids));
      }
    } catch (e) {
      console.warn('useVocabProgress load error:', e);
    }
    setIsLoaded(true);
  }, []);

  // โหลดครั้งแรก
  useEffect(() => {
    reload();
  }, [reload]);

  // บันทึกคำที่เล่นชนะ
  const markCompleted = useCallback(async (vocabId: number) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      next.add(vocabId);
      // บันทึกลง AsyncStorage
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...next])).catch(() => {});
      return next;
    });
  }, []);

  const isCompleted = useCallback(
    (vocabId: number) => completedIds.has(vocabId),
    [completedIds]
  );

  return { completedIds, isCompleted, markCompleted, reload, isLoaded, totalCompleted: completedIds.size };
}

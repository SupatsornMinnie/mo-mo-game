import { useState, useEffect, useCallback } from 'react';
import { loadHintData, saveHintData } from '../utils/storage';

const MAX_HINTS_PER_DAY = 3;

// ─── DEBUG ───────────────────────────────────────────────
// เปลี่ยนเป็น true เพื่อจำลองวันใหม่ทุกครั้งที่เปิดแอป
// เปลี่ยนเป็น false ตอน build จริง
const DEBUG_SKIP_DATE_CHECK = false;
// ─────────────────────────────────────────────────────────

export function useHints() {
  const [hintsUsed, setHintsUsed] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const hintsLeft = Math.max(0, MAX_HINTS_PER_DAY - hintsUsed);

  // โหลดข้อมูลตอนเริ่ม
  useEffect(() => {
    const init = async () => {
      const data = await loadHintData();
      const today = new Date().toDateString();

      const isNewDay = DEBUG_SKIP_DATE_CHECK || data.date !== today;

      if (isNewDay) {
        // วันใหม่ → reset
        setHintsUsed(0);
        await saveHintData({ count: 0, date: today });
      } else {
        setHintsUsed(data.count);
      }
      setLoaded(true);
    };
    init();
  }, []);

  // ใช้ hint 1 ครั้ง — คืนค่า true ถ้าสำเร็จ, false ถ้าหมด
  const useHint = useCallback(async (): Promise<boolean> => {
    if (hintsLeft <= 0) return false;

    const newUsed = hintsUsed + 1;
    setHintsUsed(newUsed);
    await saveHintData({
      count: newUsed,
      date: new Date().toDateString(),
    });
    return true;
  }, [hintsUsed, hintsLeft]);

  const canUseHint = hintsLeft > 0;

  return { hintsLeft, hintsUsed, canUseHint, useHint, loaded };
}

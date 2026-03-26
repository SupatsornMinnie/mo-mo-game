import { Audio } from 'expo-av';
import { SFX_SOUNDS } from './gameConfig';

let cachedSound: Audio.Sound | null = null;

/**
 * โหลดเสียง bubble-pop ไว้ล่วงหน้า (เรียกครั้งเดียวตอนเปิดแอป)
 */
export async function preloadBubblePop() {
  try {
    if (cachedSound) return;
    const { sound } = await Audio.Sound.createAsync(SFX_SOUNDS.bubblePop);
    cachedSound = sound;
  } catch (e) {
    // ไม่ block UI
  }
}

/**
 * เล่นเสียง bubble-pop — ใช้เสียงที่โหลดไว้แล้ว (เร็วมาก ไม่ delay)
 */
export async function playBubblePop() {
  try {
    if (!cachedSound) {
      // กรณียังไม่ได้ preload → โหลดแล้วเล่นเลย
      await preloadBubblePop();
    }
    if (cachedSound) {
      await cachedSound.setPositionAsync(0); // กรอกลับต้น
      await cachedSound.playAsync();
    }
  } catch (e) {
    // ถ้า error ให้สร้างใหม่
    cachedSound = null;
  }
}

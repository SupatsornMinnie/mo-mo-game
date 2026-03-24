import { useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { LETTER_SOUNDS, WORD_SOUND, SFX_SOUNDS } from '../utils/gameConfig';

export function useGameSounds() {
  const soundsRef = useRef<Map<string, Audio.Sound>>(new Map());
  const bgmRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      soundsRef.current.forEach((sound) => {
        sound.unloadAsync().catch(() => {});
      });
      soundsRef.current.clear();
      if (bgmRef.current) bgmRef.current.unloadAsync().catch(() => {});
    };
  }, []);

  const playSound = useCallback(async (source: any, key: string) => {
    try {
      const existing = soundsRef.current.get(key);
      if (existing) {
        await existing.setPositionAsync(0);
        await existing.playAsync();
        return;
      }
      const { sound } = await Audio.Sound.createAsync(source);
      soundsRef.current.set(key, sound);
      await sound.playAsync();
    } catch (e) {
      console.warn('Sound play error:', key, e);
    }
  }, []);

  const playLetterSound = useCallback(
    (char: string) => {
      const source = LETTER_SOUNDS[char];
      if (source) playSound(source, `letter_${char}`);
    },
    [playSound]
  );

  const playWordSound = useCallback(
    () => playSound(WORD_SOUND, 'word_apple'),
    [playSound]
  );

  const playSFX = useCallback(
    (type: 'correct' | 'wrong' | 'pop' | 'fall' | 'clockBeep' | 'win' | 'lose') => {
      const source = (SFX_SOUNDS as any)[type];
      if (source) playSound(source, `sfx_${type}`);
    },
    [playSound]
  );

  // เพลงพื้นหลัง — loop
  const startBGM = useCallback(async () => {
    try {
      if (bgmRef.current) {
        await bgmRef.current.setPositionAsync(0);
        await bgmRef.current.playAsync();
        return;
      }
      const { sound } = await Audio.Sound.createAsync(SFX_SOUNDS.bgm, {
        isLooping: true,
        volume: 0.3,
      });
      bgmRef.current = sound;
      await sound.playAsync();
    } catch (e) {
      console.warn('BGM error:', e);
    }
  }, []);

  const stopBGM = useCallback(async () => {
    try {
      if (bgmRef.current) {
        await bgmRef.current.stopAsync();
      }
    } catch (e) {}
  }, []);

  // เล่นเสียง win หลังจากเสียง word จบ
  const playWordThenWin = useCallback(async () => {
    try {
      // เล่น word sound ก่อน
      const existing = soundsRef.current.get('word_apple');
      if (existing) {
        await existing.setPositionAsync(0);
        await existing.playAsync();
      } else {
        const { sound } = await Audio.Sound.createAsync(WORD_SOUND);
        soundsRef.current.set('word_apple', sound);
        await sound.playAsync();
      }
      // รอ word จบ (~1 วินาที) แล้วเล่น win
      setTimeout(() => {
        playSFX('win');
      }, 1200);
    } catch (e) {
      console.warn('WordThenWin error:', e);
    }
  }, [playSFX]);

  return { playLetterSound, playWordSound, playSFX, startBGM, stopBGM, playWordThenWin };
}

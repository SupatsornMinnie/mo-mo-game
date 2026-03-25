import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef } from 'react';
import { LETTER_SOUNDS, SFX_SOUNDS, WORD_SOUND } from '../utils/gameConfig';

export function useGameSounds() {
  const soundsRef = useRef<Map<string, Audio.Sound>>(new Map());
  const bgmRef = useRef<Audio.Sound | null>(null);

  // Preload เสียงที่ใช้บ่อยตั้งแต่เริ่มเกม
  useEffect(() => {
    const preload = async () => {
      try {
        // Preload เสียง apple word
        const { sound: wordSound } = await Audio.Sound.createAsync(WORD_SOUND);
        soundsRef.current.set('word_apple', wordSound);

        // Preload เสียง win
        const { sound: winSound } = await Audio.Sound.createAsync(SFX_SOUNDS.win);
        soundsRef.current.set('sfx_win', winSound);

        // Preload เสียง correct
        const { sound: correctSound } = await Audio.Sound.createAsync(SFX_SOUNDS.correct);
        soundsRef.current.set('sfx_correct', correctSound);
      } catch (e) {
        console.warn('Preload sounds error:', e);
      }
    };
    preload();

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
        return existing;
      }
      const { sound } = await Audio.Sound.createAsync(source);
      soundsRef.current.set(key, sound);
      await sound.playAsync();
      return sound;
    } catch (e) {
      console.warn('Sound play error:', key, e);
      return null;
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
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });
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

  // หยุดและ unload เสียง ทั้งหมด (BGM + SFX) — เรียกตอนออกจากหน้า
  const stopAllSounds = useCallback(async () => {
    try {
      if (bgmRef.current) {
        await bgmRef.current.stopAsync().catch(() => {});
        await bgmRef.current.unloadAsync().catch(() => {});
        bgmRef.current = null;
      }
      const stops = Array.from(soundsRef.current.values()).map((s) =>
        s.stopAsync().catch(() => {}).then(() => s.unloadAsync().catch(() => {}))
      );
      await Promise.all(stops);
      soundsRef.current.clear();
    } catch (e) {}
  }, []);

  // ออกเสียง "Apple" ก่อน → รอจบ → เล่นเสียง win
  const playWordThenWin = useCallback(async () => {
    try {
      // เล่นเสียงคำว่า Apple (preloaded แล้ว)
      await new Promise((r) => setTimeout(r, 1000));//รอ**1วินาที
      const appleSound = await playSound(WORD_SOUND, 'word_apple');

      if (appleSound) {
        // รอให้เสียง apple จบจริงๆ
        await new Promise<void>((resolve) => {
          appleSound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              resolve();
            }
          });
        });
      }

      // เล่นเสียง win หลัง apple จบ
      await playSound(SFX_SOUNDS.win, 'sfx_win');
    } catch (e) {
      console.warn('WordThenWin error:', e);
    }
  }, [playSound]);

  return { playLetterSound, playWordSound, playSFX, startBGM, stopBGM, stopAllSounds, playWordThenWin };
}

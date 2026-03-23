import { useRef, useCallback, useEffect } from 'react';
import { Audio } from 'expo-av';
import { LETTER_SOUNDS, WORD_SOUND, SFX_SOUNDS } from '../utils/gameConfig';

export function useGameSounds() {
  const soundsRef = useRef<Map<string, Audio.Sound>>(new Map());

  useEffect(() => {
    return () => {
      // Cleanup all sounds on unmount
      soundsRef.current.forEach((sound) => {
        sound.unloadAsync().catch(() => {});
      });
      soundsRef.current.clear();
    };
  }, []);

  const playSound = useCallback(async (source: any, key: string) => {
    try {
      // Reuse existing sound if loaded
      const existing = soundsRef.current.get(key);
      if (existing) {
        await existing.setPositionAsync(0);
        await existing.playAsync();
        return;
      }
      // Create new sound
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
    (type: 'correct' | 'wrong' | 'pop') => {
      const source = SFX_SOUNDS[type];
      if (source) playSound(source, `sfx_${type}`);
    },
    [playSound]
  );

  return { playLetterSound, playWordSound, playSFX };
}

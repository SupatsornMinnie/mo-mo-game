import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Asset } from 'expo-asset';
import { GAME_IMAGES, WORD_SOUND, SFX_SOUNDS } from '../utils/gameConfig';

const PRELOAD_IMAGES = [
  GAME_IMAGES.apple,
  GAME_IMAGES.appleBitten,
  GAME_IMAGES.applePiece,
  GAME_IMAGES.worm,
  GAME_IMAGES.wormRun,
  GAME_IMAGES.bg,
  GAME_IMAGES.letters.A,
  GAME_IMAGES.letters.P,
  GAME_IMAGES.letters.P2,
  GAME_IMAGES.letters.L,
  GAME_IMAGES.letters.E,
];

export function useAssetPreloader() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
        });
      } catch (e) {
        console.warn('Audio mode error:', e);
      }

      try {
        await Asset.loadAsync(PRELOAD_IMAGES);
      } catch (e) {
        console.warn('Image preload error:', e);
      }

      setLoaded(true);
    };
    init();
  }, []);

  return { loaded };
}

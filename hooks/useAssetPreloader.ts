import { useState, useEffect } from 'react';
import { Audio } from 'expo-av';

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
      setLoaded(true);
    };
    init();
  }, []);

  return { loaded };
}

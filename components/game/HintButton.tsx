import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { GAME_IMAGES } from '../../utils/gameConfig';

interface HintButtonProps {
  freeHints: number; // 3, 2, 1, 0
  isBlinking: boolean;
  onPress: () => void;
}

// Map hint count to image: 3→hint3, 2→hint2, 1→hint1, 0→hint (locked/whale)
function getHintImage(count: number) {
  if (count >= 3) return GAME_IMAGES.hint3;
  if (count === 2) return GAME_IMAGES.hint2;
  if (count === 1) return GAME_IMAGES.hint1;
  return GAME_IMAGES.hint; // locked state
}

export default function HintButton({ freeHints, isBlinking, onPress }: HintButtonProps) {
  const blink = useSharedValue(1);
  const hintSize = 55;

  useEffect(() => {
    if (isBlinking) {
      blink.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1,
        true
      );
    } else {
      blink.value = withTiming(1);
    }
  }, [isBlinking]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: blink.value,
  }));

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <Pressable onPress={onPress} style={styles.button}>
        <Image
          source={getHintImage(freeHints)}
          style={{ width: hintSize, height: hintSize }}
          contentFit="contain"
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    zIndex: 50,
  },
  button: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 16,
    padding: 4,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
});

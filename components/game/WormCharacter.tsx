import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { GAME_IMAGES } from '../../utils/gameConfig';

interface WormCharacterProps {
  sw: number;
  sh: number;
  initialX?: number;
  initialY?: number;
  onCaught: (x?: number, y?: number) => void;
  isActive: boolean;
}

export default function WormCharacter({ sw, sh, initialX, initialY, onCaught, isActive }: WormCharacterProps) {
  const wormSize = Math.min(sw * 0.1, sh * 0.2, 80);

  // ใช้ตำแหน่งจาก intro ถ้ามี ไม่งั้นสุ่มใหม่
  const startX = initialX ?? (wormSize + Math.random() * (sw - 2 * wormSize));
  const startY = initialY ?? (sh * 0.55 + Math.random() * (sh * 0.30));

  const translateX = useSharedValue(startX);
  const translateY = useSharedValue(startY);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handleCatch = () => {
    if (!isActive) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Shrink + fade out
    scale.value = withSequence(
      withSpring(1.5, { damping: 4 }),
      withTiming(0, { duration: 300 })
    );
    opacity.value = withDelay(200, withTiming(0, { duration: 300 }));

    const cx = translateX.value;
    const cy = translateY.value;
    setTimeout(() => onCaught(cx, cy), 500);
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  if (!isActive) return null;

  return (
    <Animated.View style={[styles.worm, animStyle]}>
      <Pressable onPress={handleCatch} hitSlop={20}>
        <Image
          source={GAME_IMAGES.wormRun}
          style={{ width: wormSize, height: wormSize * 0.6 }}
          contentFit="contain"
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  worm: {
    position: 'absolute',
    zIndex: 30,
  },
});

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LETTER_IMAGES, SNAP_THRESHOLD } from '../../utils/gameConfig';

// Sprite frames สำหรับตัว A (ปีกกระพือ)
const A_SPRITE_FRAMES = [
  require('../../assets/alphabet/A/sprite_a1.webp'),
  require('../../assets/alphabet/A/sprite_a2.webp'),
  require('../../assets/alphabet/A/sprite_a3.webp'),
  require('../../assets/alphabet/A/sprite_a4.webp'),
];

interface SlotTarget {
  x: number;
  y: number;
  slotIndex: number;
}

interface DraggableLetterProps {
  char: string;
  index: number;
  scatterX: number;
  scatterY: number;
  /** All valid slot targets this letter can snap to (for duplicate letters like PP) */
  validTargets: SlotTarget[];
  size: number;
  isPlaced: boolean;
  placedX?: number;
  placedY?: number;
  onPlace: (letterIndex: number, slotIndex: number) => void;
  onWrongPlace: () => void;
  onTouch: (char: string) => void;
}

export default function DraggableLetter({
  char,
  index,
  scatterX,
  scatterY,
  validTargets,
  size,
  isPlaced,
  placedX,
  placedY,
  onPlace,
  onWrongPlace,
  onTouch,
}: DraggableLetterProps) {
  const translateX = useSharedValue(scatterX);
  const translateY = useSharedValue(scatterY);
  const scale = useSharedValue(1);
  const wiggle = useSharedValue(0);
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // Sprite animation for letter A
  const [spriteFrame, setSpriteFrame] = useState(-1);
  const spriteAnimating = useRef(false);
  const isLetterA = char === 'A';

  // When placed, snap to placed position
  useEffect(() => {
    if (isPlaced && placedX != null && placedY != null) {
      translateX.value = withSpring(placedX, { damping: 8, stiffness: 120 });
      translateY.value = withSpring(placedY, { damping: 8, stiffness: 120 });
      scale.value = withSequence(
        withSpring(1.3, { damping: 4 }),
        withSpring(1, { damping: 6 })
      );
      wiggle.value = 0;
    }
  }, [isPlaced, placedX, placedY]);

  const handleTouch = () => {
    onTouch(char);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // ตัว A → เปลี่ยนเป็นปีกนางฟ้า 2 วินาที
    if (isLetterA && !spriteAnimating.current) {
      spriteAnimating.current = true;
      setSpriteFrame(0); // เปลี่ยนเป็นตัว A มีปีกทันที
      let frame = 0;
      const interval = setInterval(() => {
        frame++;
        setSpriteFrame(frame % 4);
      }, 150);
      // หยุดหลัง 2 วินาที
      setTimeout(() => {
        clearInterval(interval);
        setSpriteFrame(-1);
        spriteAnimating.current = false;
      }, 2000);
    }
  };

  const checkPlacement = () => {
    const curX = translateX.value;
    const curY = translateY.value;

    // Check ALL valid targets — find closest one within threshold
    let bestTarget: SlotTarget | null = null;
    let bestDist = Infinity;

    for (const target of validTargets) {
      const dx = curX - target.x;
      const dy = curY - target.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < SNAP_THRESHOLD && dist < bestDist) {
        bestDist = dist;
        bestTarget = target;
      }
    }

    if (bestTarget) {
      // Correct — snap to this slot
      onPlace(index, bestTarget.slotIndex);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      // Wrong — bounce back to scatter position
      translateX.value = withSpring(scatterX, { damping: 8 });
      translateY.value = withSpring(scatterY, { damping: 8 });
      onWrongPlace();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const panGesture = Gesture.Pan()
    .enabled(!isPlaced)
    .onStart(() => {
      contextX.value = translateX.value;
      contextY.value = translateY.value;
      isDragging.value = true;
      scale.value = withSpring(1.25);
      wiggle.value = withRepeat(
        withSequence(
          withTiming(12, { duration: 120 }),
          withTiming(-12, { duration: 120 })
        ),
        -1,
        true
      );
      runOnJS(handleTouch)();
    })
    .onUpdate((e) => {
      translateX.value = contextX.value + e.translationX;
      translateY.value = contextY.value + e.translationY;
    })
    .onEnd(() => {
      isDragging.value = false;
      scale.value = withSpring(1);
      wiggle.value = withTiming(0, { duration: 200 });
      runOnJS(checkPlacement)();
    });

  const tapGesture = Gesture.Tap()
    .enabled(!isPlaced)
    .onStart(() => {
      runOnJS(handleTouch)();
      scale.value = withSequence(
        withSpring(1.2, { damping: 4 }),
        withSpring(1, { damping: 6 })
      );
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${wiggle.value}deg` },
    ],
    zIndex: isDragging.value ? 100 : 10,
  }));

  // ถ้าตัว A กำลังเล่น sprite → ใช้ภาพ sprite (ใหญ่ขึ้นเพราะมีปีก)
  const isSpriting = isLetterA && spriteFrame >= 0;
  const imgSource = isSpriting ? A_SPRITE_FRAMES[spriteFrame] : LETTER_IMAGES[char];
  const imgSize = isSpriting ? size * 1.8 : size * 0.9;

  if (isPlaced) {
    return (
      <Animated.View style={[styles.letter, { width: size, height: size }, animStyle]}>
        <Image
          source={imgSource}
          style={{ width: imgSize, height: imgSize }}
          contentFit="contain"
        />
      </Animated.View>
    );
  }

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.letter, { width: size, height: size }, animStyle]}>
        <Image
          source={imgSource}
          style={{ width: imgSize, height: imgSize }}
          contentFit="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  letter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
});

import React, { useEffect } from 'react';
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
import { GAME_IMAGES, SNAP_THRESHOLD } from '../../utils/gameConfig';

interface DraggableApplePieceProps {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  size: number;
  isPlaced: boolean;
  onPlace: () => void;
  onWrongPlace: () => void;
}

export default function DraggableApplePiece({
  startX,
  startY,
  targetX,
  targetY,
  size,
  isPlaced,
  onPlace,
  onWrongPlace,
}: DraggableApplePieceProps) {
  const translateX = useSharedValue(startX);
  const translateY = useSharedValue(startY);
  const scale = useSharedValue(0);
  const wiggle = useSharedValue(0);
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // Pop in when appearing
  useEffect(() => {
    scale.value = withSpring(1, { damping: 6, stiffness: 120 });
  }, []);

  // Snap to target when placed
  useEffect(() => {
    if (isPlaced) {
      translateX.value = withSpring(targetX - size / 2, { damping: 8 });
      translateY.value = withSpring(targetY - size / 2, { damping: 8 });
      scale.value = withSequence(
        withSpring(1.3, { damping: 4 }),
        withSpring(1, { damping: 6 })
      );
      wiggle.value = 0;
    }
  }, [isPlaced]);

  // Named function สำหรับ runOnJS (ห้ามใช้ arrow function ตรงๆ)
  const triggerHapticLight = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const checkPlacement = () => {
    const pieceCenterX = translateX.value + size / 2;
    const pieceCenterY = translateY.value + size / 2;
    const dx = pieceCenterX - targetX;
    const dy = pieceCenterY - targetY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < SNAP_THRESHOLD * 3) {
      onPlace();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      translateX.value = withSpring(startX, { damping: 8 });
      translateY.value = withSpring(startY, { damping: 8 });
      onWrongPlace();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const panGesture = Gesture.Pan()
    .enabled(!isPlaced)
    .minDistance(5)
    .onStart(() => {
      contextX.value = translateX.value;
      contextY.value = translateY.value;
      isDragging.value = true;
      scale.value = withSpring(1.2);
      wiggle.value = withRepeat(
        withSequence(
          withTiming(8, { duration: 150 }),
          withTiming(-8, { duration: 150 })
        ),
        -1,
        true
      );
      runOnJS(triggerHapticLight)();
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

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${wiggle.value}deg` },
    ],
    zIndex: isDragging.value ? 100 : 35,
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.piece, { width: size, height: size }, animStyle]}>
        <Image
          source={GAME_IMAGES.applePiece}
          style={{ width: size, height: size }}
          contentFit="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
});

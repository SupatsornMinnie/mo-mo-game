import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { GAME_IMAGES, SNAP_THRESHOLD } from '../../utils/gameConfig';

interface WormCharacterProps {
  sw: number;
  sh: number;
  initialX?: number;
  initialY?: number;
  appleTargetX: number;
  appleTargetY: number;
  appleSize: number;
  onReturnApple: () => void;
  isActive: boolean;
}

export default function WormCharacter({
  sw, sh, initialX, initialY,
  appleTargetX, appleTargetY, appleSize,
  onReturnApple, isActive,
}: WormCharacterProps) {
  const wormSize = Math.min(sw * 0.18, sh * 0.3, 140);

  const startX = initialX ?? (wormSize + Math.random() * (sw - 2 * wormSize));
  const startY = initialY ?? (sh * 0.55 + Math.random() * (sh * 0.30));

  const translateX = useSharedValue(startX);
  const translateY = useSharedValue(startY);
  const ctxX = useSharedValue(0);
  const ctxY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isDragging = useSharedValue(false);

  const handleReturnApple = () => {
    onReturnApple();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const checkAppleDrop = () => {
    const cx = translateX.value + wormSize / 2;
    const cy = translateY.value + wormSize / 2;
    const dx = cx - appleTargetX;
    const dy = cy - appleTargetY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < appleSize * 1.2) {
      // ลากหนอนไปถึงแอปเปิ้ล → snap เข้า → ซ่อนหนอน → แอปเปิ้ลเต็มลูก
      translateX.value = withTiming(appleTargetX - wormSize / 2, { duration: 150 });
      translateY.value = withTiming(appleTargetY - wormSize / 2, { duration: 150 });
      scale.value = withTiming(0, { duration: 250 });
      opacity.value = withTiming(0, { duration: 250 });
      runOnJS(handleReturnApple)();
    } else {
      // วางตรงไหนก็ได้ (ไม่ bounce กลับ)
      scale.value = withSpring(1);
    }
  };

  const panGesture = Gesture.Pan()
    .enabled(isActive)
    .onStart(() => {
      ctxX.value = translateX.value;
      ctxY.value = translateY.value;
      isDragging.value = true;
      scale.value = withSpring(1.2);
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((e) => {
      translateX.value = ctxX.value + e.translationX;
      translateY.value = ctxY.value + e.translationY;
    })
    .onEnd(() => {
      isDragging.value = false;
      runOnJS(checkAppleDrop)();
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    zIndex: isDragging.value ? 100 : 30,
  }));

  if (!isActive) return null;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.worm, animStyle]}>
        <Image
          source={GAME_IMAGES.wormRun}
          style={{ width: wormSize, height: wormSize * 0.6 }}
          contentFit="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  worm: {
    position: 'absolute',
  },
});

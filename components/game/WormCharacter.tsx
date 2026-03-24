import React, { useEffect } from 'react';
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
  appleRotation?: number;
  onReturnApple: () => void;
  isActive: boolean;
}

export default function WormCharacter({
  sw, sh, initialX, initialY,
  appleTargetX, appleTargetY, appleSize, appleRotation = 0,
  onReturnApple, isActive,
}: WormCharacterProps) {
  // ใช้ขนาดเดียวกับ AppleDrop: width = appleSize * 0.7, height = appleSize * 0.5
  const wormWidth = appleSize * 0.7;
  const wormHeight = appleSize * 0.5;

  const startX = initialX ?? (wormWidth + Math.random() * (sw - 2 * wormWidth));
  const startY = initialY ?? (sh * 0.55 + Math.random() * (sh * 0.30));

  const translateX = useSharedValue(startX);
  const translateY = useSharedValue(startY);
  const ctxX = useSharedValue(0);
  const ctxY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isDragging = useSharedValue(false);

  // sync ตำแหน่งจาก AppleDrop เมื่อ initialX/Y มาถึง (แก้ปัญหาหนอนย้ายที่)
  useEffect(() => {
    if (initialX != null) translateX.value = initialX;
    if (initialY != null) translateY.value = initialY;
  }, [initialX, initialY]);

  const handleReturnApple = () => {
    onReturnApple();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const checkAppleDrop = () => {
    const cx = translateX.value + wormWidth / 2;
    const cy = translateY.value + wormHeight / 2;
    const dx = cx - appleTargetX;
    const dy = cy - appleTargetY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < appleSize * 0.4) {
      // ลากหนอนไปถึงแอปเปิ้ล → snap เข้า → ซ่อนหนอน → แอปเปิ้ลเต็มลูก
      translateX.value = withTiming(appleTargetX - wormWidth / 2, { duration: 150 });
      translateY.value = withTiming(appleTargetY - wormHeight / 2, { duration: 150 });
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

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.worm, animStyle]}>
        <Image
          source={GAME_IMAGES.wormRun}
          style={{ width: wormWidth, height: wormHeight }}
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

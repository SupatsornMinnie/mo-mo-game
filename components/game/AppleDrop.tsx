import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { GAME_IMAGES, LETTER_IMAGES, APPLE_LETTERS, calculateSlotPositions } from '../../utils/gameConfig';

interface AppleDropProps {
  sw: number;
  sh: number;
  scatterPositions: { x: number; y: number }[];
  onIntroComplete: () => void;
  onWormPosition?: (x: number, y: number) => void;
}

export default function AppleDrop({ sw, sh, scatterPositions, onIntroComplete, onWormPosition }: AppleDropProps) {
  const [showBitten, setShowBitten] = useState(false);
  const [wormAlert, setWormAlert] = useState(false);

  const slotPositions = calculateSlotPositions(sw, sh);
  // แอปเปิ้ลตกลงมาส่วนบนของจอ (ตัวอักษรอยู่ส่วนล่าง sh*0.62)
  const appleLandY = sh * 0.25;

  // Apple size — ใหญ่กว่าเดิม
  const appleSize = Math.min(Math.max(sw * 0.28, 100), sh * 0.28, 180);
  const letterSize = slotPositions[0]?.size || 55;

  // Apple starts off screen
  const appleY = useSharedValue(-sh * 0.3);
  const appleScale = useSharedValue(1);

  // Letters start at slot positions (visible from the start!)
  const letterX = APPLE_LETTERS.map((_, i) => useSharedValue(slotPositions[i].x));
  const letterY = APPLE_LETTERS.map((_, i) => useSharedValue(slotPositions[i].y));
  const letterOpacities = APPLE_LETTERS.map(() => useSharedValue(1));
  const letterScale = APPLE_LETTERS.map(() => useSharedValue(1));

  // Worm — อยู่นิ่งตำแหน่งสุ่ม
  const wormRandX = sw * 0.2 + Math.random() * (sw * 0.5);
  const wormRandY = sh * 0.55 + Math.random() * (sh * 0.25);
  const wormOpacity = useSharedValue(1);

  useEffect(() => {
    // บอก game.tsx ว่าหนอนอยู่ตำแหน่งไหน
    if (onWormPosition) onWormPosition(wormRandX, wormRandY);

    // === Timeline ===
    // t=0~1000ms: ตัวอักษร APPLE โชว์กลางจอล่าง + หนอนนิ่ง
    //
    // t=1000ms: แอปเปิ้ลตกจากด้านบน → ตกลงไปถึงตัวอักษร (sh*0.62)
    //           แล้วเด้งขึ้นมาอยู่ครึ่งบน (appleLandY)
    const slotY = slotPositions[0]?.y || sh * 0.62;
    const impactTime = 1600; // เวลาที่แอปเปิ้ลถึงตัวอักษร

    appleY.value = withDelay(
      1000,
      withSequence(
        // ตกลงไปถึงตัวอักษร (ครึ่งล่าง)
        withTiming(slotY - appleSize / 2, { duration: 600, easing: Easing.in(Easing.quad) }),
        // เด้งขึ้นมาอยู่ครึ่งบน
        withSpring(appleLandY - appleSize / 2, { damping: 12, stiffness: 150 })
      )
    );

    // t=impactTime: กระทบ! แอปเปิ้ลสั่น → bitten + ตัวอักษรแตกทันที!
    appleScale.value = withDelay(
      impactTime,
      withSequence(
        withTiming(1.3, { duration: 60 }),
        withTiming(0.85, { duration: 60 }),
        withTiming(1, { duration: 80 })
      )
    );
    setTimeout(() => setShowBitten(true), impactTime);
    setTimeout(() => setWormAlert(true), impactTime);

    // ตัวอักษรกระจายทันทีตอนกระทบ (ไม่ delay เพิ่ม!)
    APPLE_LETTERS.forEach((_, i) => {
      // สั่นเล็กน้อย
      letterScale[i].value = withDelay(
        impactTime,
        withSequence(
          withTiming(1.3, { duration: 60 }),
          withTiming(1, { duration: 60 })
        )
      );
      // กระจายทันที (delay แค่ i*30 ให้ไล่กัน)
      letterX[i].value = withDelay(
        impactTime + i * 30,
        withSpring(scatterPositions[i].x, { damping: 10, stiffness: 120 })
      );
      letterY[i].value = withDelay(
        impactTime + i * 30,
        withSpring(scatterPositions[i].y, { damping: 10, stiffness: 120 })
      );
    });

    // t=2800ms: Intro จบ → เข้าสู่ playing phase (เร็วขึ้น)
    const timer = setTimeout(() => onIntroComplete(), 2800);
    return () => clearTimeout(timer);
  }, []);

  const appleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: sw * 0.5 - appleSize / 2 },
      { translateY: appleY.value },
      { scale: appleScale.value },
    ],
  }));

  const wormStyle = useAnimatedStyle(() => ({
    opacity: wormOpacity.value,
  }));

  return (
    <>
      {/* ตัวอักษร — โชว์กลางจอตั้งแต่เริ่ม */}
      {APPLE_LETTERS.map((letter, i) => {
        const lStyle = useAnimatedStyle(() => ({
          transform: [
            { translateX: letterX[i].value },
            { translateY: letterY[i].value },
            { scale: letterScale[i].value },
          ],
          opacity: letterOpacities[i].value,
        }));
        return (
          <Animated.View key={`intro-${letter.char}-${i}`} style={[styles.letter, lStyle]}>
            <Image
              source={LETTER_IMAGES[letter.char]}
              style={{ width: letterSize, height: letterSize }}
              contentFit="contain"
            />
          </Animated.View>
        );
      })}

      {/* แอปเปิ้ล — ตกลงมา → กลายเป็น bitten */}
      <Animated.View style={[styles.apple, appleStyle]}>
        <Image
          source={showBitten ? GAME_IMAGES.appleBitten : GAME_IMAGES.apple}
          style={{ width: appleSize, height: appleSize }}
          contentFit="contain"
        />
      </Animated.View>

      {/* หนอน — นิ่งอยู่กับที่ เปลี่ยนภาพตอนแอปเปิ้ลกระทบ */}
      <Animated.View style={[styles.worm, {
        left: wormRandX,
        top: wormRandY,
      }, wormStyle]}>
        <Image
          source={wormAlert ? GAME_IMAGES.wormRun : GAME_IMAGES.worm}
          style={{ width: appleSize * 0.5, height: appleSize * 0.35 }}
          contentFit="contain"
        />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  apple: { position: 'absolute', zIndex: 60 },
  letter: { position: 'absolute', zIndex: 55 },
  worm: { position: 'absolute', zIndex: 58 },
});

import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
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
import { GAME_IMAGES, LETTER_IMAGES, APPLE_LETTERS, SFX_SOUNDS, calculateSlotPositions } from '../../utils/gameConfig';

interface AppleDropProps {
  sw: number;
  sh: number;
  scatterPositions: { x: number; y: number; rotation?: number }[];
  onIntroComplete: () => void;
  onWormPosition?: (x: number, y: number) => void;
}

export default function AppleDrop({ sw, sh, scatterPositions, onIntroComplete, onWormPosition }: AppleDropProps) {
  const [showBitten, setShowBitten] = useState(false);
  const [wormAlert, setWormAlert] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const slotPositions = calculateSlotPositions(sw, sh);
  const appleLandY = sh * 0.25;
  const appleSize = Math.min(Math.max(sw * 0.35, 120), sh * 0.38, 230);
  const letterSize = slotPositions[0]?.size || 55;

  // สุ่มมุมเอียงแอปเปิ้ล 360 องศา
  const appleRotationAngle = useRef(Math.random() * 360 - 180).current;

  const appleY = useSharedValue(-sh * 0.9);
  const appleScale = useSharedValue(1);
  const appleRotation = useSharedValue(0);

  const letterX = APPLE_LETTERS.map((_, i) => useSharedValue(slotPositions[i].x));
  const letterY = APPLE_LETTERS.map((_, i) => useSharedValue(slotPositions[i].y));
  const letterOpacities = APPLE_LETTERS.map(() => useSharedValue(1));
  const letterScale = APPLE_LETTERS.map(() => useSharedValue(1));
  const letterRotation = APPLE_LETTERS.map(() => useSharedValue(0));

  const wormRandX = sw * 0.2 + Math.random() * (sw * 0.5);
  const wormRandY = sh * 0.55 + Math.random() * (sh * 0.25);
  const wormOpacity = useSharedValue(1);

  const soundsListRef = useRef<Audio.Sound[]>([]);
  const playSound = async (sfx: any) => {
    try {
      const { sound } = await Audio.Sound.createAsync(sfx);
      soundsListRef.current.push(sound);
      await sound.playAsync();
    } catch (e) {}
  };

  useEffect(() => {
    if (onWormPosition) onWormPosition(wormRandX, wormRandY);

    const slotY = slotPositions[0]?.y || sh * 0.62;
    const impactTime = 1600;

    // แอปเปิ้ลตกลงมา — ไม่หมุน อยู่ท่าเดิม
    appleY.value = withDelay(
      1000,
      withSequence(
        withTiming(slotY - appleSize / 2, { duration: 600, easing: Easing.in(Easing.quad) }),
        withSpring(appleLandY - appleSize / 2, { damping: 12, stiffness: 150 })
      )
    );

    // เสียง fall ตอนตก
    setTimeout(() => playSound(SFX_SOUNDS.fall), 1000);

    // กระทบ
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

    // เสียง bang ตอนกระทบตัวอักษร (เด้ง 1 ดังสุด)
    setTimeout(() => playSound(SFX_SOUNDS.bang), impactTime);
    // เด้ง 2 — เสียง ตึง (140 + 450 + 360 = 950ms หลัง impact)
    setTimeout(() => playSound(SFX_SOUNDS.bang), impactTime + 950);
    // เด้ง 3 — เสียง ตึง (950 + 320 + 250 = 1520ms หลัง impact)
    setTimeout(() => playSound(SFX_SOUNDS.bang), impactTime + 1520);

    APPLE_LETTERS.forEach((_, i) => {
      letterScale[i].value = withDelay(
        impactTime,
        withSequence(
          withTiming(1.3, { duration: 60 }),
          withTiming(1, { duration: 60 })
        )
      );
      const tx = scatterPositions[i].x;
      const ty = scatterPositions[i].y;

      // ใช้ rotation เดียวกับ scatterPositions เพื่อไม่ให้กระโดดตอนเปลี่ยน phase
      const finalRot = scatterPositions[i].rotation || 0;

      // จุดกระทบ = ตำแหน่งแอปเปิ้ล (กลางจอ)
      const impactX = sw * 0.5 - letterSize / 2;
      const impactY = appleLandY;

      // สุ่มจุด landing แต่ละเด้ง — กระเด็นไกลและเปลี่ยนทิศทุกเด้ง
      const randDir = () => (Math.random() > 0.5 ? 1 : -1);

      // เด้ง 1: กระเด็นไกลมาก ทิศสุ่ม
      const b1DirX = randDir();
      const b1LandX = impactX + b1DirX * sw * (0.2 + Math.random() * 0.25);
      const b1PeakY = Math.min(impactY, ty) - sh * 0.25;

      // เด้ง 2: กระเด็นไปทิศตรงข้าม ไกลปานกลาง
      const b2DirX = -b1DirX; // เปลี่ยนทิศ!
      const b2LandX = b1LandX + b2DirX * sw * (0.15 + Math.random() * 0.2);
      const b2PeakY = b1PeakY + sh * 0.08;
      const b2LandY = impactY + Math.random() * sh * 0.1;

      // เด้ง 3: กระเด็นเปลี่ยนทิศอีกครั้ง ค่อยๆ ไปจุดหมาย
      const b3DirX = randDir();
      const b3MidX = b2LandX + b3DirX * sw * (0.05 + Math.random() * 0.1);
      const b3PeakY = ty - sh * 0.06 - Math.random() * sh * 0.04;

      // สุ่ม rotation แต่ละเด้ง — หมุนแรง
      const r1 = (Math.random() - 0.5) * 360;
      const r2 = r1 + (Math.random() - 0.5) * 270;
      const r3 = r2 + (Math.random() - 0.5) * 120;

      letterX[i].value = withDelay(
        impactTime + i * 50,
        withSequence(
          withTiming(impactX, { duration: 140, easing: Easing.in(Easing.quad) }),
          // เด้ง 1 — กระเด็นไกล
          withTiming(b1LandX, { duration: 450, easing: Easing.out(Easing.quad) }),
          // ตกลง
          withTiming(b2LandX, { duration: 360, easing: Easing.in(Easing.quad) }),
          // เด้ง 2 — กระเด็นทิศตรงข้าม ไกล
          withTiming(b3MidX, { duration: 320, easing: Easing.out(Easing.quad) }),
          // ตกลง
          withTiming(b3MidX + (tx - b3MidX) * 0.4, { duration: 250, easing: Easing.in(Easing.quad) }),
          // เด้ง 3 — ค่อยๆ ไปจุดหมาย
          withTiming(tx + (Math.random() - 0.5) * 15, { duration: 180, easing: Easing.out(Easing.quad) }),
          withTiming(tx, { duration: 100 }),
        )
      );
      letterY[i].value = withDelay(
        impactTime + i * 50,
        withSequence(
          withTiming(impactY, { duration: 140, easing: Easing.in(Easing.quad) }),
          // เด้ง 1 — ขึ้นสูงมาก
          withTiming(b1PeakY, { duration: 450, easing: Easing.out(Easing.quad) }),
          // ตกลง
          withTiming(b2LandY, { duration: 360, easing: Easing.in(Easing.quad) }),
          // เด้ง 2 — ขึ้นปานกลาง
          withTiming(b2PeakY, { duration: 320, easing: Easing.out(Easing.quad) }),
          // ตกลง
          withTiming(ty + sh * 0.02, { duration: 250, easing: Easing.in(Easing.quad) }),
          // เด้ง 3 — เด้งเบาๆ
          withTiming(b3PeakY, { duration: 180, easing: Easing.out(Easing.quad) }),
          withTiming(ty, { duration: 100 }),
        )
      );
      letterRotation[i].value = withDelay(
        impactTime + i * 50,
        withSequence(
          withTiming(0, { duration: 140 }),
          // เด้ง 1 — หมุนแรง
          withTiming(r1, { duration: 450 }),
          // ตกลง
          withTiming(r2, { duration: 360 }),
          // เด้ง 2 — หมุนเปลี่ยนทิศ
          withTiming(r2 + (r3 - r2) * 0.6, { duration: 320 }),
          // ตกลง
          withTiming(r3, { duration: 250 }),
          // เด้ง 3 — ค่อยๆ หยุด
          withTiming(finalRot + 3, { duration: 180 }),
          withTiming(finalRot, { duration: 100 }),
        )
      );
    });

    const timer = setTimeout(() => onIntroComplete(), 3800);
    return () => {
      clearTimeout(timer);
      soundsListRef.current.forEach(s => s.unloadAsync().catch(() => {}));
    };
  }, []);

  const appleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: sw * 0.5 - appleSize / 2 },
      { translateY: appleY.value },
      { scale: appleScale.value },
      { rotate: `${appleRotation.value}deg` },
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
            { rotate: `${letterRotation[i].value}deg` },
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

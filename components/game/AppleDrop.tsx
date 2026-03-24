import { Audio } from "expo-av";
import { Image } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  APPLE_LETTERS,
  GAME_IMAGES,
  LETTER_IMAGES,
  SFX_SOUNDS,
  calculateSlotPositions,
} from "../../utils/gameConfig";

interface AppleDropProps {
  sw: number;
  sh: number;
  scatterPositions: { x: number; y: number; rotation?: number }[];
  onIntroComplete: () => void;
  onWormPosition?: (x: number, y: number) => void;
  onAppleRotation?: (angle: number) => void;
}

export default function AppleDrop({
  sw,
  sh,
  scatterPositions,
  onIntroComplete,
  onWormPosition,
  onAppleRotation,
}: AppleDropProps) {
  const [showBitten, setShowBitten] = useState(false);
  const [wormAlert, setWormAlert] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const slotPositions = calculateSlotPositions(sw, sh);
  const appleLandY = sh * 0.25;
  const appleSize = Math.min(Math.max(sw * 0.35, 120), sh * 0.38, 230);
  const letterSize = slotPositions[0]?.size || 50;

  // สุ่มมุมเอียงแอปเปิ้ลไม่เกิน ±45°
  const appleRotationAngle = useRef(Math.random() * 90 - 45).current;

  const appleY = useSharedValue(-sh * 0.9);
  const appleScale = useSharedValue(1);
  const appleRotation = useSharedValue(0);

  const letterX = APPLE_LETTERS.map((_, i) =>
    useSharedValue(slotPositions[i].x),
  );
  const letterY = APPLE_LETTERS.map((_, i) =>
    useSharedValue(slotPositions[i].y),
  );
  const letterOpacities = APPLE_LETTERS.map(() => useSharedValue(1));
  const letterScale = APPLE_LETTERS.map(() => useSharedValue(1));
  const letterRotation = APPLE_LETTERS.map(() => useSharedValue(0));

  // ตำแหน่งสุดท้ายของหนอน (จุดที่จะส่งให้ WormCharacter)
  const wormFinalX = useRef(sw * 0.15 + Math.random() * (sw * 0.6)).current;
  const wormFinalY = useRef(sh * 0.6 + Math.random() * (sh * 0.2)).current;

  // หนอนเริ่มที่ด้านล่างจอ (ซ่อนอยู่)
  const wormX = useSharedValue(wormFinalX);
  const wormY = useSharedValue(sh * 0.85);
  const wormOpacity = useSharedValue(0);
  const wormScale = useSharedValue(0.8);

  const soundsListRef = useRef<Audio.Sound[]>([]);
  const playSound = async (sfx: any) => {
    try {
      const { sound } = await Audio.Sound.createAsync(sfx);
      soundsListRef.current.push(sound);
      await sound.playAsync();
    } catch (e) {}
  };

  useEffect(() => {
    // ส่งตำแหน่งสุดท้ายของหนอนให้ game.tsx (ตรงๆ ไม่มี offset)
    if (onWormPosition) onWormPosition(wormFinalX, wormFinalY);
    if (onAppleRotation) onAppleRotation(appleRotationAngle);

    const slotY = slotPositions[0]?.y || sh * 0.62;
    const impactTime = 1600;

    // === Phase 1: แอปเปิ้ลตกลงมา ===
    appleY.value = withDelay(
      1000,
      withSequence(
        withTiming(slotY - appleSize / 2, {
          duration: 600,
          easing: Easing.in(Easing.quad),
        }),
        withSpring(appleLandY - appleSize / 2, { damping: 12, stiffness: 150 }),
      ),
    );
    appleRotation.value = withDelay(
      1000,
      withTiming(appleRotationAngle, {
        duration: 600,
        easing: Easing.in(Easing.quad),
      }),
    );
    setTimeout(() => playSound(SFX_SOUNDS.fall), 1000);

    // === Phase 2: แอปเปิ้ลกระทบ → ตัวอักษรกระเด็น ===
    appleScale.value = withDelay(
      impactTime,
      withSequence(
        withTiming(1.3, { duration: 60 }),
        withTiming(0.85, { duration: 60 }),
        withTiming(1, { duration: 80 }),
      ),
    );

    setTimeout(() => playSound(SFX_SOUNDS.bang), impactTime);
    setTimeout(() => playSound(SFX_SOUNDS.bang), impactTime + 950);
    setTimeout(() => playSound(SFX_SOUNDS.bang), impactTime + 1520);

    // === Phase 3: หนอนปรากฏ → เดินช้าๆ ไปหาแอปเปิ้ล ===
    const wormAppearTime = impactTime + 500; // โผล่หลังกระทบ 500ms
    const wormWalkDuration = 1800; // เดินช้าๆ ไปหาแอปเปิ้ล 1.8 วินาที
    const wormBiteTime = wormAppearTime + wormWalkDuration; // ถึงแอปเปิ้ล
    const wormRunDuration = 1000; // วิ่งหนีช้าๆ 2 วินาที

    // หนอนโผล่ขึ้นมา (fade in ช้าๆ)
    wormOpacity.value = withDelay(
      wormAppearTime,
      withTiming(1, { duration: 400 }),
    );
    wormScale.value = withDelay(wormAppearTime, withSpring(1, { damping: 12 }));

    // หนอนเดินช้าๆ ไปหาแอปเปิ้ล
    const appleX = sw * 0.5;
    const appleCenterY = appleLandY - appleSize / 2 + appleSize * 0.7;
    wormX.value = withDelay(
      wormAppearTime,
      withTiming(appleX - appleSize * 0.15, {
        duration: wormWalkDuration,
        easing: Easing.inOut(Easing.quad),
      }),
    );
    wormY.value = withDelay(
      wormAppearTime,
      withTiming(appleCenterY, {
        duration: wormWalkDuration,
        easing: Easing.inOut(Easing.quad),
      }),
    );

    // === Phase 4: หนอนกัดแอปเปิ้ล → bitten + เปลี่ยนเป็น worm_run ===
    setTimeout(() => {
      setShowBitten(true);
      setWormAlert(true);
    }, wormBiteTime);

    // === Phase 5: หนอนวิ่งหนีช้าๆ ไปตำแหน่งสุดท้าย ===
    wormX.value = withDelay(
      wormAppearTime,
      withSequence(
        withTiming(appleX - appleSize * 0.15, {
          duration: wormWalkDuration,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(wormFinalX, {
          duration: wormRunDuration,
          easing: Easing.out(Easing.quad),
        }),
      ),
    );
    wormY.value = withDelay(
      wormAppearTime,
      withSequence(
        withTiming(appleCenterY, {
          duration: wormWalkDuration,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(wormFinalY, {
          duration: wormRunDuration,
          easing: Easing.out(Easing.quad),
        }),
      ),
    );

    // ตัวอักษรกระเด็น (เหมือนเดิม)
    APPLE_LETTERS.forEach((_, i) => {
      letterScale[i].value = withDelay(
        impactTime,
        withSequence(
          withTiming(1.3, { duration: 60 }),
          withTiming(1, { duration: 60 }),
        ),
      );
      const tx = scatterPositions[i].x;
      const ty = scatterPositions[i].y;
      const finalRot = scatterPositions[i].rotation || 0;
      const impactX = sw * 0.5 - letterSize / 2;
      const impactY = appleLandY;
      const randDir = () => (Math.random() > 0.5 ? 1 : -1);

      const b1DirX = randDir();
      const b1LandX = impactX + b1DirX * sw * (0.2 + Math.random() * 0.25);
      const b1PeakY = Math.min(impactY, ty) - sh * 0.25;
      const b2DirX = -b1DirX;
      const b2LandX = b1LandX + b2DirX * sw * (0.15 + Math.random() * 0.2);
      const b2PeakY = b1PeakY + sh * 0.08;
      const b2LandY = impactY + Math.random() * sh * 0.1;
      const b3DirX = randDir();
      const b3MidX = b2LandX + b3DirX * sw * (0.05 + Math.random() * 0.1);
      const b3PeakY = ty - sh * 0.06 - Math.random() * sh * 0.04;
      const r1 = (Math.random() - 0.5) * 360;
      const r2 = r1 + (Math.random() - 0.5) * 270;
      const r3 = r2 + (Math.random() - 0.5) * 120;

      letterX[i].value = withDelay(
        impactTime + i * 50,
        withSequence(
          withTiming(impactX, {
            duration: 140,
            easing: Easing.in(Easing.quad),
          }),
          withTiming(b1LandX, {
            duration: 450,
            easing: Easing.out(Easing.quad),
          }),
          withTiming(b2LandX, {
            duration: 360,
            easing: Easing.in(Easing.quad),
          }),
          withTiming(b3MidX, {
            duration: 320,
            easing: Easing.out(Easing.quad),
          }),
          withTiming(b3MidX + (tx - b3MidX) * 0.4, {
            duration: 250,
            easing: Easing.in(Easing.quad),
          }),
          withTiming(tx + (Math.random() - 0.5) * 15, {
            duration: 180,
            easing: Easing.out(Easing.quad),
          }),
          withTiming(tx, { duration: 100 }),
        ),
      );
      letterY[i].value = withDelay(
        impactTime + i * 50,
        withSequence(
          withTiming(impactY, {
            duration: 140,
            easing: Easing.in(Easing.quad),
          }),
          withTiming(b1PeakY, {
            duration: 450,
            easing: Easing.out(Easing.quad),
          }),
          withTiming(b2LandY, {
            duration: 360,
            easing: Easing.in(Easing.quad),
          }),
          withTiming(b2PeakY, {
            duration: 320,
            easing: Easing.out(Easing.quad),
          }),
          withTiming(ty + sh * 0.02, {
            duration: 250,
            easing: Easing.in(Easing.quad),
          }),
          withTiming(b3PeakY, {
            duration: 180,
            easing: Easing.out(Easing.quad),
          }),
          withTiming(ty, { duration: 100 }),
        ),
      );
      letterRotation[i].value = withDelay(
        impactTime + i * 50,
        withSequence(
          withTiming(0, { duration: 140 }),
          withTiming(r1, { duration: 450 }),
          withTiming(r2, { duration: 360 }),
          withTiming(r2 + (r3 - r2) * 0.6, { duration: 320 }),
          withTiming(r3, { duration: 250 }),
          withTiming(finalRot + 3, { duration: 180 }),
          withTiming(finalRot, { duration: 100 }),
        ),
      );
    });

    // เพิ่มเวลา intro ให้หนอนวิ่งหนีเสร็จก่อน
    const totalIntroTime = wormBiteTime + wormRunDuration + 400;
    const timer = setTimeout(() => onIntroComplete(), totalIntroTime);
    return () => {
      clearTimeout(timer);
      soundsListRef.current.forEach((s) => s.unloadAsync().catch(() => {}));
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

  const wormAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: wormX.value },
      { translateY: wormY.value },
      { scale: wormScale.value },
    ],
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
          <Animated.View
            key={`intro-${letter.char}-${i}`}
            style={[styles.letter, lStyle]}
          >
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

      {/* หนอน — โผล่ → เดินไปกัดแอปเปิ้ล → วิ่งหนีช้าๆ */}
      <Animated.View style={[styles.worm, wormAnimStyle]}>
        <Image
          source={wormAlert ? GAME_IMAGES.wormRun : GAME_IMAGES.worm}
          style={{ width: appleSize * 0.7, height: appleSize * 0.5 }}
          contentFit="contain"
        />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  apple: { position: "absolute", zIndex: 60 },
  letter: { position: "absolute", zIndex: 55 },
  worm: { position: "absolute", zIndex: 58 },
});

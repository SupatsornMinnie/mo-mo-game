import { Audio } from "expo-av";
import { Image } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  type SharedValue,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { ANT_IMAGES, ANT_LETTERS } from "../../utils/antConfig";
import {
  LETTER_IMAGES,
  SFX_SOUNDS,
  calculateSlotPositions,
} from "../../utils/gameConfig";

// ─── แยก component ตัวอักษร (หลีกเลี่ยง hook ใน .map) ───
function IntroLetter({
  char,
  size,
  x,
  y,
  scale,
  rotation,
  opacity,
}: {
  char: string;
  size: number;
  x: SharedValue<number>;
  y: SharedValue<number>;
  scale: SharedValue<number>;
  rotation: SharedValue<number>;
  opacity: SharedValue<number>;
}) {
  const lStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));
  return (
    <Animated.View style={[styles.letter, lStyle]}>
      <Image
        source={LETTER_IMAGES[char]}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </Animated.View>
  );
}

interface SugarRollProps {
  sw: number;
  sh: number;
  scatterPositions: { x: number; y: number; rotation?: number }[];
  onIntroComplete: () => void;
  onAntPosition?: (x: number, y: number) => void;
  onSugarRotation?: (angle: number) => void;
}

export default function SugarRoll({
  sw,
  sh,
  scatterPositions,
  onIntroComplete,
  onAntPosition,
  onSugarRotation,
}: SugarRollProps) {
  const [sugarFrame, setSugarFrame] = useState<number>(0);
  // 0 = sugar.webp, 1-4 = sprite crack, 5 = sugar_break1
  const [showBreak2, setShowBreak2] = useState(false); // sugar_break2 แยกชิ้น
  const [antCarrying, setAntCarrying] = useState(false); // มดแบกแล้ว

  const soundsListRef = useRef<Audio.Sound[]>([]);
  const playSound = async (sfx: any) => {
    try {
      const { sound } = await Audio.Sound.createAsync(sfx);
      soundsListRef.current.push(sound);
      await sound.playAsync();
    } catch (e) {}
  };

  const slotPositions = calculateSlotPositions(sw, sh, ANT_LETTERS.length);
  const sugarLandY = sh * 0.25;
  const sugarSize = Math.min(Math.max(sw * 0.35, 120), sh * 0.38, 230);
  const letterSize = slotPositions[0]?.size || 50;
  const antSize = sugarSize * 0.45;
  const break2Size = sugarSize;

  const sugarRotationAngle = useRef(Math.random() * 90 - 45).current;

  // ---- Sugar (main) ----
  const sugarY = useSharedValue(-sh * 0.9);
  const sugarScale = useSharedValue(1);
  const sugarRotation = useSharedValue(0);

  // ---- Sugar break2 (ชิ้นที่แยกออก → ลอยไปบนหัวมด) ----
  const break2X = useSharedValue(0);
  const break2Y = useSharedValue(0);
  const break2Scale = useSharedValue(1);
  const break2Opacity = useSharedValue(0);

  // ---- Letters ----
  const letterX = ANT_LETTERS.map((_, i) =>
    useSharedValue(slotPositions[i]?.x ?? 0),
  );
  const letterY = ANT_LETTERS.map((_, i) =>
    useSharedValue(slotPositions[i]?.y ?? 0),
  );
  const letterOpacities = ANT_LETTERS.map(() => useSharedValue(1));
  const letterScales = ANT_LETTERS.map(() => useSharedValue(1));
  const letterRotations = ANT_LETTERS.map(() => useSharedValue(0));

  // ---- Ant ----
  const antFinalX = useRef(sw * 0.7).current; // ตำแหน่งแถวมด (ขวา)
  const antFinalY = useRef(sh * 0.8).current;
  const antX = useSharedValue(sw * 0.5);
  const antY = useSharedValue(sh * 0.85);
  const antOpacity = useSharedValue(0);
  const antScale = useSharedValue(0.8);
  const antCarryingShared = useSharedValue(0); // 0 = ยังไม่แบก, 1 = แบกแล้ว

  useEffect(() => {
    if (onAntPosition) onAntPosition(antFinalX, antFinalY);
    if (onSugarRotation) onSugarRotation(sugarRotationAngle);

    const slotY = slotPositions[0]?.y || sh * 0.62;
    const impactTime = 1600;

    // ========== Phase 1: น้ำตาลตกจากบน ==========
    sugarY.value = withDelay(
      1000,
      withSequence(
        withTiming(slotY - sugarSize / 2, {
          duration: 600,
          easing: Easing.in(Easing.quad),
        }),
        withSpring(sugarLandY - sugarSize / 2, { damping: 12, stiffness: 150 }),
      ),
    );
    sugarRotation.value = withDelay(
      1000,
      withTiming(sugarRotationAngle, {
        duration: 600,
        easing: Easing.in(Easing.quad),
      }),
    );
    setTimeout(() => playSound(SFX_SOUNDS.fall), 1000);

    // ========== Phase 2: กระทบ → sprite crack → แยกชิ้น ==========
    sugarScale.value = withDelay(
      impactTime,
      withSequence(
        withTiming(1.3, { duration: 60 }),
        withTiming(0.85, { duration: 60 }),
        withTiming(1, { duration: 80 }),
      ),
    );
    setTimeout(() => playSound(SFX_SOUNDS.bang), impactTime);

    // Sprite crack animation
    const frameDuration = 150;
    for (let f = 1; f <= 4; f++) {
      setTimeout(() => setSugarFrame(f), impactTime + f * frameDuration);
    }
    // หลัง sprite จบ → sugar_break1 ค้าง + sugar_break2 โผล่ตรงนั้น
    const crackDone = impactTime + 5 * frameDuration;
    setTimeout(() => {
      setSugarFrame(5); // sugar_break1 ค้าง
      setShowBreak2(true); // sugar_break2 โผล่
    }, crackDone);

    // sugar_break2 เริ่มที่ตำแหน่งน้ำตาล (ซ้อนกัน)
    const sugarCenterX = sw * 0.5 - break2Size / 2;
    const sugarCenterY = sugarLandY - sugarSize / 2;
    break2X.value = sugarCenterX;
    break2Y.value = sugarCenterY;
    break2Opacity.value = withDelay(
      crackDone,
      withTiming(1, { duration: 100 }),
    );

    // ตัวอักษรกระเด็น
    ANT_LETTERS.forEach((_, i) => {
      letterScales[i].value = withDelay(
        impactTime,
        withSequence(
          withTiming(1.3, { duration: 60 }),
          withTiming(1, { duration: 60 }),
        ),
      );
      const tx = scatterPositions[i]?.x ?? 0;
      const ty = scatterPositions[i]?.y ?? 0;
      const finalRot = scatterPositions[i]?.rotation || 0;
      const impactX = sw * 0.5 - letterSize / 2;
      const impactY = sugarLandY;
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
      letterRotations[i].value = withDelay(
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

    // ========== Phase 3: มดโผล่จากนอกจอ → เดินไปหาน้ำตาล → แบก → กลับแถว ==========
    const antAppearTime = crackDone + 200;
    const antWalkToSugar = 1200;
    const antAtSugar = antAppearTime + antWalkToSugar;
    const antPickupDuration = 400;
    const antWalkBack = 1000;

    // มดเดินมาถึงตำแหน่งน้ำตาล (น้ำตาลอยู่กับที่ มดเดินมาหา)
    const antAtSugarX = sugarCenterX + break2Size / 2 - antSize / 2;
    const antAtSugarY = sugarCenterY + break2Size * 0.5;

    // break2 บนหัวมด ขณะอยู่ที่น้ำตาล
    const break2OnAntX = antAtSugarX + antSize / 2 - break2Size / 2;
    const break2OnAntY = antAtSugarY - break2Size * 0.5;

    // break2 ตามมดกลับแถว
    const break2FinalX = antFinalX + antSize / 2 - break2Size / 2;
    const break2FinalY = antFinalY - break2Size * 0.5;

    antOpacity.value = withDelay(
      antAppearTime,
      withTiming(1, { duration: 300 }),
    );
    antScale.value = withDelay(antAppearTime, withSpring(1, { damping: 12 }));

    // มดเริ่มนอกจอด้านล่าง → เดินไปหาน้ำตาล → รอหยิบ → กลับแถว
    antX.value = sw * 0.5 - antSize / 2;
    antY.value = sh + antSize;
    antX.value = withDelay(
      antAppearTime,
      withSequence(
        withTiming(antAtSugarX, {
          duration: antWalkToSugar,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(antAtSugarX, { duration: antPickupDuration }),
        withTiming(antFinalX, {
          duration: antWalkBack,
          easing: Easing.out(Easing.quad),
        }),
      ),
    );
    antY.value = withDelay(
      antAppearTime,
      withSequence(
        withTiming(antAtSugarY, {
          duration: antWalkToSugar,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(antAtSugarY, { duration: antPickupDuration }),
        withTiming(antFinalY, {
          duration: antWalkBack,
          easing: Easing.out(Easing.quad),
        }),
      ),
    );

    // ========== Phase 4: มดถึงน้ำตาล → แบก sugar_break2 (ติดตามมดโดยตรง) ==========
    setTimeout(() => setAntCarrying(true), antAtSugar);

    // เปลี่ยน antCarryingShared → break2 จะ follow ant ผ่าน useAnimatedStyle
    antCarryingShared.value = withDelay(
      antAtSugar,
      withTiming(1, { duration: antPickupDuration }),
    );

    // ========== Intro complete ==========
    const totalIntroTime = antAtSugar + antPickupDuration + antWalkBack + 400;
    const timer = setTimeout(() => onIntroComplete(), totalIntroTime);
    return () => {
      clearTimeout(timer);
      soundsListRef.current.forEach((s) => s.unloadAsync().catch(() => {}));
    };
  }, []);

  // Sugar image
  const sugarImage = (() => {
    switch (sugarFrame) {
      case 0:
        return ANT_IMAGES.sugar;
      case 1:
        return ANT_IMAGES.sprite1;
      case 2:
        return ANT_IMAGES.sprite2;
      case 3:
        return ANT_IMAGES.sprite3;
      case 4:
        return ANT_IMAGES.sprite4;
      default:
        return ANT_IMAGES.sugarBreak1;
    }
  })();

  const sugarStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: sw * 0.5 - sugarSize / 2 },
      { translateY: sugarY.value },
      { scale: sugarScale.value },
      { rotate: `${sugarRotation.value}deg` },
    ],
  }));

  const break2Style = useAnimatedStyle(() => {
    const carry = antCarryingShared.value;
    // ตำแหน่งบนหัวมด (ติดตาม ant โดยตรง)
    const followX = antX.value + antSize / 2 - break2Size / 2;
    const followY = antY.value - break2Size * 0.5;
    return {
      transform: [
        { translateX: break2X.value * (1 - carry) + followX * carry },
        { translateY: break2Y.value * (1 - carry) + followY * carry },
        { scale: break2Scale.value },
      ],
      opacity: break2Opacity.value,
    };
  });

  const antAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: antX.value },
      { translateY: antY.value },
      { scale: antScale.value },
    ],
    opacity: antOpacity.value,
  }));

  return (
    <>
      {/* ตัวอักษร */}
      {ANT_LETTERS.map((letter, i) => (
        <IntroLetter
          key={`intro-${letter.char}-${i}`}
          char={letter.char}
          size={letterSize}
          x={letterX[i]}
          y={letterY[i]}
          scale={letterScales[i]}
          rotation={letterRotations[i]}
          opacity={letterOpacities[i]}
        />
      ))}

      {/* ก้อนน้ำตาลหลัก — ตก → crack → sugar_break1 */}
      <Animated.View style={[styles.sugar, sugarStyle]}>
        <Image
          source={sugarImage}
          style={{ width: sugarSize, height: sugarSize }}
          contentFit="contain"
        />
      </Animated.View>

      {/* sugar_break2 — โผล่ตอนแตก → ย่อลง → ลอยไปบนหัวมด */}
      {showBreak2 && (
        <Animated.View style={[styles.break2, break2Style]}>
          <Image
            source={ANT_IMAGES.sugarBreak2}
            style={{ width: break2Size, height: break2Size }}
            contentFit="contain"
          />
        </Animated.View>
      )}

      {/* มด — เดินมาจากล่าง → แบก sugar → กลับตำแหน่งแถว */}
      <Animated.View style={[styles.ant, antAnimStyle]}>
        <Image
          source={ANT_IMAGES.ant}
          style={{ width: antSize, height: antSize * 0.7 }}
          contentFit="contain"
        />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  sugar: { position: "absolute", zIndex: 60 },
  letter: { position: "absolute", zIndex: 55 },
  ant: { position: "absolute", zIndex: 58 },
  break2: { position: "absolute", zIndex: 59 },
});

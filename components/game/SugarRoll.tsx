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
import { ANT_IMAGES, ANT_LETTERS } from "../../utils/antConfig";
import {
  LETTER_IMAGES,
  SFX_SOUNDS,
  calculateSlotPositions,
} from "../../utils/gameConfig";

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
  // 0 = sugar.webp (full), 1-4 = sprite_ant1-4 (cracking), 5 = sugar_break2 (broken remains)
  const [showAnt, setShowAnt] = useState(false);
  const [antCarrying, setAntCarrying] = useState(false);

  const soundsListRef = useRef<Audio.Sound[]>([]);
  const playSound = async (sfx: any) => {
    try {
      const { sound } = await Audio.Sound.createAsync(sfx);
      soundsListRef.current.push(sound);
      await sound.playAsync();
    } catch (e) {}
  };

  const slotPositions = calculateSlotPositions(sw, sh, ANT_LETTERS.length);
  const sugarSize = Math.min(Math.max(sw * 0.3, 100), sh * 0.3, 180);
  const letterSize = slotPositions[0]?.size || 50;
  const antSize = sugarSize * 0.9;

  // Sugar position & animation
  const sugarX = useSharedValue(sw + sugarSize);
  const sugarY = useSharedValue(0);
  const sugarScale = useSharedValue(1);
  const sugarRotation = useSharedValue(0);
  const sugarOpacity = useSharedValue(1);

  // Sugar final resting position (where it stops after rolling)
  const sugarLandX = sw * 0.5 - sugarSize / 2;
  const sugarLandY = sh * 0.22;

  // Ant position
  const antX = useSharedValue(sw + antSize);
  const antY = useSharedValue(0);
  const antOpacity = useSharedValue(0);
  const antScale = useSharedValue(0.8);

  // Ant final position (where it runs away to — reported to GameScreen)
  const antFinalX = useRef(sw * 0.15 + Math.random() * (sw * 0.5)).current;
  const antFinalY = useRef(sh * 0.55 + Math.random() * (sh * 0.2)).current;

  // Letters
  const letterXValues = ANT_LETTERS.map((_, i) =>
    useSharedValue(slotPositions[i]?.x ?? 0),
  );
  const letterYValues = ANT_LETTERS.map((_, i) =>
    useSharedValue(slotPositions[i]?.y ?? 0),
  );
  const letterScales = ANT_LETTERS.map(() => useSharedValue(1));
  const letterRotations = ANT_LETTERS.map(() => useSharedValue(0));
  const letterOpacities = ANT_LETTERS.map(() => useSharedValue(1));

  useEffect(() => {
    if (onAntPosition) onAntPosition(antFinalX, antFinalY);
    if (onSugarRotation) onSugarRotation(0);

    const slotY = slotPositions[0]?.y || sh * 0.42;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // ===== Phase 1: Sugar rolls in from right =====
    const rollStartDelay = 800;
    const rollDuration = 1200;
    const rollTargetX = sw * 0.5 - sugarSize / 2;
    const rollTargetY = slotY - sugarSize * 0.3;

    sugarX.value = sw + sugarSize;
    sugarY.value = rollTargetY;
    sugarRotation.value = 0;

    // Start rolling
    sugarX.value = withDelay(
      rollStartDelay,
      withTiming(rollTargetX, {
        duration: rollDuration,
        easing: Easing.out(Easing.quad),
      }),
    );
    sugarRotation.value = withDelay(
      rollStartDelay,
      withTiming(-720, {
        duration: rollDuration,
        easing: Easing.out(Easing.quad),
      }),
    );
    timers.push(setTimeout(() => playSound(SFX_SOUNDS.fall), rollStartDelay));

    // ===== Phase 2: Sugar hits letters — letters scatter =====
    const impactTime = rollStartDelay + rollDuration;

    // Sugar squash on impact
    sugarScale.value = withDelay(
      impactTime,
      withSequence(
        withTiming(1.3, { duration: 60 }),
        withTiming(0.85, { duration: 60 }),
        withTiming(1, { duration: 80 }),
      ),
    );

    timers.push(setTimeout(() => playSound(SFX_SOUNDS.bang), impactTime));
    timers.push(setTimeout(() => playSound(SFX_SOUNDS.bang), impactTime + 600));
    timers.push(setTimeout(() => playSound(SFX_SOUNDS.bang), impactTime + 1200));

    // Letters bounce and scatter (same physics as AppleDrop)
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
      const impactX = rollTargetX;
      const impactY = rollTargetY + sugarSize * 0.5;
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

      letterXValues[i].value = withDelay(
        impactTime + i * 50,
        withSequence(
          withTiming(impactX, { duration: 140, easing: Easing.in(Easing.quad) }),
          withTiming(b1LandX, { duration: 450, easing: Easing.out(Easing.quad) }),
          withTiming(b2LandX, { duration: 360, easing: Easing.in(Easing.quad) }),
          withTiming(b3MidX, { duration: 320, easing: Easing.out(Easing.quad) }),
          withTiming(b3MidX + (tx - b3MidX) * 0.4, { duration: 250, easing: Easing.in(Easing.quad) }),
          withTiming(tx + (Math.random() - 0.5) * 15, { duration: 180, easing: Easing.out(Easing.quad) }),
          withTiming(tx, { duration: 100 }),
        ),
      );
      letterYValues[i].value = withDelay(
        impactTime + i * 50,
        withSequence(
          withTiming(impactY, { duration: 140, easing: Easing.in(Easing.quad) }),
          withTiming(b1PeakY, { duration: 450, easing: Easing.out(Easing.quad) }),
          withTiming(b2LandY, { duration: 360, easing: Easing.in(Easing.quad) }),
          withTiming(b2PeakY, { duration: 320, easing: Easing.out(Easing.quad) }),
          withTiming(ty + sh * 0.02, { duration: 250, easing: Easing.in(Easing.quad) }),
          withTiming(b3PeakY, { duration: 180, easing: Easing.out(Easing.quad) }),
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

    // ===== Phase 3: Sugar cracking sprite animation =====
    const crackStart = impactTime + 400;
    const frameDuration = 120;
    for (let f = 1; f <= 4; f++) {
      timers.push(setTimeout(() => setSugarFrame(f), crackStart + f * frameDuration));
    }
    // After crack, show broken sugar
    timers.push(setTimeout(() => setSugarFrame(5), crackStart + 5 * frameDuration));

    // Sugar settles to final position
    sugarX.value = withDelay(
      crackStart,
      withTiming(sugarLandX, { duration: 600, easing: Easing.out(Easing.quad) }),
    );
    sugarY.value = withDelay(
      crackStart,
      withTiming(sugarLandY, { duration: 600, easing: Easing.out(Easing.quad) }),
    );
    sugarRotation.value = withDelay(
      crackStart,
      withTiming(0, { duration: 600 }),
    );

    // ===== Phase 4: Ant appears, walks to sugar, takes a piece =====
    const antAppearTime = crackStart + 800;
    const antWalkDuration = 1400;
    const antBiteTime = antAppearTime + antWalkDuration;
    const antRunDuration = 1000;

    // Ant appears from bottom
    timers.push(setTimeout(() => setShowAnt(true), antAppearTime));
    antOpacity.value = withDelay(antAppearTime, withTiming(1, { duration: 300 }));
    antScale.value = withDelay(antAppearTime, withSpring(1, { damping: 12 }));

    // Ant walks to sugar
    const sugarCenterX = sugarLandX + sugarSize * 0.3;
    const sugarCenterY = sugarLandY + sugarSize * 0.7;
    antX.value = withDelay(
      antAppearTime,
      withSequence(
        withTiming(sugarCenterX, {
          duration: antWalkDuration,
          easing: Easing.inOut(Easing.quad),
        }),
        // After grabbing, run to final position
        withTiming(antFinalX, {
          duration: antRunDuration,
          easing: Easing.out(Easing.quad),
        }),
      ),
    );
    antY.value = withDelay(
      antAppearTime,
      withSequence(
        withTiming(sugarCenterY, {
          duration: antWalkDuration,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(antFinalY, {
          duration: antRunDuration,
          easing: Easing.out(Easing.quad),
        }),
      ),
    );

    // Ant grabs sugar piece → changes to ant_carry_sugar
    timers.push(setTimeout(() => setAntCarrying(true), antBiteTime));

    // ===== Phase 5: Intro complete =====
    const totalIntroTime = antBiteTime + antRunDuration + 400;
    timers.push(setTimeout(() => onIntroComplete(), totalIntroTime));

    return () => {
      timers.forEach(t => clearTimeout(t));
      soundsListRef.current.forEach(s => s.unloadAsync().catch(() => {}));
    };
  }, []);

  // Sugar image based on frame
  const sugarImage = (() => {
    switch (sugarFrame) {
      case 0: return ANT_IMAGES.sugar;
      case 1: return ANT_IMAGES.sprite1;
      case 2: return ANT_IMAGES.sprite2;
      case 3: return ANT_IMAGES.sprite3;
      case 4: return ANT_IMAGES.sprite4;
      default: return ANT_IMAGES.sugarBreak2; // broken remains
    }
  })();

  const sugarStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: sugarX.value },
      { translateY: sugarY.value },
      { scale: sugarScale.value },
      { rotate: `${sugarRotation.value}deg` },
    ],
    opacity: sugarOpacity.value,
  }));

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
      {/* Letters — start at slot positions, scatter on impact */}
      {ANT_LETTERS.map((letter, i) => {
        const lStyle = useAnimatedStyle(() => ({
          transform: [
            { translateX: letterXValues[i].value },
            { translateY: letterYValues[i].value },
            { scale: letterScales[i].value },
            { rotate: `${letterRotations[i].value}deg` },
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

      {/* Sugar cube — rolls in, cracks, becomes broken */}
      <Animated.View style={[styles.sugar, sugarStyle]}>
        <Image
          source={sugarImage}
          style={{ width: sugarSize, height: sugarSize }}
          contentFit="contain"
        />
      </Animated.View>

      {/* Ant — appears, walks to sugar, grabs piece, runs away */}
      {showAnt && (
        <Animated.View style={[styles.ant, antAnimStyle]}>
          <Image
            source={antCarrying ? ANT_IMAGES.antCarrySugar : ANT_IMAGES.ant}
            style={{ width: antSize, height: antSize * 0.7 }}
            contentFit="contain"
          />
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sugar: { position: "absolute", zIndex: 60 },
  letter: { position: "absolute", zIndex: 55 },
  ant: { position: "absolute", zIndex: 58 },
});

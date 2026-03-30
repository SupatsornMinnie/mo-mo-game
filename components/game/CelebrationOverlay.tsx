import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { GAME_IMAGES } from '../../utils/gameConfig';

// ─── สีฟอง ───────────────────────────
const BUBBLE_COLORS = [
  { bg: 'rgba(173,216,230,0.45)', border: 'rgba(173,216,230,0.7)' },
  { bg: 'rgba(255,182,193,0.40)', border: 'rgba(255,182,193,0.65)' },
  { bg: 'rgba(144,238,144,0.40)', border: 'rgba(144,238,144,0.65)' },
  { bg: 'rgba(221,160,221,0.40)', border: 'rgba(221,160,221,0.65)' },
  { bg: 'rgba(255,255,224,0.50)', border: 'rgba(255,255,200,0.7)' },
  { bg: 'rgba(255,255,255,0.45)', border: 'rgba(255,255,255,0.65)' },
];

// ─── Particle (ลูกของฟอง) ──────────
function BubbleParticle({ angle, color, popTime, totalCycle, bubbleSize }: {
  angle: number; color: string; popTime: number; totalCycle: number; bubbleSize: number;
}) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);
  const spread = bubbleSize * 1.5;
  const dx = Math.cos(angle) * spread;
  const dy = Math.sin(angle) * spread;

  useEffect(() => {
    const startParticle = () => {
      progress.value = 0;
      opacity.value = 0;
      progress.value = withDelay(popTime,
        withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) })
      );
      opacity.value = withDelay(popTime,
        withSequence(
          withTiming(0.9, { duration: 80 }),
          withTiming(0, { duration: 320 }),
        )
      );
      setTimeout(startParticle, totalCycle);
    };
    startParticle();
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: dx * progress.value },
      { translateY: dy * progress.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{
      position: 'absolute',
      left: bubbleSize / 2 - 2,
      top: bubbleSize / 2 - 2,
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: color,
    }, style]} />
  );
}

// ─── Bubble ลอยแล้วแตก ─────────────────
function CelebBubble({ index, sw, sh }: { index: number; sw: number; sh: number }) {
  const size = 18 + Math.random() * 55;
  const startX = Math.random() * (sw - size);
  const startY = Math.random() * sh;
  const colorIndex = index % BUBBLE_COLORS.length;
  const color = BUBBLE_COLORS[colorIndex];

  const y = useSharedValue(startY);
  const bubbleOpacity = useSharedValue(0);
  const scale = useSharedValue(1);

  const floatDist = sh * (0.3 + Math.random() * 0.5);
  const floatDuration = 1500 + Math.random() * 2500;
  const popAt = floatDuration * (0.5 + Math.random() * 0.4);
  const totalCycle = floatDuration + 300;
  // ฟองเริ่มทันที — สุ่ม delay แค่เล็กน้อยเพื่อกระจาย
  const delay = Math.random() * 800;

  useEffect(() => {
    bubbleOpacity.value = withDelay(delay,
      withSequence(
        withTiming(0.7, { duration: 400 }),
        withTiming(0.6, { duration: popAt - 500 }),
        withTiming(0, { duration: 200 }),
      )
    );
    y.value = withDelay(delay,
      withTiming(startY - floatDist, { duration: floatDuration, easing: Easing.out(Easing.quad) })
    );
    scale.value = withDelay(delay + popAt,
      withTiming(1.5, { duration: 200, easing: Easing.out(Easing.quad) })
    );
  }, []);

  const posStyle = useAnimatedStyle(() => ({ transform: [{ translateY: y.value - startY }] }));
  const bubStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: bubbleOpacity.value,
  }));

  const angles = [0, 1.26, 2.51, 3.77, 5.03];

  return (
    <Animated.View style={[{
      position: 'absolute',
      left: startX,
      top: startY,
      width: size,
      height: size,
      overflow: 'visible',
    }, posStyle]}>
      <Animated.View style={[{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: color.bg,
        borderWidth: 1.5, borderColor: color.border,
      }, bubStyle]} />
      {angles.map((angle, pi) => (
        <BubbleParticle
          key={pi}
          angle={angle}
          color={color.border}
          popTime={delay + popAt}
          totalCycle={delay + totalCycle}
          bubbleSize={size}
        />
      ))}
    </Animated.View>
  );
}

// ─── LetterAnimItem ───
function LetterAnimItem({
  letterKey,
  scale,
  yVal,
  size,
}: {
  letterKey: string;
  scale: ReturnType<typeof useSharedValue<number>>;
  yVal: ReturnType<typeof useSharedValue<number>>;
  size: number;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: yVal.value }],
  }));
  return (
    <Animated.View style={style}>
      <Image
        source={GAME_IMAGES.letters[letterKey]}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </Animated.View>
  );
}

// ─── Main ────────────────────────────────────────────────
// เสียงจัดการโดย useGameSounds ใน game.tsx แล้ว — ไม่โหลดเสียงซ้ำที่นี่

interface CelebrationOverlayProps {
  wordImage?: any;          // default: apple image
  letterKeys?: string[];    // default: ['A','P','P2','L','E']
}

export default function CelebrationOverlay({
  wordImage,
  letterKeys,
}: CelebrationOverlayProps = {}) {
  const { width: sw, height: sh } = useWindowDimensions();

  const resolvedWordImage = wordImage ?? GAME_IMAGES.apple;
  const resolvedLetterKeys = letterKeys ?? ['A', 'P', 'P2', 'L', 'E'];

  const appleScale = useSharedValue(0);
  const appleRotation = useSharedValue(0);

  // สูงสุด 5 ตัวอักษร (shared values สร้างเสมอ แต่ใช้แค่บางตัว)
  const ls0 = useSharedValue(0); const ls1 = useSharedValue(0);
  const ls2 = useSharedValue(0); const ls3 = useSharedValue(0);
  const ls4 = useSharedValue(0);
  const letterScales = [ls0, ls1, ls2, ls3, ls4];

  const ly0 = useSharedValue(30); const ly1 = useSharedValue(30);
  const ly2 = useSharedValue(30); const ly3 = useSharedValue(30);
  const ly4 = useSharedValue(30);
  const letterY = [ly0, ly1, ly2, ly3, ly4];

  const bgOpacity = useSharedValue(0);

  const appleSize = Math.min(sw * 0.28, sh * 0.45, 180);
  const letterSize = Math.min(sw * 0.09, sh * 0.15, 60);

  useEffect(() => {
    bgOpacity.value = withTiming(1, { duration: 200 });

    appleScale.value = withSpring(1, { damping: 12, stiffness: 300 });
    appleRotation.value = withSequence(
      withTiming(-10, { duration: 150 }),
      withTiming(10, { duration: 150 }),
      withTiming(0, { duration: 150 }),
    );

    resolvedLetterKeys.forEach((_, i) => {
      const delay = i * 100;
      letterScales[i].value = withDelay(delay, withSpring(1, { damping: 10, stiffness: 250 }));
      letterY[i].value = withDelay(delay, withSpring(0, { damping: 10, stiffness: 200 }));
    });
  }, []);

  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const appleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: appleScale.value },
      { rotate: `${appleRotation.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.overlay, bgStyle]}>
      {Array.from({ length: 35 }).map((_, i) => (
        <CelebBubble key={`b-${i}`} index={i} sw={sw} sh={sh} />
      ))}

      <Animated.View style={[styles.appleContainer, { marginTop: -sh * 0.05 }, appleStyle]}>
        <Image
          source={resolvedWordImage}
          style={{ width: appleSize, height: appleSize }}
          contentFit="contain"
        />
      </Animated.View>

      <Animated.View style={styles.wordRow}>
        {resolvedLetterKeys.map((key, i) => (
          <LetterAnimItem
            key={key}
            letterKey={key}
            scale={letterScales[i]}
            yVal={letterY[i]}
            size={letterSize}
          />
        ))}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 250,
  },
  appleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 6,
    alignItems: 'center',
  },
});

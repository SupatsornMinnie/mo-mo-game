import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { GAME_IMAGES } from '../../utils/gameConfig';

// Confetti ชิ้นเล็ก ๆ ลอยตกลงมา
function ConfettiPiece({ index, sw, sh }: { index: number; sw: number; sh: number }) {
  const x = useSharedValue(Math.random() * sw);
  const y = useSharedValue(-20 - Math.random() * sh * 0.5);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(Math.random() * 360);

  const colors = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#A8E6CF', '#FF8B94', '#DDA0DD', '#87CEEB', '#FFA07A'];
  const color = colors[index % colors.length];
  const size = 6 + Math.random() * 10;
  const isRect = index % 3 === 0;

  useEffect(() => {
    const delay = index * 40;
    const fallDur = 2500 + Math.random() * 1500;
    const swayAmount = (Math.random() - 0.5) * sw * 0.3;

    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));

    // ตกลงมา + เอียงซ้ายขวา
    y.value = withDelay(delay,
      withTiming(sh + 50, { duration: fallDur, easing: Easing.in(Easing.quad) })
    );
    x.value = withDelay(delay,
      withSequence(
        withTiming(x.value + swayAmount, { duration: fallDur * 0.5 }),
        withTiming(x.value - swayAmount * 0.5, { duration: fallDur * 0.5 }),
      )
    );
    rotation.value = withDelay(delay,
      withRepeat(withTiming(rotation.value + 360, { duration: 1500 }), -1)
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: isRect ? size * 1.5 : size,
          height: size,
          backgroundColor: color,
          borderRadius: isRect ? 2 : size / 2,
        },
        style,
      ]}
    />
  );
}

// Glitter ระยิบระยับ
function GlitterPiece({ index, sw, sh }: { index: number; sw: number; sh: number }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const x = Math.random() * sw;
  const y = Math.random() * sh;
  const size = 3 + Math.random() * 6;
  const colors = ['#FFD700', '#FFFFFF', '#FFF8DC', '#FFFACD'];
  const color = colors[index % colors.length];

  useEffect(() => {
    const delay = 200 + index * 80;
    opacity.value = withDelay(delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.2, { duration: 300 }),
        ),
        -1,
        true
      )
    );
    scale.value = withDelay(delay,
      withRepeat(
        withSequence(
          withSpring(1.5, { damping: 3 }),
          withSpring(0.8, { damping: 3 }),
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: size / 2,
        },
        style,
      ]}
    />
  );
}

export default function CelebrationOverlay() {
  const { width: sw, height: sh } = useWindowDimensions();

  // แอปเปิ้ล
  const appleScale = useSharedValue(0);
  const appleRotation = useSharedValue(0);

  // ตัวอักษร APPLE
  const letterScales = Array.from({ length: 5 }, () => useSharedValue(0));
  const letterY = Array.from({ length: 5 }, () => useSharedValue(30));

  // Overlay
  const bgOpacity = useSharedValue(0);

  const appleSize = Math.min(sw * 0.25, sh * 0.4, 160);
  const letterSize = Math.min(sw * 0.08, sh * 0.15, 55);
  const word = 'APPLE';

  useEffect(() => {
    bgOpacity.value = withTiming(1, { duration: 300 });

    // แอปเปิ้ลโผล่มาใหญ่ ๆ
    appleScale.value = withDelay(100,
      withSequence(
        withSpring(1.3, { damping: 4, stiffness: 150 }),
        withSpring(1, { damping: 6 }),
      )
    );
    appleRotation.value = withDelay(100,
      withSequence(
        withTiming(-10, { duration: 200 }),
        withTiming(10, { duration: 200 }),
        withTiming(0, { duration: 200 }),
      )
    );

    // ตัวอักษรทีละตัว pop in
    letterScales.forEach((s, i) => {
      s.value = withDelay(400 + i * 150,
        withSequence(
          withSpring(1.4, { damping: 4, stiffness: 200 }),
          withSpring(1, { damping: 6 }),
        )
      );
      letterY[i].value = withDelay(400 + i * 150,
        withSpring(0, { damping: 6, stiffness: 120 })
      );
    });
  }, []);

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const appleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: appleScale.value },
      { rotate: `${appleRotation.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.overlay, bgStyle]}>
      {/* Confetti ตกลงมาเยอะ ๆ */}
      {Array.from({ length: 50 }).map((_, i) => (
        <ConfettiPiece key={`c-${i}`} index={i} sw={sw} sh={sh} />
      ))}

      {/* Glitter ระยิบระยับ */}
      {Array.from({ length: 25 }).map((_, i) => (
        <GlitterPiece key={`g-${i}`} index={i} sw={sw} sh={sh} />
      ))}

      {/* แอปเปิ้ลใหญ่ ๆ ตรงกลาง */}
      <Animated.View style={[styles.appleContainer, { marginTop: -sh * 0.05 }, appleStyle]}>
        <Image
          source={GAME_IMAGES.apple}
          style={{ width: appleSize, height: appleSize }}
          contentFit="contain"
        />
      </Animated.View>

      {/* ตัวอักษร APPLE ใต้แอปเปิ้ล */}
      <Animated.View style={styles.wordRow}>
        {['A', 'P', 'P2', 'L', 'E'].map((key, i) => {
          const charStyle = useAnimatedStyle(() => ({
            transform: [
              { scale: letterScales[i].value },
              { translateY: letterY[i].value },
            ],
          }));

          return (
            <Animated.View key={i} style={charStyle}>
              <Image
                source={GAME_IMAGES.letters[key]}
                style={{ width: letterSize, height: letterSize }}
                contentFit="contain"
              />
            </Animated.View>
          );
        })}
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

import React, { useEffect, useRef } from 'react';
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
  runOnJS,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Audio } from 'expo-av';
import { GAME_IMAGES, LETTER_SOUNDS, SFX_SOUNDS, WORD_SOUND } from '../../utils/gameConfig';

// ─── สีฟอง (เหมือนหน้าแรก) ───────────────────────────
const BUBBLE_COLORS = [
  { bg: 'rgba(173,216,230,0.45)', border: 'rgba(173,216,230,0.7)' },
  { bg: 'rgba(255,182,193,0.40)', border: 'rgba(255,182,193,0.65)' },
  { bg: 'rgba(144,238,144,0.40)', border: 'rgba(144,238,144,0.65)' },
  { bg: 'rgba(221,160,221,0.40)', border: 'rgba(221,160,221,0.65)' },
  { bg: 'rgba(255,255,224,0.50)', border: 'rgba(255,255,200,0.7)' },
  { bg: 'rgba(255,255,255,0.45)', border: 'rgba(255,255,255,0.65)' },
];

// ─── Particle เหมือนหน้าแรก (เป็นลูกของฟอง) ──────────
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

// ─── Bubble ลอยจากตรงไหนก็ได้แล้วแตก ─────────────────
function CelebBubble({ index, sw, sh }: { index: number; sw: number; sh: number }) {
  const size = 18 + Math.random() * 55;
  const startX = Math.random() * (sw - size);
  // สุ่มตำแหน่ง Y เริ่มต้นทั่วจอ (ไม่ต้องลอยจาก bottom)
  const startY = Math.random() * sh;
  const colorIndex = index % BUBBLE_COLORS.length;
  const color = BUBBLE_COLORS[colorIndex];

  const y = useSharedValue(startY);
  const bubbleOpacity = useSharedValue(0);
  const scale = useSharedValue(1);

  const floatDist = sh * (0.3 + Math.random() * 0.5); // ลอยขึ้น 30-80% ของจอ
  const floatDuration = 1500 + Math.random() * 2500;
  const popAt = floatDuration * (0.5 + Math.random() * 0.4); // แตกสุ่มระหว่างทาง
  const totalCycle = floatDuration + 300;
  const delay = Math.random() * 1500;

  useEffect(() => {
    // ปรากฏ → ลอยขึ้น → แตก
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

// ─── Main ────────────────────────────────────────────────
export default function CelebrationOverlay() {
  const { width: sw, height: sh } = useWindowDimensions();

  const appleScale = useSharedValue(0);
  const appleRotation = useSharedValue(0);
  const letterScales = Array.from({ length: 5 }, () => useSharedValue(0));
  const letterY = Array.from({ length: 5 }, () => useSharedValue(30));
  const bgOpacity = useSharedValue(0);

  const appleSize = Math.min(sw * 0.28, sh * 0.45, 180);
  const letterSize = Math.min(sw * 0.09, sh * 0.15, 60);

  const soundsRef = useRef<Audio.Sound[]>([]);

  useEffect(() => {
    bgOpacity.value = withTiming(1, { duration: 300 });

    // แอปเปิ้ลโผล่
    appleScale.value = withDelay(100, withSequence(
      withSpring(1.3, { damping: 4, stiffness: 150 }),
      withSpring(1, { damping: 6 }),
    ));
    appleRotation.value = withDelay(100, withSequence(
      withTiming(-10, { duration: 200 }),
      withTiming(10, { duration: 200 }),
      withTiming(0, { duration: 200 }),
    ));

    // เสียง "apple" ก่อน → รอจบ → รอ 1 วิ → เล่น win
    const playAppleThenWin = async () => {
      try {
        // โหลดเสียง apple
        const { sound: appleSound } = await Audio.Sound.createAsync(WORD_SOUND);
        soundsRef.current.push(appleSound);

        // รอให้เสียง apple จบจริงๆ ผ่าน onPlaybackStatusUpdate
        await new Promise<void>((resolve) => {
          appleSound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              resolve();
            }
          });
          appleSound.playAsync();
        });

        // รอเพิ่ม 1 วินาทีหลัง apple จบ
        await new Promise((r) => setTimeout(r, 1000));

        // เล่น win
        const { sound: winSound } = await Audio.Sound.createAsync(SFX_SOUNDS.win);
        soundsRef.current.push(winSound);
        await winSound.playAsync();
      } catch (e) {}
    };
    setTimeout(playAppleThenWin, 300);

    // ตัวอักษร pop in ทีละตัว
    const letterChars = ['A', 'P', 'P', 'L', 'E'];
    letterScales.forEach((s, i) => {
      const delay = 500 + i * 150;
      s.value = withDelay(delay, withSequence(
        withSpring(1.4, { damping: 4, stiffness: 200 }),
        withSpring(1, { damping: 6 }),
      ));
      letterY[i].value = withDelay(delay, withSpring(0, { damping: 6, stiffness: 120 }));

      // เสียงอ่านตัวอักษรทีละตัว
      setTimeout(async () => {
        try {
          const src = LETTER_SOUNDS[letterChars[i]];
          if (src) {
            const { sound } = await Audio.Sound.createAsync(src);
            soundsRef.current.push(sound);
            await sound.playAsync();
          }
        } catch (e) {}
      }, delay);
    });

    return () => {
      soundsRef.current.forEach(s => s.unloadAsync().catch(() => {}));
    };
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
      {/* Bubble ลอยแตกเต็มจอเหมือนหน้าแรก — 45 ลูก */}
      {Array.from({ length: 45 }).map((_, i) => (
        <CelebBubble key={`b-${i}`} index={i} sw={sw} sh={sh} />
      ))}

      {/* แอปเปิ้ลใหญ่ตรงกลาง */}
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

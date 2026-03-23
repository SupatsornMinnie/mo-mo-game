import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Image,
  ImageBackground,
  ActivityIndicator,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Asset } from 'expo-asset';
import { Audio } from 'expo-av';

// ===== รูปภาพทั้งหมด (WebP — เล็กกว่า PNG 99%) =====
const BG_IMAGE = require('../assets/home/sea/sea.webp');

const CHARACTER_IMAGES = [
  require('../assets/character/1.webp'),
  require('../assets/character/2.webp'),
  require('../assets/character/3.webp'),
  require('../assets/character/4.webp'),
  require('../assets/character/5.webp'),
  require('../assets/character/6.webp'),
  require('../assets/character/7.webp'),
  require('../assets/character/8.webp'),
  require('../assets/character/9.webp'),
];

const TITLE_LETTERS = [
  { key: 'M1', image: require('../assets/alphabet/M.webp') },
  { key: 'o1', image: require('../assets/alphabet/O.webp') },
  { key: 'M2', image: require('../assets/alphabet/M.webp') },
  { key: 'o2', image: require('../assets/alphabet/O.webp') },
  { key: 'sp', image: null },
  { key: 'A1', image: require('../assets/alphabet/A.webp') },
  { key: 'l',  image: require('../assets/alphabet/L.webp') },
  { key: 'p',  image: require('../assets/alphabet/P.webp') },
  { key: 'h',  image: require('../assets/alphabet/H.webp') },
  { key: 'a2', image: require('../assets/alphabet/A.webp') },
  { key: 'b',  image: require('../assets/alphabet/B.webp') },
  { key: 'e',  image: require('../assets/alphabet/E.webp') },
  { key: 't',  image: require('../assets/alphabet/T.webp') },
];

const BGM_SOUND = require('../assets/sounds/Alphabet_Ocean_Adventure.mp3');

// ===== ตัวอักษรลอยขึ้นลง (ไม่มี scale) =====
function FloatingLetter({ source, index, size }: {
  source: any; index: number; size: number;
}) {
  const y = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(
      index * 80,
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 900 + index * 60, easing: Easing.inOut(Easing.sin) }),
          withTiming(4,  { duration: 900 + index * 60, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View style={[{ marginHorizontal: 1 }, style]}>
      <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />
    </Animated.View>
  );
}

// ===== ตัวละครกระเด้ง =====
function BouncingChar({ source, index, size, x, y: posY }: {
  source: any; index: number; size: number; x: number; y: number;
}) {
  const bounce = useSharedValue(0);
  const wiggle = useSharedValue(0);

  useEffect(() => {
    bounce.value = withDelay(
      index * 100,
      withRepeat(
        withSequence(
          withTiming(-(8 + (index % 3) * 4), {
            duration: 400 + (index % 4) * 80,
            easing: Easing.out(Easing.quad),
          }),
          withTiming(0, {
            duration: 400 + (index % 4) * 80,
            easing: Easing.bounce,
          })
        ),
        -1,
        false
      )
    );
    wiggle.value = withDelay(
      index * 120,
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 300 }),
          withTiming(4,  { duration: 300 }),
          withTiming(0,  { duration: 200 }),
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: bounce.value },
      { rotate: `${wiggle.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[{
      position: 'absolute',
      left: x,
      top: posY,
      width: size,
      height: size,
      zIndex: 10 + index,
    }, style]}>
      <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />
    </Animated.View>
  );
}

// ===== สีฟองสบู่ =====
const BUBBLE_COLORS = [
  { bg: 'rgba(173,216,230,0.45)', border: 'rgba(173,216,230,0.7)' },  // ฟ้าอ่อน
  { bg: 'rgba(255,182,193,0.40)', border: 'rgba(255,182,193,0.65)' }, // ชมพู
  { bg: 'rgba(144,238,144,0.40)', border: 'rgba(144,238,144,0.65)' }, // เขียวอ่อน
  { bg: 'rgba(221,160,221,0.40)', border: 'rgba(221,160,221,0.65)' }, // ม่วงอ่อน
  { bg: 'rgba(255,255,224,0.50)', border: 'rgba(255,255,200,0.7)' },  // เหลืองอ่อน
  { bg: 'rgba(255,255,255,0.45)', border: 'rgba(255,255,255,0.65)' }, // ขาว
];

// ===== เศษฟองแตก (particle) — เป็นลูกของฟอง =====
// ตอนนี้ particle เป็น child ของ bubble → ตำแหน่ง (0,0) = กลางฟอง
function BubbleParticle({ angle, color, popTime, totalCycle, bubbleSize }: {
  angle: number; color: string;
  popTime: number; totalCycle: number; bubbleSize: number;
}) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  // กระจายออกจากกลางฟอง
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

// ===== ฟองอากาศ + แตก + particle =====
function PoppingBubble({ x, size, delay, screenH, colorIndex, heightRatio }: {
  x: number; size: number; delay: number; screenH: number; colorIndex: number; heightRatio: number;
}) {
  const y = useSharedValue(0);
  const bubbleOpacity = useSharedValue(0);
  const scale = useSharedValue(1);
  const color = BUBBLE_COLORS[colorIndex % BUBBLE_COLORS.length];

  const floatDistance = screenH * heightRatio;
  const floatDuration = 2000 + (heightRatio * 3000);
  const popAt = floatDuration - 200;
  const totalCycle = floatDuration + 500;

  useEffect(() => {
    const startCycle = () => {
      y.value = 0;
      bubbleOpacity.value = 0;
      scale.value = 1;

      // ลอยขึ้น
      y.value = withDelay(delay,
        withTiming(-floatDistance, { duration: floatDuration, easing: Easing.out(Easing.quad) })
      );
      // ปรากฏ → ค้าง → แตก
      bubbleOpacity.value = withDelay(delay,
        withSequence(
          withTiming(0.6, { duration: 600 }),
          withTiming(0.55, { duration: popAt - 800 }),
          withTiming(0, { duration: 200 }),
        )
      );
      scale.value = withDelay(delay + popAt,
        withTiming(1.5, { duration: 200, easing: Easing.out(Easing.quad) })
      );

      setTimeout(startCycle, delay + totalCycle);
    };
    startCycle();
  }, []);

  // ชั้นนอก: จัดการแค่ตำแหน่ง (translateY) — ไม่มี opacity
  const positionStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));

  // ชั้นใน: ฟองมี opacity + scale ของตัวเอง
  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: bubbleOpacity.value,
  }));

  const angles = [0, 1.26, 2.51, 3.77, 5.03];

  return (
    // ชั้นนอก — ควบคุมตำแหน่งอย่างเดียว (ไม่มี opacity)
    <Animated.View style={[{
      position: 'absolute',
      left: `${x}%`,
      bottom: 0,
      width: size,
      height: size,
      zIndex: 1,
      overflow: 'visible',
    }, positionStyle]}>

      {/* ฟอง — มี opacity ของตัวเอง */}
      <Animated.View style={[{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color.bg,
        borderWidth: 1,
        borderColor: color.border,
      }, bubbleStyle]} />

      {/* particles — มี opacity แยกจากฟอง → เห็นตอนฟองหาย */}
      {angles.map((angle, pi) => (
        <BubbleParticle
          key={`p-${pi}`}
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

// ===== หน้าจอหลัก =====
export default function SplashScreen() {
  const [ready, setReady] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const hasNavigated = useRef(false);
  const router = useRouter();
  const { width: sw, height: sh } = useWindowDimensions();

  // ฟังก์ชัน navigate ไป home (กันเรียกซ้ำ)
  const goHome = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;
    soundRef.current?.stopAsync();
    soundRef.current?.unloadAsync();
    router.replace('/home');
  }, [router]);

  // Pre-load: แสดงพื้นหลังก่อน → โหลดตัวละครทีหลัง
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // โหลดพื้นหลังก่อน แสดงจอได้เลย
        await Asset.loadAsync([BG_IMAGE]);
        if (mounted) setReady(true);

        // แล้วค่อยโหลดตัวละคร + ตัวอักษร (background)
        await Asset.loadAsync([
          ...CHARACTER_IMAGES,
          ...TITLE_LETTERS.filter(l => l.image).map(l => l.image),
        ]);

        // เล่นเพลงพื้นหลัง
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
        const { sound } = await Audio.Sound.createAsync(
          BGM_SOUND,
          { isLooping: false, volume: 0.5 }
        );
        if (mounted) {
          soundRef.current = sound;
          // เมื่อเพลงจบ → ไป home
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              goHome();
            }
          });
          await sound.playAsync();
        } else {
          await sound.unloadAsync();
        }
      } catch (e) {
        console.warn('Init error:', e);
        if (mounted) setReady(true); // แสดงหน้าจอถึงแม้โหลดไม่ครบ
      }
    };

    init();
    return () => { mounted = false; soundRef.current?.unloadAsync(); };
  }, []);

  // คำนวณขนาดและตำแหน่ง (responsive)
  const letterSize = Math.min(sw / 14, 70);
  const charSize = Math.min(sh * 0.22, sw * 0.1, 120);
  const charSizes = [1.3, 1.2, 0.95, 0.95, 1.2, 0.80, 1.1, 0.85, 1.0];
  const positions = CHARACTER_IMAGES.map((_, i) => ({
    x: (sw * 0.04) + (i * (sw * 0.103)),
    y: sh * 0.63 + (i % 2 === 0 ? 0 : -sh * 0.05),
    size: charSize * charSizes[i],
  }));

  // หน้าจอ Loading
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#87CEEB', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <Pressable style={{ flex: 1 }} onPress={goHome}>
    <ImageBackground source={BG_IMAGE} style={{ flex: 1, backgroundColor: '#87CEEB' }} resizeMode="cover">

      {/* ===== TITLE: "MoMo Alphabet" ===== */}
      <View style={{
        position: 'absolute',
        top: sh * 0.32,
        width: '100%',
        alignItems: 'center',
        zIndex: 30,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          {TITLE_LETTERS.map((l, i) => {
            if (l.image === null) {
              return <View key={l.key} style={{ width: sw * 0.02 }} />;
            }
            return (
              <FloatingLetter key={l.key} source={l.image} index={i} size={letterSize} />
            );
          })}
        </View>
      </View>

      {/* ===== 9 CHARACTERS ===== */}
      {CHARACTER_IMAGES.map((src, i) => (
        <BouncingChar
          key={`c-${i}`}
          source={src}
          index={i}
          size={positions[i].size}
          x={positions[i].x}
          y={positions[i].y}
        />
      ))}

      {/* ===== BUBBLES (ลอยขึ้น + แตก + หลายสี + ความสูงสุ่ม) ===== */}
      {[
        { x: 5,  s: 10, d: 0,    h: 0.85 }, { x: 12, s: 14, d: 800,  h: 0.55 },
        { x: 20, s: 8,  d: 1600, h: 0.70 }, { x: 28, s: 12, d: 400,  h: 0.90 },
        { x: 35, s: 10, d: 2200, h: 0.45 }, { x: 42, s: 14, d: 1000, h: 0.75 },
        { x: 50, s: 8,  d: 1800, h: 0.60 }, { x: 58, s: 12, d: 600,  h: 0.80 },
        { x: 65, s: 10, d: 2400, h: 0.50 }, { x: 72, s: 14, d: 200,  h: 0.88 },
        { x: 80, s: 8,  d: 1400, h: 0.65 }, { x: 88, s: 12, d: 2000, h: 0.42 },
        { x: 95, s: 10, d: 1200, h: 0.78 }, { x: 15, s: 9,  d: 2600, h: 0.55 },
        { x: 55, s: 11, d: 3000, h: 0.70 }, { x: 75, s: 13, d: 3400, h: 0.48 },
      ].map((b, i) => (
        <PoppingBubble
          key={`b-${i}`}
          x={b.x}
          size={b.s}
          delay={b.d}
          screenH={sh}
          colorIndex={i}
          heightRatio={b.h}
        />
      ))}
    </ImageBackground>
    </Pressable>
  );
}

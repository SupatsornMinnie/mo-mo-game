import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Image,
  ImageBackground,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
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

// ===== รูปภาพทั้งหมด =====
const BG_IMAGE = require('../assets/home/sea/sea.png');

const CHARACTER_IMAGES = [
  require('../assets/character/1.png'),
  require('../assets/character/2.png'),
  require('../assets/character/3.png'),
  require('../assets/character/4.png'),
  require('../assets/character/5.png'),
  require('../assets/character/6.png'),
  require('../assets/character/7.png'),
  require('../assets/character/8.png'),
  require('../assets/character/9.png'),
];

const TITLE_LETTERS = [
  { key: 'M1', image: require('../assets/alphabet/M.png') },
  { key: 'o1', image: require('../assets/alphabet/O.png') },
  { key: 'M2', image: require('../assets/alphabet/M.png') },
  { key: 'o2', image: require('../assets/alphabet/O.png') },
  { key: 'sp', image: null },
  { key: 'A1', image: require('../assets/alphabet/A.png') },
  { key: 'l',  image: require('../assets/alphabet/L.png') },
  { key: 'p',  image: require('../assets/alphabet/P.png') },
  { key: 'h',  image: require('../assets/alphabet/H.png') },
  { key: 'a2', image: require('../assets/alphabet/A.png') },
  { key: 'b',  image: require('../assets/alphabet/B.png') },
  { key: 'e',  image: require('../assets/alphabet/E.png') },  // ← ถ้ายังดูเหมือน I บอกนะคะ จะเปลี่ยนไฟล์ภาพ
  { key: 't',  image: require('../assets/alphabet/T.png') },
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

// ===== ฟองอากาศ =====
function Bubble({ x, size, delay, screenH }: {
  x: number; size: number; delay: number; screenH: number;
}) {
  const y = useSharedValue(screenH);
  const opacity = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(delay,
      withRepeat(withTiming(-30, { duration: 4000 + delay, easing: Easing.out(Easing.quad) }), -1, false)
    );
    opacity.value = withDelay(delay,
      withRepeat(
        withSequence(
          withTiming(0.5, { duration: 800 }),
          withTiming(0.5, { duration: 2200 }),
          withTiming(0,   { duration: 1000 }),
        ), -1, false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{
      position: 'absolute',
      left: `${x}%`,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: 'rgba(255,255,255,0.45)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.65)',
      zIndex: 1,
    }, style]} />
  );
}

// ===== หน้าจอหลัก =====
export default function SplashScreen() {
  const [ready, setReady] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const { width: sw, height: sh } = useWindowDimensions();

  // Pre-load ภาพทั้งหมด + เล่นเพลง
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // โหลดภาพทั้งหมดก่อนแสดงผล
        const allImages = [
          BG_IMAGE,
          ...CHARACTER_IMAGES,
          ...TITLE_LETTERS.filter(l => l.image).map(l => l.image),
        ];
        await Asset.loadAsync(allImages);

        if (mounted) setReady(true);

        // เล่นเพลงพื้นหลัง
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
        const { sound } = await Audio.Sound.createAsync(
          BGM_SOUND,
          { isLooping: true, volume: 0.5 }
        );
        if (mounted) {
          soundRef.current = sound;
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
  const positions = CHARACTER_IMAGES.map((_, i) => ({
    x: (sw * 0.04) + (i * (sw * 0.103)),
    y: sh * 0.63 + (i % 2 === 0 ? 0 : -sh * 0.05),
    size: charSize + (i % 3 === 0 ? 6 : i % 3 === 1 ? -3 : 0),
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

      {/* ===== BUBBLES ===== */}
      {[12, 28, 45, 62, 78, 90, 35, 55].map((x, i) => (
        <Bubble key={`b-${i}`} x={x} size={8 + (i % 4) * 4} delay={i * 1200} screenH={sh} />
      ))}
    </ImageBackground>
  );
}

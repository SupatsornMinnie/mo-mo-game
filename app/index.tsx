import React, { useEffect } from 'react';
import {
  View,
  Image,
  ImageBackground,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { splashStyles as styles, SW, SH } from './styles/splash.styles';

// ===== 9 CHARACTERS (1.png - 9.png) =====
const CHARACTERS = [
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

// ===== ALPHABET IMAGES for "MoMo Alphabet" — single row =====
const ALL_TITLE_LETTERS = [
  { key: 'M1', image: require('../assets/alphabet/M.png') },
  { key: 'o1', image: require('../assets/alphabet/O.png') },
  { key: 'M2', image: require('../assets/alphabet/M.png') },
  { key: 'o2', image: require('../assets/alphabet/O.png') },
  { key: 'sp', image: null }, // space between words
  { key: 'A1', image: require('../assets/alphabet/A.png') },
  { key: 'l',  image: require('../assets/alphabet/L.png') },
  { key: 'p',  image: require('../assets/alphabet/P.png') },
  { key: 'h',  image: require('../assets/alphabet/H.png') },
  { key: 'a2', image: require('../assets/alphabet/A.png') },
  { key: 'b',  image: require('../assets/alphabet/B.png') },
  { key: 'e',  image: require('../assets/alphabet/E.png') },
  { key: 't',  image: require('../assets/alphabet/T.png') },
];

// ===== BOUNCING CHARACTER =====
function BouncingCharacter({
  source,
  index,
  size,
  posX,
  posY,
}: {
  source: any;
  index: number;
  size: number;
  posX: number;
  posY: number;
}) {
  const bounce = useSharedValue(0);
  const wiggle = useSharedValue(0);
  const pop = useSharedValue(0);

  useEffect(() => {
    pop.value = withDelay(
      200 + index * 120,
      withSpring(1, { damping: 5, stiffness: 110 })
    );
    bounce.value = withDelay(
      400 + index * 120,
      withRepeat(
        withSequence(
          withTiming(-(10 + (index % 3) * 6), {
            duration: 400 + (index % 4) * 100,
            easing: Easing.out(Easing.quad),
          }),
          withTiming(0, {
            duration: 400 + (index % 4) * 100,
            easing: Easing.bounce,
          })
        ),
        -1,
        false
      )
    );
    wiggle.value = withDelay(
      500 + index * 150,
      withRepeat(
        withSequence(
          withTiming(-6 - (index % 3) * 2, { duration: 250 + index * 30 }),
          withTiming(6 + (index % 3) * 2, { duration: 250 + index * 30 }),
          withTiming(0, { duration: 180 })
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
      { scale: pop.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: posX,
          top: posY,
          width: size,
          height: size,
          zIndex: 10 + index,
        },
        style,
      ]}
    >
      <Image
        source={source}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

// ===== BOUNCING TITLE LETTER =====
function TitleLetter({
  source,
  index,
  size,
  delay,
}: {
  source: any;
  index: number;
  size: number;
  delay: number;
}) {
  const pop = useSharedValue(0);
  const float = useSharedValue(0);

  useEffect(() => {
    pop.value = withDelay(
      delay,
      withSpring(1, { damping: 4, stiffness: 100 })
    );
    float.value = withDelay(
      delay + 300,
      withRepeat(
        withSequence(
          withTiming(-3 - (index % 3) * 2, {
            duration: 800 + index * 100,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(3 + (index % 3) * 2, {
            duration: 800 + index * 100,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }, { scale: pop.value }],
  }));

  return (
    <Animated.View style={[{ marginHorizontal: 2 }, style]}>
      <Image
        source={source}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

// ===== BUBBLES =====
function Bubble({ x, size, delay }: { x: number; size: number; delay: number }) {
  const y = useSharedValue(SH);
  const opacity = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(
      delay,
      withRepeat(
        withTiming(-30, { duration: 4000 + delay, easing: Easing.out(Easing.quad) }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.5, { duration: 800 }),
          withTiming(0.5, { duration: 2200 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: `${x}%`,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: 'rgba(255,255,255,0.45)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.65)',
          zIndex: 1,
        },
        style,
      ]}
    />
  );
}

// ===== SPLASH SCREEN =====
export default function SplashScreen() {
  const charSize = Math.min(SH * 0.28, SW * 0.1);
  const positions = CHARACTERS.map((_, i) => ({
    x: (SW * 0.04) + (i * (SW * 0.103)),
    y: SH * 0.63 + (i % 2 === 0 ? 0 : -SH * 0.06),
    size: charSize + (i % 3 === 0 ? 8 : i % 3 === 1 ? -4 : 0),
  }));

  return (
    <ImageBackground
      source={require('../assets/home/sea/sea.png')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* ===== TITLE: "MoMo Alphabet" single row ===== */}
      <View style={styles.titleArea}>
        <View style={styles.titleRow}>
          {ALL_TITLE_LETTERS.map((l, i) => {
            if (l.image === null) {
              return <View key={l.key} style={{ width: 12 }} />;
            }
            return (
              <TitleLetter
                key={l.key}
                source={l.image}
                index={i}
                size={Math.min(SW / 15, SH * 0.15, 55)}
                delay={100 + i * 90}
              />
            );
          })}
        </View>
      </View>

      {/* ===== 9 CHARACTERS ===== */}
      {CHARACTERS.map((src, i) => (
        <BouncingCharacter
          key={`char-${i}`}
          source={src}
          index={i}
          size={positions[i].size}
          posX={positions[i].x}
          posY={positions[i].y}
        />
      ))}

      {/* ===== BUBBLES ===== */}
      {[12, 28, 45, 62, 78, 90, 35, 55].map((x, i) => (
        <Bubble
          key={`b-${i}`}
          x={x}
          size={8 + (i % 4) * 4}
          delay={i * 1200}
        />
      ))}
    </ImageBackground>
  );
}

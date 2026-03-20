import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  ImageBackground,
  Text,
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
  BounceIn,
} from 'react-native-reanimated';

const { width: SW, height: SH } = Dimensions.get('window');

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
    // Pop entrance
    pop.value = withDelay(
      200 + index * 120,
      withSpring(1, { damping: 5, stiffness: 110 })
    );

    // Bounce up and down
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

    // Wiggle rotation
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
    // Pop-in
    pop.value = withDelay(
      delay,
      withSpring(1, { damping: 4, stiffness: 100 })
    );

    // Gentle float
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

// ===== PLAY BUTTON =====
function PlayButton() {
  const pulse = useSharedValue(1);
  const glow = useSharedValue(0.3);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1000 }),
        withTiming(0.25, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <Animated.View
      entering={BounceIn.delay(1500).duration(700)}
      style={styles.playWrap}
    >
      <Animated.View style={[styles.playGlow, glowStyle]} />
      <Animated.View style={pulseStyle}>
        <TouchableOpacity
          style={styles.playBtn}
          activeOpacity={0.8}
          onPress={() => console.log('Play!')}
        >
          <View style={styles.playTriangleWrap}>
            <View style={styles.playTriangle} />
          </View>
          <Text style={styles.playText}>PLAY</Text>
        </TouchableOpacity>
      </Animated.View>
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

// ===== MAIN SCREEN =====
export default function HomeScreen() {
  // 9 characters positioned in landscape: bottom area, spread left to right
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

      {/* ===== PLAY BUTTON ===== */}
      <PlayButton />

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

// ===== STYLES =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },

  // Title area - top center
  titleArea: {
    position: 'absolute',
    top: SH * 0.03,
    width: '100%',
    alignItems: 'center',
    zIndex: 30,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
  },

  // Play button - center of screen
  playWrap: {
    position: 'absolute',
    top: SH * 0.28,
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 25,
  },
  playGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFD700',
    top: -10,
  },
  playBtn: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF6B9D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  playTriangleWrap: {
    marginLeft: 5,
    marginBottom: 2,
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 24,
    borderTopWidth: 16,
    borderBottomWidth: 16,
    borderLeftColor: '#FFF',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  playText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 2,
  },
});

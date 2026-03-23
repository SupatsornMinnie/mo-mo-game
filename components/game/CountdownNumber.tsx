import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

interface CountdownNumberProps {
  number: number;
  sw: number;
  sh: number;
}

export default function CountdownNumber({ number, sw, sh }: CountdownNumberProps) {
  const scale = useSharedValue(3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Scale in from big → normal, then fade out
    scale.value = withSequence(
      withSpring(1, { damping: 8, stiffness: 150 }),
      withTiming(0.8, { duration: 600 })
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(1, { duration: 500 }),
      withTiming(0, { duration: 250 })
    );
  }, [number]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, { width: sw, height: sh }, animStyle]}>
      <Animated.Text style={styles.number}>{number}</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    pointerEvents: 'none',
  },
  number: {
    fontSize: 120,
    fontWeight: '900',
    color: 'rgba(255, 68, 68, 0.7)',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});

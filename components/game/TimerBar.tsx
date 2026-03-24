import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';

interface TimerBarProps {
  progress: number; // 1.0 (full) → 0.0 (empty)
  timeRemaining: number;
  isShaking: boolean;
}

export default function TimerBar({ progress, timeRemaining, isShaking }: TimerBarProps) {
  const shake = useSharedValue(0);
  const isRed = progress <= 0.25;

  // สั่นเฉพาะตอนสีแดง
  useEffect(() => {
    if (isShaking && isRed) {
      shake.value = withRepeat(
        withSequence(
          withTiming(4, { duration: 80 }),
          withTiming(-4, { duration: 80 }),
          withTiming(0, { duration: 80 })
        ),
        -1
      );
    } else {
      shake.value = withTiming(0);
    }
  }, [isShaking, isRed]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  // Color: green → yellow → red
  const getBarColor = () => {
    if (progress > 0.5) return '#44BB44';
    if (progress > 0.25) return '#FFD700';
    return '#FF4444';
  };

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.max(0, progress * 100)}%`,
              backgroundColor: getBarColor(),
            },
          ]}
        />
      </View>
      <Text style={[styles.timeText, progress <= 0.25 && styles.timeTextDanger]}>
        {Math.ceil(timeRemaining)}s
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    left: 80,
    right: 80,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 50,
  },
  track: {
    flex: 1,
    height: 14,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 7,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 7,
  },
  timeText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '800',
    color: '#2C3E50',
    minWidth: 35,
  },
  timeTextDanger: {
    color: '#FF4444',
  },
});

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import HeartDisplay from './HeartDisplay';

interface TimerBarProps {
  progress: number; // 1.0 (full) → 0.0 (empty)
  timeRemaining: number;
  isShaking: boolean;
  hearts: number;
  maxHearts: number;
}

export default function TimerBar({ progress, timeRemaining, isShaking, hearts, maxHearts }: TimerBarProps) {
  const shake = useSharedValue(0);
  const isRed = progress <= 0.25;

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
      <HeartDisplay hearts={hearts} maxHearts={maxHearts} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 12,
    left: 80,
    right: 15,
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

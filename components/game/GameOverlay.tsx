import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';

interface GameOverlayProps {
  type: 'victory' | 'timeup';
  onRetry: () => void;
  onHome: () => void;
}

// Confetti particle
function ConfettiPiece({ index, sw, sh }: { index: number; sw: number; sh: number }) {
  const x = useSharedValue(sw * 0.5);
  const y = useSharedValue(sh * 0.3);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#FF8B94', '#DDA0DD'];
  const color = colors[index % colors.length];
  const size = 8 + Math.random() * 8;

  useEffect(() => {
    const targetX = Math.random() * sw;
    const targetY = Math.random() * sh;

    opacity.value = withDelay(index * 50, withTiming(1, { duration: 200 }));
    x.value = withDelay(index * 50, withSpring(targetX, { damping: 6, stiffness: 40 }));
    y.value = withDelay(index * 50, withSpring(targetY, { damping: 6, stiffness: 40 }));
    rotation.value = withDelay(
      index * 50,
      withRepeat(withTiming(360, { duration: 2000 }), -1)
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

export default function GameOverlay({ type, onRetry, onHome }: GameOverlayProps) {
  const overlayOpacity = useSharedValue(0);
  const contentScale = useSharedValue(0.5);
  const sw = 800; // will be overridden by parent
  const sh = 400;

  useEffect(() => {
    overlayOpacity.value = withTiming(1, { duration: 400 });
    contentScale.value = withDelay(200, withSpring(1, { damping: 8, stiffness: 200 }));
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
  }));

  const isVictory = type === 'victory';

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      {/* Confetti for victory */}
      {isVictory &&
        Array.from({ length: 30 }).map((_, i) => (
          <ConfettiPiece key={i} index={i} sw={sw} sh={sh} />
        ))}

      <Animated.View style={[styles.card, contentStyle]}>
        <Text style={styles.emoji}>{isVictory ? '🎉' : '⏰'}</Text>
        <Text style={[styles.title, { color: isVictory ? '#44BB44' : '#FF4444' }]}>
          {isVictory ? 'GREAT JOB!' : "TIME'S UP!"}
        </Text>
        <Text style={styles.subtitle}>
          {isVictory ? 'You spelled APPLE!' : 'Try again!'}
        </Text>

        <View style={styles.buttonRow}>
          <Pressable style={[styles.btn, styles.retryBtn]} onPress={onRetry}>
            <Text style={styles.btnText}>🔄 Retry</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.homeBtn]} onPress={onHome}>
            <Text style={styles.btnText}>🏠 Home</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    minWidth: 280,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emoji: {
    fontSize: 50,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    minWidth: 100,
    alignItems: 'center',
  },
  retryBtn: {
    backgroundColor: '#4A90D9',
  },
  homeBtn: {
    backgroundColor: '#95A5A6',
  },
  btnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});

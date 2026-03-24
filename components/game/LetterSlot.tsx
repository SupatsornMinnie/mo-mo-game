import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LETTER_IMAGES } from '../../utils/gameConfig';

interface LetterSlotProps {
  char: string;
  x: number;
  y: number;
  size: number;
  isFilled: boolean;
  isHighlighted: boolean; // hint highlight
}

export default function LetterSlot({ char, x, y, size, isFilled, isHighlighted }: LetterSlotProps) {
  const pulse = useSharedValue(1);

  React.useEffect(() => {
    if (isHighlighted) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1,
        true
      );
    } else {
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [isHighlighted]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.slot,
        {
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size * 0.15,
          // ถ้าเติมแล้ว ไม่มีกรอบ ไม่มีพื้นหลัง → ตัวอักษรเนียนเข้าไป
          borderColor: isFilled ? 'transparent' : isHighlighted ? '#FFD700' : 'rgba(255,255,255,0.4)',
          borderWidth: isFilled ? 0 : isHighlighted ? 3 : 2,
          backgroundColor: isFilled ? 'transparent' : 'rgba(255,255,255,0.15)',
        },
        animStyle,
      ]}
    >
      <Image
        source={LETTER_IMAGES[char]}
        style={{ width: size * 0.8, height: size * 0.8 }}
        contentFit="contain"
        // ถ้ายังไม่เติม → เงาจาง, ถ้าเติมแล้ว → แสดงตัวอักษรจริงเต็ม
        tintColor={isFilled ? undefined : 'rgba(255,255,255,0.5)'}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
});

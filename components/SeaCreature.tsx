import React from 'react';
import { Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

interface SeaCreatureProps {
  source: any;
  initialX: number;
  initialY: number;
  size: number;
  index: number;
  floatAmount?: number;    // ลอยขึ้นลงเท่าไหร่ (px)
  floatDuration?: number;  // ความเร็วลอย (ms)
}

export default function SeaCreature({
  source,
  initialX,
  initialY,
  size,
  index,
  floatAmount = 8,
  floatDuration = 2000,
}: SeaCreatureProps) {
  // ตำแหน่ง drag
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);
  const dragScale = useSharedValue(1);

  // ลอยขึ้นลง
  const floatY = useSharedValue(0);
  const wobble = useSharedValue(0);

  React.useEffect(() => {
    floatY.value = withDelay(
      index * 300,
      withRepeat(
        withSequence(
          withTiming(-floatAmount, {
            duration: floatDuration + index * 200,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(floatAmount, {
            duration: floatDuration + index * 200,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        true,
      ),
    );
    wobble.value = withDelay(
      index * 200,
      withRepeat(
        withSequence(
          withTiming(-3, { duration: 1500 }),
          withTiming(3, { duration: 1500 }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  // Gesture: ลากวาง
  const panGesture = Gesture.Pan()
    .onStart(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
      dragScale.value = withTiming(1.15, { duration: 150 });
    })
    .onUpdate((event) => {
      translateX.value = savedX.value + event.translationX;
      translateY.value = savedY.value + event.translationY;
    })
    .onEnd(() => {
      dragScale.value = withTiming(1, { duration: 200 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value + floatY.value },
      { rotate: `${wobble.value}deg` },
      { scale: dragScale.value },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: initialX,
            top: initialY,
            width: size,
            height: size,
            zIndex: 1,
          },
          animatedStyle,
        ]}
      >
        <Image
          source={source}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
}

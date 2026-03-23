import React, { useEffect, useRef, useCallback } from 'react';
import { Image, Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

interface VocabBubbleProps {
  source: any;
  screenW: number;
  screenH: number;
  index: number;
  isVocab: boolean;
  isLocked: boolean;
  onPop?: () => void;
  onPlaySound?: (type: 'break' | 'lock') => void;
  minSize: number;
  maxSize: number;
  bubbleRef?: React.MutableRefObject<BubbleInfo | null>;
}

export interface BubbleInfo {
  x: number;
  y: number;
  size: number;
  alive: boolean;
  isVocab: boolean;
  pop: () => void;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// === Particle เศษฟอง ===
function PopParticle({ angle, size, color }: { angle: number; size: number; color: string }) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);

  const spread = size * 1.2;
  const dx = Math.cos(angle) * spread;
  const dy = Math.sin(angle) * spread;

  useEffect(() => {
    progress.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) });
    opacity.value = withSequence(
      withTiming(0.9, { duration: 80 }),
      withTiming(0, { duration: 270 }),
    );
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
      left: size / 2 - 3,
      top: size / 2 - 3,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: color,
    }, style]} />
  );
}

const PARTICLE_COLORS = [
  'rgba(173,216,230,0.8)',
  'rgba(255,182,193,0.7)',
  'rgba(144,238,144,0.7)',
  'rgba(221,160,221,0.7)',
  'rgba(255,255,224,0.8)',
  'rgba(255,255,255,0.7)',
];

export default function VocabBubble({
  source,
  screenW,
  screenH,
  index,
  isVocab,
  isLocked,
  onPop,
  onPlaySound,
  minSize,
  maxSize,
  bubbleRef,
}: VocabBubbleProps) {
  const [showParticles, setShowParticles] = React.useState(false);
  const [particleSize, setParticleSize] = React.useState(0);
  const aliveRef = useRef(true);
  const sizeRef = useRef(rand(minSize, maxSize));
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const translateY = useSharedValue(screenH + 150);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);
  const posX = useSharedValue(rand(screenW * 0.02, screenW * 0.82));

  // อัพเดท ref สำหรับ collision detection
  const updateRef = useCallback((currentY: number) => {
    if (bubbleRef) {
      bubbleRef.current = {
        x: posX.value,
        y: currentY,
        size: sizeRef.current,
        alive: aliveRef.current,
        isVocab,
        pop: () => doPop(),
      };
    }
  }, []);

  const doPop = useCallback(() => {
    if (!aliveRef.current) return;
    aliveRef.current = false;
    setParticleSize(sizeRef.current);
    setShowParticles(true);
    onPlaySound?.('break');
    scale.value = withTiming(1.4, { duration: 120 });
    opacity.value = withTiming(0, { duration: 120 });
    setTimeout(() => {
      setShowParticles(false);
      // ลอยมาใหม่
      setTimeout(() => startFloat(rand(1000, 3000)), 500);
    }, 400);
  }, []);

  const isFirstFloat = useRef(true);

  const startFloat = useCallback((delay: number = 0) => {
    const newSize = rand(minSize, maxSize);
    const newX = rand(screenW * 0.02, screenW * 0.82);
    const dur = rand(8000, 14000);
    const sway = rand(20, 50);
    const swayDir = Math.random() > 0.5 ? 1 : -1;

    sizeRef.current = newSize;
    aliveRef.current = true;
    posX.value = newX;
    translateX.value = 0;
    scale.value = 1;
    rotation.value = 0;

    const maxOpacity = isVocab ? 0.95 : 0.80;
    const midOpacity = isVocab ? 0.9 : 0.75;

    if (isFirstFloat.current) {
      isFirstFloat.current = false;
      delay = 0;

      // สุ่ม "ช่วงเวลา" ของ lifecycle — แต่ละตัวอยู่คนละช่วง
      // progress 0 = เพิ่งเริ่ม (ข้างล่าง), 1 = กำลังจะหาย (ข้างบน)
      const progress = rand(0.05, 0.90);
      const totalTravel = screenH + 150 + newSize * 2;
      const startY = screenH + 150 - (progress * totalTravel);
      const remainDur = dur * (1 - progress);

      translateY.value = startY;
      opacity.value = maxOpacity;

      // ลอยต่อจากตำแหน่งปัจจุบัน
      translateY.value = withTiming(-newSize * 2, {
        duration: Math.max(remainDur, 2000),
        easing: Easing.linear,
      });

      // sway + rotation ตามเวลาที่เหลือ
      const swayDur = Math.max(remainDur, 2000) / 4;
      translateX.value = withSequence(
        withTiming(sway * swayDir, { duration: swayDur, easing: Easing.inOut(Easing.sin) }),
        withTiming(-sway * swayDir * 0.6, { duration: swayDur, easing: Easing.inOut(Easing.sin) }),
        withTiming(sway * swayDir * 0.4, { duration: swayDur, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: swayDur, easing: Easing.inOut(Easing.sin) }),
      );
      rotation.value = withSequence(
        withTiming(rand(-5, 5), { duration: remainDur * 0.5 }),
        withTiming(rand(-2, 2), { duration: remainDur * 0.5 }),
      );
      // opacity: ค้าง แล้วจาง
      opacity.value = withSequence(
        withTiming(midOpacity, { duration: Math.max(remainDur - 800, 500) }),
        withTiming(0, { duration: 800 }),
      );

      // วนใหม่เมื่อหมดเวลา
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        aliveRef.current = false;
        startFloat(rand(300, 1500));
      }, Math.max(remainDur, 2000) + 200);

    } else {
      // รอบถัดไป: ลอยจากข้างล่าง
      translateY.value = screenH + 150;
      opacity.value = 0;
      translateY.value = withDelay(delay,
        withTiming(-newSize * 2, {
          duration: dur,
          easing: Easing.linear,
        })
      );

      const swayDur = dur / 6;
      const swayAnim = withSequence(
        withTiming(sway * swayDir, { duration: swayDur, easing: Easing.inOut(Easing.sin) }),
        withTiming(-sway * swayDir * 0.6, { duration: swayDur, easing: Easing.inOut(Easing.sin) }),
        withTiming(sway * swayDir * 0.8, { duration: swayDur, easing: Easing.inOut(Easing.sin) }),
        withTiming(-sway * swayDir * 0.4, { duration: swayDur, easing: Easing.inOut(Easing.sin) }),
        withTiming(sway * swayDir * 0.3, { duration: swayDur, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: swayDur, easing: Easing.inOut(Easing.sin) }),
      );
      translateX.value = delay > 0 ? withDelay(delay, swayAnim) : swayAnim;

      const rotAnim = withSequence(
        withTiming(rand(-6, 6), { duration: dur * 0.3 }),
        withTiming(rand(-4, 4), { duration: dur * 0.3 }),
        withTiming(rand(-2, 2), { duration: dur * 0.4 }),
      );
      rotation.value = delay > 0 ? withDelay(delay, rotAnim) : rotAnim;

      opacity.value = withDelay(delay,
        withSequence(
          withTiming(maxOpacity, { duration: 800 }),
          withTiming(midOpacity, { duration: dur - 1600 }),
          withTiming(0, { duration: 800 }),
        )
      );

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        aliveRef.current = false;
        startFloat(rand(300, 1500));
      }, delay + dur + 200);
    }
  }, [screenW, screenH, minSize, maxSize]);

  useEffect(() => {
    startFloat(0); // ไม่มี delay ครั้งแรก — ลอยทันที
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      cancelAnimation(translateY);
      cancelAnimation(translateX);
      cancelAnimation(opacity);
    };
  }, []);

  const handlePress = () => {
    if (isVocab && !isLocked) {
      doPop();
      setTimeout(() => onPop?.(), 200);
    } else if (isLocked) {
      onPlaySound?.('lock');
      scale.value = withSequence(
        withTiming(1.12, { duration: 80 }),
        withTiming(0.92, { duration: 70 }),
        withTiming(1.06, { duration: 70 }),
        withTiming(1, { duration: 80 }),
      );
    } else {
      doPop();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    left: posX.value,
    top: 0,
    width: sizeRef.current,
    height: sizeRef.current,
    zIndex: isVocab ? 40 : 5,
  }));

  const particleAngles = [0, 1.05, 2.09, 3.14, 4.19, 5.24];

  return (
    <Animated.View style={containerStyle}>
      <Animated.View style={[{ width: '100%', height: '100%' }, animatedStyle]}>
        <Pressable onPress={handlePress} style={{ width: '100%', height: '100%' }}>
          <Image
            source={source}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
          {isLocked && (
            <View style={{
              position: 'absolute',
              bottom: '12%',
              alignSelf: 'center',
              backgroundColor: 'rgba(0,0,0,0.35)',
              borderRadius: 10,
              paddingHorizontal: 5,
              paddingVertical: 2,
            }}>
              <Animated.Text style={{ color: '#FFF', fontSize: 12 }}>🔒</Animated.Text>
            </View>
          )}
        </Pressable>

        {/* Particles เมื่อแตก */}
        {showParticles && particleAngles.map((angle, pi) => (
          <PopParticle
            key={`p-${pi}-${Date.now()}`}
            angle={angle}
            size={particleSize}
            color={PARTICLE_COLORS[pi % PARTICLE_COLORS.length]}
          />
        ))}
      </Animated.View>
    </Animated.View>
  );
}

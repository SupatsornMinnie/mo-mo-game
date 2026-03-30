import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { ANT_IMAGES } from "../../utils/antConfig";

interface AntCharacterProps {
  sw: number;
  sh: number;
  initialX?: number;
  initialY?: number;
  sugarTargetX: number;
  sugarTargetY: number;
  sugarSize: number;
  onReturnSugar: () => void;
  isActive: boolean;
}

const ANT_COUNT = 5;
const ANT_SPACING = 0.09; // ระยะห่างระหว่างมดแต่ละตัว (% ของ sw)

export default function AntCharacter({
  sw,
  sh,
  initialX,
  initialY,
  sugarTargetX,
  sugarTargetY,
  sugarSize,
  onReturnSugar,
  isActive,
}: AntCharacterProps) {
  const antWidth = sugarSize * 0.45;
  const antHeight = antWidth * 0.7;
  const sugarPieceSize = sugarSize; // เท่ากับ sugar_break1 ที่แสดงด้านบน (pieceDisplaySize)

  // แถวมดเริ่มจากตำแหน่งที่ส่งมาจาก SugarRoll
  const rowY = initialY ?? sh * 0.65;

  // ---- ขบวนมดเดิน (shared value สำหรับ offset ทั้งแถว) ----
  const marchOffset = useSharedValue(0);
  const totalWidth = ANT_COUNT * sw * ANT_SPACING + antWidth;

  useEffect(() => {
    // เดินจากขวาไปซ้าย วนลูปไม่มีจบ
    marchOffset.value = 0;
    marchOffset.value = withRepeat(
      withTiming(-totalWidth, { duration: 12000 }),
      -1,
      false,
    );
  }, [totalWidth]);

  // ---- sugar piece บนหัวมดตัวที่ 1 (ลากได้) ----
  const sugarTransX = useSharedValue(0);
  const sugarTransY = useSharedValue(0);
  const ctxX = useSharedValue(0);
  const ctxY = useSharedValue(0);
  const sugarScale = useSharedValue(1);
  const sugarOpacity = useSharedValue(1);
  const isDragging = useSharedValue(false);

  useEffect(() => {
    sugarTransX.value = 0;
    sugarTransY.value = 0;
  }, [initialX, initialY]);

  const handleReturnSugar = () => {
    onReturnSugar();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const checkSugarSnap = () => {
    // คำนวณตำแหน่งจริงของ sugar piece
    const baseX = (initialX ?? sw * 0.5) + sugarTransX.value;
    const baseY = rowY - sugarPieceSize * 0.6 + sugarTransY.value;
    const cx = baseX + sugarPieceSize / 2;
    const cy = baseY + sugarPieceSize / 2;
    const dx = cx - sugarTargetX;
    const dy = cy - sugarTargetY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < sugarSize * 0.6) {
      const snapX = sugarTargetX - sugarPieceSize / 2 - (initialX ?? sw * 0.5);
      const snapY = sugarTargetY - sugarPieceSize / 2 - (rowY - sugarPieceSize * 0.6);
      sugarTransX.value = withTiming(snapX, { duration: 200 });
      sugarTransY.value = withTiming(snapY, { duration: 200 });
      sugarScale.value = withTiming(0, { duration: 300 });
      sugarOpacity.value = withTiming(0, { duration: 300 });
      runOnJS(handleReturnSugar)();
    } else {
      sugarScale.value = withSpring(1);
    }
  };

  const panGesture = Gesture.Pan()
    .enabled(isActive)
    .onStart(() => {
      ctxX.value = sugarTransX.value;
      ctxY.value = sugarTransY.value;
      isDragging.value = true;
      sugarScale.value = withSpring(1.15);
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((e) => {
      sugarTransX.value = ctxX.value + e.translationX;
      sugarTransY.value = ctxY.value + e.translationY;
    })
    .onEnd(() => {
      isDragging.value = false;
      runOnJS(checkSugarSnap)();
    });

  const sugarAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: sugarTransX.value },
      { translateY: sugarTransY.value },
      { scale: sugarScale.value },
    ],
    opacity: sugarOpacity.value,
    zIndex: isDragging.value ? 100 : 35,
  }));

  // sugar piece ตำแหน่งเริ่ม — อยู่บนหัวมดตัวแรก
  const sugarStartX = (initialX ?? sw * 0.5) - sugarPieceSize / 2 + antWidth / 2;
  const sugarStartY = rowY - sugarPieceSize * 0.6;

  return (
    <>
      {/* ขบวนมด 5 ตัว เดินต่อแถว */}
      {Array.from({ length: ANT_COUNT }).map((_, i) => {
        const antAnimStyle = useAnimatedStyle(() => {
          // เริ่มจากขวาสุดของจอ แล้วเดินไปซ้าย
          const baseX = sw + i * sw * ANT_SPACING;
          let x = baseX + marchOffset.value;
          // วนจอ — หลุดซ้ายให้โผล่ขวา
          const wrapWidth = sw + totalWidth;
          x = ((x % wrapWidth) + wrapWidth) % wrapWidth - antWidth;
          return {
            transform: [{ translateX: x }],
          };
        });

        return (
          <Animated.View
            key={`ant-${i}`}
            style={[
              { position: "absolute", top: rowY, zIndex: 28 },
              antAnimStyle,
            ]}
          >
            <Image
              source={ANT_IMAGES.ant}
              style={{ width: antWidth, height: antHeight }}
              contentFit="contain"
            />
          </Animated.View>
        );
      })}

      {/* sugar_break2 บนหัวมดตัวที่ 1 — ลากได้ */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            { position: "absolute", left: sugarStartX, top: sugarStartY },
            sugarAnimStyle,
          ]}
        >
          <Image
            source={ANT_IMAGES.sugarBreak2}
            style={{ width: sugarPieceSize, height: sugarPieceSize }}
            contentFit="contain"
          />
        </Animated.View>
      </GestureDetector>
    </>
  );
}

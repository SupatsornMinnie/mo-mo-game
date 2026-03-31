import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { useEffect } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  type SharedValue,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
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

const ANT_COUNT = 10;
const ANT_SPACING = 0.1; // ** ระยะห่างระหว่างมดแต่ละตัว (% ของหน้าจอ)
const CYCLE_DURATION = 5000; // ** ความเร็วมด: ลด = เร็ว, เพิ่ม = ช้า (ms/รอบ)

// ─── มดลากได้แต่ละตัว — แต่ละตัวมี offset อิสระ loop เอง ───
function DraggableMarchingAnt({
  sw,
  antWidth,
  antHeight,
  rowY,
  marchOffset,
  hasSugar,
  sugarPieceSize,
  sugarTargetX,
  sugarTargetY,
  sugarSize,
  onSnapSugar,
  isActive,
}: {
  sw: number;
  antWidth: number;
  antHeight: number;
  rowY: number;
  marchOffset: SharedValue<number>;
  hasSugar: boolean;
  sugarPieceSize: number;
  sugarTargetX: number;
  sugarTargetY: number;
  sugarSize: number;
  onSnapSugar: () => void;
  isActive: boolean;
}) {
  const transX = useSharedValue(0);
  const transY = useSharedValue(0);
  const ctxX = useSharedValue(0);
  const ctxY = useSharedValue(0);
  const antScale = useSharedValue(1);
  const isDragging = useSharedValue(false);
  const sugarVisible = useSharedValue(1);

  // แต่ละมดวน loop อิสระ: หลุดซ้ายปั๊บ → โผล่ขวาทันที
  const getMarchX = (offset: number) => {
    "worklet";
    const range = sw + antWidth;
    let x = sw + offset;
    x = ((x % range) + range) % range;
    return x;
  };

  const handleSnap = () => {
    onSnapSugar();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const checkRelease = () => {
    if (hasSugar && sugarVisible.value > 0.5) {
      const marchX = getMarchX(marchOffset.value);
      const cx = marchX + transX.value + antWidth / 2;
      const cy = rowY - sugarPieceSize * 0.1 + transY.value;
      const dx = cx - sugarTargetX;
      const dy = cy - sugarTargetY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < sugarSize * 0.6) {
        sugarVisible.value = withTiming(0, { duration: 300 });
        transX.value = withSpring(0);
        transY.value = withSpring(0);
        antScale.value = withSpring(1);
        runOnJS(handleSnap)();
        return;
      }
    }
    transX.value = withSpring(0);
    transY.value = withSpring(0);
    antScale.value = withSpring(1);
  };

  const panGesture = Gesture.Pan()
    .enabled(isActive)
    .onStart(() => {
      ctxX.value = transX.value;
      ctxY.value = transY.value;
      isDragging.value = true;
      antScale.value = withSpring(1.15);
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((e) => {
      transX.value = ctxX.value + e.translationX;
      transY.value = ctxY.value + e.translationY;
    })
    .onEnd(() => {
      isDragging.value = false;
      runOnJS(checkRelease)();
    });

  const antAnimStyle = useAnimatedStyle(() => {
    const marchX = getMarchX(marchOffset.value);
    return {
      transform: [
        { translateX: marchX + transX.value },
        { translateY: transY.value },
        { scale: antScale.value },
      ],
      zIndex: isDragging.value ? 100 : 28,
    };
  });

  const sugarStyle = useAnimatedStyle(() => ({
    opacity: sugarVisible.value,
    transform: [{ scale: sugarVisible.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[{ position: "absolute", top: rowY, left: 0 }, antAnimStyle]}
      >
        {hasSugar && (
          <Animated.View
            style={[
              {
                position: "absolute",
                top: -sugarPieceSize * 0.6,
                left: antWidth / 2 - sugarPieceSize / 2,
              },
              sugarStyle,
            ]}
          >
            <Image
              source={ANT_IMAGES.sugarBreak2}
              style={{ width: sugarPieceSize, height: sugarPieceSize }}
              contentFit="contain"
            />
          </Animated.View>
        )}
        <Image
          source={ANT_IMAGES.ant}
          style={{ width: antWidth, height: antHeight }}
          contentFit="contain"
        />
      </Animated.View>
    </GestureDetector>
  );
}

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
  const sugarPieceSize = sugarSize;
  const rowY = initialY ?? sh * 0.65;

  const spacing = sw * ANT_SPACING;
  const range = sw + antWidth; // ระยะ 1 รอบของแต่ละมด

  // ─── แต่ละมดมี SharedValue ของตัวเอง → loop อิสระ ───
  // (ไม่ใส่ใน loop เพื่อ React Compiler)
  const o0 = useSharedValue(0);
  const o1 = useSharedValue(0);
  const o2 = useSharedValue(0);
  const o3 = useSharedValue(0);
  const o4 = useSharedValue(0);
  const o5 = useSharedValue(0);
  const o6 = useSharedValue(0);
  const o7 = useSharedValue(0);
  const o8 = useSharedValue(0);
  const o9 = useSharedValue(0);
  const allOffsets = [o0, o1, o2, o3, o4, o5, o6, o7, o8, o9];

  useEffect(() => {
    // ant 0 เริ่มที่ตำแหน่งเดียวกับที่ intro จบ (initialX)
    // getMarchX(val) = (sw + val) % range = initialX  →  val = initialX - sw
    const ant0Phase = (initialX ?? sw * 0.65) - sw;

    allOffsets.forEach((offset, i) => {
      const initialVal = ant0Phase - i * spacing;
      offset.value = initialVal;
      offset.value = withRepeat(
        withTiming(initialVal - range, {
          duration: CYCLE_DURATION,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
    });
  }, [initialX]);

  return (
    <>
      <DraggableMarchingAnt sw={sw} antWidth={antWidth} antHeight={antHeight} rowY={rowY} marchOffset={o0} hasSugar={true}  sugarPieceSize={sugarPieceSize} sugarTargetX={sugarTargetX} sugarTargetY={sugarTargetY} sugarSize={sugarSize} onSnapSugar={onReturnSugar} isActive={isActive} />
      <DraggableMarchingAnt sw={sw} antWidth={antWidth} antHeight={antHeight} rowY={rowY} marchOffset={o1} hasSugar={false} sugarPieceSize={sugarPieceSize} sugarTargetX={sugarTargetX} sugarTargetY={sugarTargetY} sugarSize={sugarSize} onSnapSugar={onReturnSugar} isActive={isActive} />
      <DraggableMarchingAnt sw={sw} antWidth={antWidth} antHeight={antHeight} rowY={rowY} marchOffset={o2} hasSugar={false} sugarPieceSize={sugarPieceSize} sugarTargetX={sugarTargetX} sugarTargetY={sugarTargetY} sugarSize={sugarSize} onSnapSugar={onReturnSugar} isActive={isActive} />
      <DraggableMarchingAnt sw={sw} antWidth={antWidth} antHeight={antHeight} rowY={rowY} marchOffset={o3} hasSugar={false} sugarPieceSize={sugarPieceSize} sugarTargetX={sugarTargetX} sugarTargetY={sugarTargetY} sugarSize={sugarSize} onSnapSugar={onReturnSugar} isActive={isActive} />
      <DraggableMarchingAnt sw={sw} antWidth={antWidth} antHeight={antHeight} rowY={rowY} marchOffset={o4} hasSugar={false} sugarPieceSize={sugarPieceSize} sugarTargetX={sugarTargetX} sugarTargetY={sugarTargetY} sugarSize={sugarSize} onSnapSugar={onReturnSugar} isActive={isActive} />
      <DraggableMarchingAnt sw={sw} antWidth={antWidth} antHeight={antHeight} rowY={rowY} marchOffset={o5} hasSugar={false} sugarPieceSize={sugarPieceSize} sugarTargetX={sugarTargetX} sugarTargetY={sugarTargetY} sugarSize={sugarSize} onSnapSugar={onReturnSugar} isActive={isActive} />
      <DraggableMarchingAnt sw={sw} antWidth={antWidth} antHeight={antHeight} rowY={rowY} marchOffset={o6} hasSugar={false} sugarPieceSize={sugarPieceSize} sugarTargetX={sugarTargetX} sugarTargetY={sugarTargetY} sugarSize={sugarSize} onSnapSugar={onReturnSugar} isActive={isActive} />
      <DraggableMarchingAnt sw={sw} antWidth={antWidth} antHeight={antHeight} rowY={rowY} marchOffset={o7} hasSugar={false} sugarPieceSize={sugarPieceSize} sugarTargetX={sugarTargetX} sugarTargetY={sugarTargetY} sugarSize={sugarSize} onSnapSugar={onReturnSugar} isActive={isActive} />
      <DraggableMarchingAnt sw={sw} antWidth={antWidth} antHeight={antHeight} rowY={rowY} marchOffset={o8} hasSugar={false} sugarPieceSize={sugarPieceSize} sugarTargetX={sugarTargetX} sugarTargetY={sugarTargetY} sugarSize={sugarSize} onSnapSugar={onReturnSugar} isActive={isActive} />
      <DraggableMarchingAnt sw={sw} antWidth={antWidth} antHeight={antHeight} rowY={rowY} marchOffset={o9} hasSugar={false} sugarPieceSize={sugarPieceSize} sugarTargetX={sugarTargetX} sugarTargetY={sugarTargetY} sugarSize={sugarSize} onSnapSugar={onReturnSugar} isActive={isActive} />
    </>
  );
}

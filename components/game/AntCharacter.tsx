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
  /** true ตลอด playing phase — ให้มดเดินต่อและลากได้แม้ pieceReturned แล้ว */
  isWalking?: boolean;
}

const ANT_COUNT = 8;
const ANT_SPACING = 0.1;
const CYCLE_DURATION = 15000; // ** ความเร็วมด: ลด = เร็ว, เพิ่ม = ช้า

function DraggableMarchingAnt({
  sw,
  antWidth,
  antHeight,
  rowY,
  marchOffset,
  range,
  hasSugar,
  sugarPieceSize,
  sugarTargetX,
  sugarTargetY,
  sugarSize,
  onSnapSugar,
  isActive,
  isWalking,
}: {
  sw: number;
  antWidth: number;
  antHeight: number;
  rowY: number;
  marchOffset: SharedValue<number>;
  range: number;
  hasSugar: boolean;
  sugarPieceSize: number;
  sugarTargetX: number;
  sugarTargetY: number;
  sugarSize: number;
  onSnapSugar: () => void;
  isActive: boolean;
  isWalking: boolean;
}) {
  // Ant drag (มดที่ไม่มีน้ำตาล)
  const antTransX = useSharedValue(0);
  const antTransY = useSharedValue(0);
  const antCtxX = useSharedValue(0);
  const antCtxY = useSharedValue(0);
  const antScale = useSharedValue(1);

  // Sugar drag (เฉพาะมดตัวที่แบกน้ำตาล)
  const sugarTransX = useSharedValue(0);
  const sugarTransY = useSharedValue(0);
  const sugarCtxX = useSharedValue(0);
  const sugarCtxY = useSharedValue(0);
  const sugarVisible = useSharedValue(1);
  const dragStartMarchX = useSharedValue(0);

  const getMarchX = (offset: number) => {
    "worklet";
    let x = sw + offset;
    x = ((x % range) + range) % range;
    return x;
  };

  const handleSnap = () => {
    onSnapSugar();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const checkSugarSnap = () => {
    const marchX = getMarchX(marchOffset.value);
    const sugarRelX = antWidth / 2 - sugarPieceSize / 2;
    const cx = marchX + sugarRelX + sugarTransX.value + sugarPieceSize / 2;
    const cy =
      rowY - sugarPieceSize * 0.6 + sugarTransY.value + sugarPieceSize / 2;
    const dist = Math.sqrt(
      Math.pow(cx - sugarTargetX, 2) + Math.pow(cy - sugarTargetY, 2),
    );
    if (dist < sugarSize * 0.6) {
      sugarVisible.value = withTiming(0, { duration: 300 });
      sugarTransX.value = withSpring(0);
      sugarTransY.value = withSpring(0);
      runOnJS(handleSnap)();
    } else {
      sugarTransX.value = withSpring(0);
      sugarTransY.value = withSpring(0);
    }
  };

  // Gesture น้ำตาล — ลากแยกจากมด, ชดเชยการเดินของมด
  const sugarGesture = Gesture.Pan()
    .enabled(isActive)
    .onStart(() => {
      dragStartMarchX.value = getMarchX(marchOffset.value);
      sugarCtxX.value = sugarTransX.value;
      sugarCtxY.value = sugarTransY.value;
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((e) => {
      const marchDelta = getMarchX(marchOffset.value) - dragStartMarchX.value;
      sugarTransX.value = sugarCtxX.value + e.translationX - marchDelta;
      sugarTransY.value = sugarCtxY.value + e.translationY;
    })
    .onEnd(() => {
      runOnJS(checkSugarSnap)();
    });

  // Gesture มดปกติ (ลากแล้วกลับแถว)
  const antGesture = Gesture.Pan()
    .enabled(!hasSugar && isWalking)
    .onStart(() => {
      antCtxX.value = antTransX.value;
      antCtxY.value = antTransY.value;
      antScale.value = withSpring(1.15);
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((e) => {
      antTransX.value = antCtxX.value + e.translationX;
      antTransY.value = antCtxY.value + e.translationY;
    })
    .onEnd(() => {
      // กลับแถวช้าๆ นิ่มนวล
      antTransX.value = withTiming(0, {
        duration: 700,
        easing: Easing.out(Easing.quad),
      });
      antTransY.value = withTiming(0, {
        duration: 700,
        easing: Easing.out(Easing.quad),
      });
      antScale.value = withTiming(1, { duration: 400 });
    });

  const antAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: getMarchX(marchOffset.value) + antTransX.value },
      { translateY: antTransY.value },
      { scale: antScale.value },
    ],
    zIndex: 28,
  }));

  const sugarStyle = useAnimatedStyle(() => ({
    opacity: sugarVisible.value,
    transform: [
      { translateX: sugarTransX.value },
      { translateY: sugarTransY.value },
    ],
  }));

  return (
    <GestureDetector gesture={antGesture}>
      <Animated.View
        style={[{ position: "absolute", top: rowY, left: 0 }, antAnimStyle]}
      >
        {hasSugar && (
          <GestureDetector gesture={sugarGesture}>
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
          </GestureDetector>
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
  isWalking: isWalkingProp,
}: AntCharacterProps) {
  const isWalking = isWalkingProp ?? isActive;
  const antWidth = sugarSize * 0.45;
  const antHeight = antWidth * 0.7;
  const sugarPieceSize = sugarSize;
  const rowY = initialY ?? sh * 0.65;

  const spacing = sw * ANT_SPACING;
  // range ใหญ่พอรองรับขบวนมดทั้งหมด + ข้ามจอ
  const range = sw + (ANT_COUNT - 1) * spacing + antWidth;

  const o0 = useSharedValue(0);
  const o1 = useSharedValue(0);
  const o2 = useSharedValue(0);
  const o3 = useSharedValue(0);
  const o4 = useSharedValue(0);
  const allOffsets = [o0, o1, o2, o3, o4];

  useEffect(() => {
    // ant 0 = ตัวนำขบวน (ซ้ายสุด, มีน้ำตาล)
    // ant 1-4 = ตามหลัง (ทางขวาของ ant 0)
    const ant0Phase = (initialX ?? sw * 0.65) - sw;

    if (!isWalking) {
      // ยังไม่ playing: set ตำแหน่งเริ่มต้นไว้รอ ไม่เริ่ม animate
      allOffsets.forEach((offset, i) => {
        offset.value = ant0Phase + i * spacing;
      });
      return;
    }

    allOffsets.forEach((offset, i) => {
      const phase = ant0Phase + i * spacing;
      offset.value = phase;
      offset.value = withRepeat(
        withTiming(phase - range, {
          duration: CYCLE_DURATION,
          easing: Easing.linear,
        }),
        -1,
        false,
      );
    });
  }, [initialX, isWalking]);

  const commonProps = {
    sw,
    antWidth,
    antHeight,
    rowY,
    range,
    sugarPieceSize,
    sugarTargetX,
    sugarTargetY,
    sugarSize,
    onSnapSugar: onReturnSugar,
    isActive,
    isWalking,
  };

  return (
    <>
      <DraggableMarchingAnt {...commonProps} marchOffset={o0} hasSugar={true} />
      <DraggableMarchingAnt
        {...commonProps}
        marchOffset={o1}
        hasSugar={false}
      />
      <DraggableMarchingAnt
        {...commonProps}
        marchOffset={o2}
        hasSugar={false}
      />
      <DraggableMarchingAnt
        {...commonProps}
        marchOffset={o3}
        hasSugar={false}
      />
      <DraggableMarchingAnt
        {...commonProps}
        marchOffset={o4}
        hasSugar={false}
      />
    </>
  );
}

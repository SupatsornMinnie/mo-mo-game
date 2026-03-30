/**
 * GameScreen — Shared game logic for all vocabulary games.
 *
 * Apple and Ant (and future games) use this same component.
 * Only the intro animation and "return piece" mechanic differ per game.
 */
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useAssetPreloader } from "../../hooks/useAssetPreloader";
import { useGameSounds } from "../../hooks/useGameSounds";
import { useGameTimer } from "../../hooks/useGameTimer";
import { useHearts } from "../../hooks/useHearts";
import { useHints } from "../../hooks/useHints";
import { useVocabProgress } from "../../hooks/useVocabProgress";
import {
  type LetterData,
  SNAP_THRESHOLD,
  calculateSlotPositions,
  generateScatterPositions,
} from "../../utils/gameConfig";

import BackButton from "../BackButton";
import CelebrationOverlay from "./CelebrationOverlay";
import CountdownNumber from "./CountdownNumber";
import DraggableLetter from "./DraggableLetter";
import GameOverlay from "./GameOverlay";
import HintButton from "./HintButton";
import LetterSlot from "./LetterSlot";
import TimerBar from "./TimerBar";

// ─── Config types ──────────────────────────────────────────

export interface ReturnPieceConfig {
  /** The draggable piece image (e.g. bitten apple, broken sugar) */
  pieceImage: any;
  /** The completed image (e.g. full apple, full sugar) */
  completedImage: any;
  /** Display size of the piece */
  displaySize: number;
  /** Target position X (center) */
  targetX: number;
  /** Target position Y (center) */
  targetY: number;
  /** The character/creature that stole the piece */
  thiefImage: any;
  /** Thief position from intro */
  thiefInitialX?: number;
  thiefInitialY?: number;
  /** Thief size */
  thiefSize: number;
  /** Snap threshold multiplier (default 2) */
  snapMultiplier?: number;
  /** Whether thief auto-navigates to piece (like worm) or player drags piece to thief location */
  thiefAutoNavigates: boolean;
}

export interface GameConfig {
  /** Game ID for progress tracking */
  id: number;
  /** The word being learned */
  word: string;
  /** Letters for this word */
  letters: LetterData[];
  /** Background image */
  bgImage: any;
  /** Intro component render function */
  renderIntro: (props: {
    sw: number;
    sh: number;
    scatterPositions: { x: number; y: number; rotation?: number }[];
    onIntroComplete: () => void;
    onThiefPosition?: (x: number, y: number) => void;
    onPieceRotation?: (angle: number) => void;
  }) => React.ReactNode;
  /** Return piece configuration */
  returnPiece: Omit<ReturnPieceConfig, "targetX" | "targetY" | "displaySize" | "thiefInitialX" | "thiefInitialY">;
  /** Celebration overlay image */
  celebrationImage: any;
  /** Letter keys for celebration overlay */
  celebrationLetterKeys: string[];
  /** Optional thief component (like WormCharacter) */
  renderThief?: (props: {
    sw: number;
    sh: number;
    initialX?: number;
    initialY?: number;
    pieceTargetX: number;
    pieceTargetY: number;
    pieceSize: number;
    pieceRotation: number;
    onReturnPiece: () => void;
    isActive: boolean;
    retryKey: number;
  }) => React.ReactNode;
}

type GamePhase =
  | "loading"
  | "intro"
  | "playing"
  | "celebration"
  | "victory"
  | "timeup"
  | "nohearts";

export default function GameScreen({ config }: { config: GameConfig }) {
  const router = useRouter();
  const { width: sw, height: sh } = useWindowDimensions();
  const { loaded } = useAssetPreloader();
  const {
    playLetterSound,
    playWordSound,
    playSFX,
    startBGM,
    stopBGM,
    stopAllSounds,
    playWordThenWin,
  } = useGameSounds();
  const {
    hearts,
    maxHearts,
    isLoaded: heartsLoaded,
    canPlay,
    loseHeart,
    nextRegenIn,
  } = useHearts();
  const { markCompleted } = useVocabProgress();
  const { hintsLeft, canUseHint, useHint: consumeHint } = useHints();

  const LETTERS = config.letters;
  const letterCount = LETTERS.length;

  // ─── Game state ──────────────────────────────────────────
  const [phase, setPhase] = useState<GamePhase>("loading");
  const [placedLetters, setPlacedLetters] = useState(() => LETTERS.map(() => false));
  const [letterSlotMap, setLetterSlotMap] = useState(() => LETTERS.map(() => -1));
  const [filledSlots, setFilledSlots] = useState(() => LETTERS.map(() => false));
  const [pieceReturned, setPieceReturned] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [highlightedSlot, setHighlightedSlot] = useState<number | null>(null);
  const [highlightPiece, setHighlightPiece] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownNum, setCountdownNum] = useState(5);
  const [isTimerShaking, setIsTimerShaking] = useState(false);
  const [isHintBlinking, setIsHintBlinking] = useState(false);
  const [thiefPos, setThiefPos] = useState<{ x: number; y: number } | null>(null);
  const [pieceRotationAngle, setPieceRotationAngle] = useState(0);
  const [scatterPositions, setScatterPositions] = useState(() =>
    generateScatterPositions(sw, sh, letterCount),
  );

  // ─── Positions ───────────────────────────────────────────
  const slotPositions = useMemo(
    () => calculateSlotPositions(sw, sh, letterCount),
    [sw, sh, letterCount],
  );
  const letterSize = slotPositions[0]?.size || 50;

  // Return piece size & position
  const pieceDisplaySize = Math.min(Math.max(sw * 0.35, 120), sh * 0.38, 230);
  const pieceTargetX = sw * 0.5;
  const pieceTargetY = sh * 0.25;

  // ─── Timer (declared before piece handlers that need pauseTimer) ──
  const beepPlayedRef = useRef(false);
  const timerCallbacks = useMemo(
    () => ({
      onTenSeconds: () => {
        setIsTimerShaking(true);
        setIsHintBlinking(true);
      },
      onFiveSeconds: () => {
        setShowCountdown(true);
        setCountdownNum(5);
      },
      onTimeUp: () => {
        setPhase((prev) => {
          if (prev !== "playing") return prev;
          stopBGM();
          playSFX("lose");
          loseHeart();
          return "timeup";
        });
      },
    }),
    [stopBGM, playSFX, loseHeart],
  );

  const {
    timeRemaining,
    progress,
    start: startTimer,
    pause: pauseTimer,
    reset: resetTimer,
  } = useGameTimer(timerCallbacks);

  useEffect(() => {
    if (phase !== "playing") return;
    if (showCountdown && timeRemaining <= 5 && timeRemaining > 0) {
      setCountdownNum(Math.ceil(timeRemaining));
      if (!beepPlayedRef.current) {
        beepPlayedRef.current = true;
        playSFX("clockBeep");
      }
    }
  }, [showCountdown, timeRemaining, playSFX, phase]);

  // ─── Piece hint pulse ────────────────────────────────────
  const pieceHintPulse = useSharedValue(1);
  const pieceHintBorder = useSharedValue(0);
  useEffect(() => {
    if (highlightPiece) {
      pieceHintBorder.value = 3;
      pieceHintPulse.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 350 }),
          withTiming(1, { duration: 350 }),
        ),
        -1,
        true,
      );
    } else {
      pieceHintBorder.value = 0;
      pieceHintPulse.value = withTiming(1, { duration: 200 });
    }
  }, [highlightPiece]);

  const pieceHintStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pieceHintPulse.value }],
    borderWidth: pieceHintBorder.value,
    borderColor: "#FFD700",
    borderRadius: 999,
  }));

  // ─── Piece drag ──────────────────────────────────────────
  const pieceTransX = useSharedValue(0);
  const pieceTransY = useSharedValue(0);
  const pieceCtxX = useSharedValue(0);
  const pieceCtxY = useSharedValue(0);
  const pieceScale = useSharedValue(1);

  const [pieceRealPos, setPieceRealPos] = useState<{ x: number; y: number } | null>(null);

  const updatePieceRealPos = useCallback(
    (tx: number, ty: number) => {
      setPieceRealPos({ x: pieceTargetX + tx, y: pieceTargetY + ty });
    },
    [pieceTargetX, pieceTargetY],
  );

  const handlePieceReturn = useCallback(() => {
    playSFX("correct");
    setPieceReturned(true);

    const allPlaced = placedLetters.every(Boolean);
    if (allPlaced) {
      pauseTimer();
      setPhase("celebration");
      stopBGM();
      playWordThenWin();
      markCompleted(config.id);
      setTimeout(() => setPhase("victory"), 6500);
    }
  }, [playSFX, placedLetters, pauseTimer, stopBGM, playWordThenWin, markCompleted, config.id]);

  // Check if piece snaps back to its original position (or to thief)
  const snapMultiplier = config.returnPiece.snapMultiplier ?? 2;
  const checkPieceSnap = useCallback(() => {
    let targetCX: number;
    let targetCY: number;

    if (thiefPos && config.renderThief) {
      // Thief exists: snap piece to thief position
      targetCX = thiefPos.x + config.returnPiece.thiefSize / 2;
      targetCY = thiefPos.y + config.returnPiece.thiefSize / 2;
    } else {
      // No thief: snap piece back to its original center position
      targetCX = pieceTargetX;
      targetCY = pieceTargetY;
    }

    const cx = pieceTargetX + pieceTransX.value;
    const cy = pieceTargetY + pieceTransY.value;
    const dx = cx - targetCX;
    const dy = cy - targetCY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < SNAP_THRESHOLD * snapMultiplier) {
      pieceTransX.value = withTiming(0, { duration: 200 });
      pieceTransY.value = withTiming(0, { duration: 200 });
      pieceScale.value = withSpring(1);
      runOnJS(handlePieceReturn)();
    } else {
      pieceScale.value = withSpring(1);
    }
  }, [thiefPos, pieceTargetX, pieceTargetY, handlePieceReturn, snapMultiplier, config.renderThief]);

  const piecePanGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          pieceCtxX.value = pieceTransX.value;
          pieceCtxY.value = pieceTransY.value;
          pieceScale.value = withSpring(1.1);
        })
        .onUpdate((e) => {
          pieceTransX.value = pieceCtxX.value + e.translationX;
          pieceTransY.value = pieceCtxY.value + e.translationY;
        })
        .onEnd(() => {
          pieceScale.value = withSpring(1);
          if (config.returnPiece.thiefAutoNavigates) {
            // Worm-style: just update position, worm walks to it
            runOnJS(updatePieceRealPos)(pieceTransX.value, pieceTransY.value);
          } else {
            // Ant-style: check if piece snaps to thief
            runOnJS(checkPieceSnap)();
          }
        }),
    [config.returnPiece.thiefAutoNavigates, updatePieceRealPos, checkPieceSnap],
  );

  const pieceAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pieceTransX.value },
      { translateY: pieceTransY.value },
      { scale: pieceScale.value },
      { rotate: `${pieceRotationAngle}deg` },
    ],
  }));

  // ─── Loading → Intro ─────────────────────────────────────
  useEffect(() => {
    if (loaded && heartsLoaded && phase === "loading") {
      startBGM();
      setPhase(canPlay ? "intro" : "nohearts");
    }
  }, [loaded, heartsLoaded, phase, canPlay, startBGM]);

  useEffect(() => {
    if (phase === "nohearts" && canPlay) setPhase("intro");
  }, [phase, canPlay]);

  // ─── Handlers ────────────────────────────────────────────
  const handleIntroComplete = useCallback(() => {
    setPhase("playing");
    startTimer();
  }, [startTimer]);

  const handleLetterPlace = useCallback(
    (letterIndex: number, slotIndex: number) => {
      playSFX("correct");

      const nextPlaced = [...placedLetters];
      nextPlaced[letterIndex] = true;
      setPlacedLetters(nextPlaced);

      setLetterSlotMap((prev) => {
        const next = [...prev];
        next[letterIndex] = slotIndex;
        return next;
      });
      setFilledSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = true;
        return next;
      });
      if (highlightedSlot === slotIndex) setHighlightedSlot(null);

      const allPlaced = nextPlaced.every(Boolean);
      if (allPlaced && pieceReturned) {
        pauseTimer();
        setPhase("celebration");
        stopBGM();
        playWordThenWin();
        markCompleted(config.id);
        setTimeout(() => setPhase("victory"), 6500);
      }
    },
    [playSFX, highlightedSlot, placedLetters, pieceReturned, pauseTimer, stopBGM, playWordThenWin, markCompleted, config.id],
  );

  const handleWrongPlace = useCallback(() => {
    playSFX("wrong");
  }, [playSFX]);

  const letterRepeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handleLetterTouch = useCallback(
    (char: string) => {
      if (letterRepeatRef.current) clearInterval(letterRepeatRef.current);
      playLetterSound(char);
      letterRepeatRef.current = setInterval(() => playLetterSound(char), 800);
    },
    [playLetterSound],
  );

  const handleLetterTouchEnd = useCallback(() => {
    if (letterRepeatRef.current) {
      clearInterval(letterRepeatRef.current);
      letterRepeatRef.current = null;
    }
  }, []);

  const handleThiefPosition = useCallback((x: number, y: number) => {
    setThiefPos({ x, y });
  }, []);

  const handlePieceRotation = useCallback((angle: number) => {
    setPieceRotationAngle(angle);
  }, []);

  const handleHint = useCallback(async () => {
    if (!canUseHint) return;
    const idx = placedLetters.findIndex((p) => !p);
    if (idx === -1) {
      if (!pieceReturned) {
        const ok = await consumeHint();
        if (!ok) return;
        setHighlightPiece(true);
        setTimeout(() => setHighlightPiece(false), 3000);
      }
      return;
    }
    const ok = await consumeHint();
    if (!ok) return;
    setHighlightedSlot(idx);
    setTimeout(() => setHighlightedSlot(null), 3000);
  }, [canUseHint, placedLetters, pieceReturned, consumeHint]);

  const handleRetry = useCallback(() => {
    if (!canPlay) {
      setPhase("nohearts");
      return;
    }
    startBGM();
    setPhase("intro");
    setPlacedLetters(LETTERS.map(() => false));
    setLetterSlotMap(LETTERS.map(() => -1));
    setFilledSlots(LETTERS.map(() => false));
    setPieceReturned(false);
    setHighlightedSlot(null);
    setHighlightPiece(false);
    setShowCountdown(false);
    setIsTimerShaking(false);
    setIsHintBlinking(false);
    setThiefPos(null);
    setPieceRealPos(null);
    pieceTransX.value = 0;
    pieceTransY.value = 0;
    pieceScale.value = 1;
    beepPlayedRef.current = false;
    resetTimer();
    setScatterPositions(generateScatterPositions(sw, sh, letterCount));
    setRetryKey((k) => k + 1);
  }, [resetTimer, sw, sh, canPlay, startBGM, letterCount]);

  const handleHome = useCallback(async () => {
    await stopAllSounds();
    router.back();
  }, [router, stopAllSounds]);

  // ─── Loading screen ──────────────────────────────────────
  if (phase === "loading") {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90D9" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ImageBackground
        source={config.bgImage}
        style={styles.container}
        resizeMode="cover"
      >
        <BackButton onPress={handleHome} />

        {/* Timer Bar — pre-render hidden during intro */}
        {(phase === "intro" || phase === "playing") && (
          <View
            style={[
              StyleSheet.absoluteFill,
              { opacity: phase === "playing" ? 1 : 0 },
            ]}
            pointerEvents={phase === "playing" ? "box-none" : "none"}
          >
            <TimerBar
              progress={progress}
              timeRemaining={timeRemaining}
              isShaking={isTimerShaking}
              hearts={hearts}
              maxHearts={maxHearts}
            />
          </View>
        )}

        {/* Intro Animation — keep during playing briefly for smooth transition */}
        {(phase === "intro" || phase === "playing") && (
          <View
            style={[
              StyleSheet.absoluteFill,
              { opacity: phase === "intro" ? 1 : 0 },
            ]}
            pointerEvents="none"
          >
            {config.renderIntro({
              sw,
              sh,
              scatterPositions,
              onIntroComplete: handleIntroComplete,
              onThiefPosition: handleThiefPosition,
              onPieceRotation: handlePieceRotation,
            })}
          </View>
        )}

        {/* Letter Slots — pre-render hidden during intro */}
        {(phase === "intro" || phase === "playing") && (
          <View
            style={[
              StyleSheet.absoluteFill,
              { opacity: phase === "playing" ? 1 : 0 },
            ]}
            pointerEvents="none"
          >
            {slotPositions.map((pos, i) => (
              <LetterSlot
                key={`slot-${i}`}
                char={LETTERS[i].char}
                x={pos.x}
                y={pos.y}
                size={pos.size}
                isFilled={filledSlots[i]}
                isHighlighted={highlightedSlot === i}
              />
            ))}
          </View>
        )}

        {/* Draggable Letters — pre-render hidden during intro */}
        {(phase === "intro" || phase === "playing") && (
          <View
            style={[
              StyleSheet.absoluteFill,
              { opacity: phase === "playing" ? 1 : 0 },
            ]}
            pointerEvents={phase === "playing" ? "box-none" : "none"}
          >
            {LETTERS.map((letter, i) => {
              const baseChar = letter.char.replace(/\d+$/, "");
              const validTargets = LETTERS.map((sl, si) => ({ sl, si }))
                .filter(({ sl, si }) => {
                  const slotBase = sl.char.replace(/\d+$/, "");
                  return slotBase === baseChar && !filledSlots[si];
                })
                .map(({ si }) => ({
                  x: slotPositions[si].x,
                  y: slotPositions[si].y,
                  slotIndex: si,
                }));

              const placedSlot = letterSlotMap[i];
              return (
                <DraggableLetter
                  key={`${retryKey}-letter-${i}`}
                  char={letter.char}
                  index={i}
                  scatterX={scatterPositions[i].x}
                  scatterY={scatterPositions[i].y}
                  scatterRotation={scatterPositions[i].rotation}
                  validTargets={validTargets}
                  slotPositions={slotPositions}
                  size={letterSize}
                  isPlaced={placedLetters[i]}
                  placedX={placedSlot >= 0 ? slotPositions[placedSlot].x : undefined}
                  placedY={placedSlot >= 0 ? slotPositions[placedSlot].y : undefined}
                  onPlace={handleLetterPlace}
                  onWrongPlace={handleWrongPlace}
                  onTouch={handleLetterTouch}
                  onTouchEnd={handleLetterTouchEnd}
                />
              );
            })}
          </View>
        )}

        {/* Return Piece (bitten apple / broken sugar) — draggable */}
        {(phase === "intro" || phase === "playing") && (
          <View
            style={[
              StyleSheet.absoluteFill,
              { opacity: phase === "playing" ? 1 : 0 },
            ]}
            pointerEvents={phase === "playing" ? "box-none" : "none"}
          >
            <GestureDetector gesture={piecePanGesture}>
              <Animated.View
                style={[
                  styles.piece,
                  {
                    left: pieceTargetX - pieceDisplaySize / 2,
                    top: pieceTargetY - pieceDisplaySize / 2,
                  },
                  pieceAnimStyle,
                ]}
              >
                <Animated.View
                  style={[
                    {
                      position: "absolute",
                      width: pieceDisplaySize,
                      height: pieceDisplaySize,
                      borderRadius: 999,
                      borderStyle: "dashed",
                    },
                    pieceHintStyle,
                  ]}
                  pointerEvents="none"
                />
                <Image
                  source={
                    pieceReturned
                      ? config.returnPiece.completedImage
                      : config.returnPiece.pieceImage
                  }
                  style={{ width: pieceDisplaySize, height: pieceDisplaySize }}
                  contentFit="contain"
                />
              </Animated.View>
            </GestureDetector>
          </View>
        )}

        {/* Thief character (worm / ant) — auto-navigate or static */}
        {(phase === "intro" || phase === "playing") &&
          !pieceReturned &&
          config.renderThief && (
            <View
              style={[
                StyleSheet.absoluteFill,
                { opacity: phase === "playing" ? 1 : 0 },
              ]}
              pointerEvents={phase === "playing" ? "box-none" : "none"}
            >
              {config.renderThief({
                sw,
                sh,
                initialX: thiefPos?.x,
                initialY: thiefPos?.y,
                pieceTargetX: pieceRealPos ? pieceRealPos.x : pieceTargetX,
                pieceTargetY: pieceRealPos ? pieceRealPos.y : pieceTargetY,
                pieceSize: pieceDisplaySize,
                pieceRotation: pieceRotationAngle,
                onReturnPiece: handlePieceReturn,
                isActive: phase === "playing" && !pieceReturned,
                retryKey,
              })}
            </View>
          )}

        {/* Static thief (ant) — แสดงค้างตอน playing เมื่อไม่มี renderThief */}
        {phase === "playing" &&
          !pieceReturned &&
          !config.renderThief &&
          thiefPos &&
          config.returnPiece.thiefImage && (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <Image
                source={config.returnPiece.thiefImage}
                style={{
                  position: "absolute",
                  left: thiefPos.x,
                  top: thiefPos.y,
                  width: config.returnPiece.thiefSize,
                  height: config.returnPiece.thiefSize,
                }}
                contentFit="contain"
              />
            </View>
          )}

        {/* Hint Button */}
        {phase === "playing" && (
          <HintButton
            freeHints={hintsLeft}
            isBlinking={isHintBlinking}
            onPress={handleHint}
          />
        )}

        {/* Countdown Numbers */}
        {phase === "playing" && showCountdown && countdownNum > 0 && (
          <CountdownNumber number={countdownNum} sw={sw} sh={sh} />
        )}

        {/* Celebration */}
        {phase === "celebration" && (
          <CelebrationOverlay
            wordImage={config.celebrationImage}
            letterKeys={config.celebrationLetterKeys}
          />
        )}

        {/* Victory / Time Up / No Hearts */}
        {(phase === "victory" || phase === "timeup" || phase === "nohearts") && (
          <GameOverlay
            type={phase}
            onRetry={handleRetry}
            onHome={handleHome}
            heartsLeft={hearts}
            nextRegenIn={nextRegenIn}
          />
        )}
      </ImageBackground>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#E8F4FD",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 18,
    color: "#4A90D9",
    fontWeight: "600",
  },
  piece: {
    position: "absolute",
    zIndex: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});

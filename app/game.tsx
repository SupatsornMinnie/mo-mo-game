import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { View, Text, Pressable, ImageBackground, useWindowDimensions, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { useAssetPreloader } from '../hooks/useAssetPreloader';
import { useGameSounds } from '../hooks/useGameSounds';
import { useGameTimer } from '../hooks/useGameTimer';
import { useHearts } from '../hooks/useHearts';
import { useVocabProgress } from '../hooks/useVocabProgress';
import {
  APPLE_LETTERS,
  GAME_IMAGES,
  HINT_FREE_COUNT,
  calculateSlotPositions,
  generateScatterPositions,
} from '../utils/gameConfig';

import LetterSlot from '../components/game/LetterSlot';
import DraggableLetter from '../components/game/DraggableLetter';
// DraggableApplePiece removed — worm drags directly to apple
import TimerBar from '../components/game/TimerBar';
import WormCharacter from '../components/game/WormCharacter';
import AppleDrop from '../components/game/AppleDrop';
import HintButton from '../components/game/HintButton';
import CountdownNumber from '../components/game/CountdownNumber';
import GameOverlay from '../components/game/GameOverlay';
import CelebrationOverlay from '../components/game/CelebrationOverlay';

type GamePhase = 'loading' | 'intro' | 'playing' | 'celebration' | 'victory' | 'timeup' | 'nohearts';

export default function GameScreen() {
  const router = useRouter();
  const { word, id } = useLocalSearchParams<{ word: string; id: string }>();
  const { width: sw, height: sh } = useWindowDimensions();
  const { loaded } = useAssetPreloader();
  const { playLetterSound, playWordSound, playSFX, startBGM, stopBGM, stopAllSounds, playWordThenWin } = useGameSounds();
  const { hearts, maxHearts, isLoaded: heartsLoaded, canPlay, loseHeart, nextRegenIn } = useHearts();
  const { markCompleted } = useVocabProgress();

  // Game state
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [placedLetters, setPlacedLetters] = useState<boolean[]>(
    APPLE_LETTERS.map(() => false)
  );
  // Track which slot each letter is placed in (-1 = not placed)
  const [letterSlotMap, setLetterSlotMap] = useState<number[]>(
    APPLE_LETTERS.map(() => -1)
  );
  // Track which slots are occupied
  const [filledSlots, setFilledSlots] = useState<boolean[]>(
    APPLE_LETTERS.map(() => false)
  );
  const [applePieceReturned, setApplePieceReturned] = useState(false);
  const [wormInitPos, setWormInitPos] = useState<{ x: number; y: number } | null>(null);
  const [appleRotationAngle, setAppleRotationAngle] = useState(0);
  const [freeHints, setFreeHints] = useState(HINT_FREE_COUNT);
  const [highlightedSlot, setHighlightedSlot] = useState<number | null>(null);
  const [highlightApple, setHighlightApple] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownNum, setCountdownNum] = useState(5);
  const [isTimerShaking, setIsTimerShaking] = useState(false);
  const [isHintBlinking, setIsHintBlinking] = useState(false);

  // Positions
  const slotPositions = useMemo(() => calculateSlotPositions(sw, sh), [sw, sh]);

  // Apple hint pulse
  const appleHintPulse = useSharedValue(1);
  const appleHintBorder = useSharedValue(0); // 0 = ซ่อน, 3 = แสดง
  useEffect(() => {
    if (highlightApple) {
      appleHintBorder.value = 3;
      appleHintPulse.value = withRepeat(
        withSequence(
          withTiming(1.12, { duration: 350 }),
          withTiming(1, { duration: 350 })
        ),
        -1,
        true
      );
    } else {
      appleHintBorder.value = 0;
      appleHintPulse.value = withTiming(1, { duration: 200 });
    }
  }, [highlightApple]);

  const appleHintStyle = useAnimatedStyle(() => ({
    transform: [{ scale: appleHintPulse.value }],
    borderWidth: appleHintBorder.value,
    borderColor: '#FFD700',
    borderRadius: 999,
  }));

  // แอปเปิ้ลลากได้
  const appleTransX = useSharedValue(0);
  const appleTransY = useSharedValue(0);
  const appleCtxX = useSharedValue(0);
  const appleCtxY = useSharedValue(0);
  const appleScale = useSharedValue(1);

  const applePanGesture = useMemo(() => Gesture.Pan()
    .onStart(() => {
      appleCtxX.value = appleTransX.value;
      appleCtxY.value = appleTransY.value;
      appleScale.value = withSpring(1.1);
    })
    .onUpdate((e) => {
      appleTransX.value = appleCtxX.value + e.translationX;
      appleTransY.value = appleCtxY.value + e.translationY;
    })
    .onEnd(() => {
      appleScale.value = withSpring(1);
    }), []);

  const appleAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: appleTransX.value },
      { translateY: appleTransY.value },
      { scale: appleScale.value },
      { rotate: `${appleRotationAngle}deg` },
    ],
  }));
  const [scatterPositions, setScatterPositions] = useState(() =>
    generateScatterPositions(sw, sh)
  );

  // Timer callbacks
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
        // เช็คว่ายังอยู่ใน playing อยู่ ไม่ให้ทับ celebration/victory
        setPhase((prev) => {
          if (prev !== 'playing') return prev;
          stopBGM();
          playSFX('lose');
          loseHeart(); // เสียหัวใจ 1 ดวง
          return 'timeup';
        });
      },
    }),
    [stopBGM, playSFX, loseHeart]
  );

  const { timeRemaining, progress, start: startTimer, pause: pauseTimer, reset: resetTimer } =
    useGameTimer(timerCallbacks);

  // Countdown effect (5, 4, 3, 2, 1) + เสียง clock beep ครั้งเดียวตอนเหลือ 5 วิ
  const beepPlayedRef = useRef(false);
  useEffect(() => {
    if (phase !== 'playing') return;
    if (showCountdown && timeRemaining <= 5 && timeRemaining > 0) {
      const num = Math.ceil(timeRemaining);
      setCountdownNum(num);
      // เล่นเสียง beep แค่ครั้งเดียวตอนเริ่ม countdown
      if (!beepPlayedRef.current) {
        beepPlayedRef.current = true;
        playSFX('clockBeep');
      }
    }
  }, [showCountdown, timeRemaining, playSFX, phase]);

  // Start game when assets + hearts loaded
  useEffect(() => {
    if (loaded && heartsLoaded && phase === 'loading') {
      setPhase(canPlay ? 'intro' : 'nohearts');
    }
  }, [loaded, heartsLoaded, phase, canPlay]);

  // ถ้าหัวใจ regen ระหว่างรอ nohearts → เริ่มเกมอัตโนมัติ
  useEffect(() => {
    if (phase === 'nohearts' && canPlay) {
      setPhase('intro');
    }
  }, [phase, canPlay]);

  // Check win condition: all letters + apple piece returned
  useEffect(() => {
    if (phase !== 'playing') return;
    const allPlaced = placedLetters.every(Boolean);
    if (allPlaced && applePieceReturned) {
      pauseTimer(); // หยุด timer ทันทีเมื่อชนะ ป้องกัน TIME'S UP ทับ
      setPhase('celebration');
      stopBGM();
      playWordThenWin();
      // บันทึกคำศัพท์นี้ว่าเล่นชนะแล้ว
      const vocabId = id ? parseInt(id, 10) : 1;
      markCompleted(vocabId);
      setTimeout(() => setPhase('victory'), 6500); // ค้าง celebration 6.5 วิ (+3 วิจากเดิม)
    }
  }, [placedLetters, applePieceReturned, phase, pauseTimer, stopBGM, playWordThenWin, markCompleted, id]);

  // === Handlers ===
  const handleIntroComplete = useCallback(() => {
    setPhase('playing');
    startTimer();
    startBGM();
  }, [startTimer, startBGM]);

  const handleLetterPlace = useCallback(
    (letterIndex: number, slotIndex: number) => {
      playSFX('correct');
      setPlacedLetters((prev) => {
        const next = [...prev];
        next[letterIndex] = true;
        return next;
      });
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
    },
    [playSFX, highlightedSlot]
  );

  const handleWrongPlace = useCallback(() => {
    playSFX('wrong');
  }, [playSFX]);

  const letterRepeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handleLetterTouch = useCallback(
    (char: string) => {
      // เล่นเสียงทันที + ซ้ำเรื่อยๆ ทุก 0.8 วินาที จนกว่าจะปล่อยมือ
      if (letterRepeatRef.current) clearInterval(letterRepeatRef.current);
      playLetterSound(char);
      letterRepeatRef.current = setInterval(() => {
        playLetterSound(char);
      }, 800);
    },
    [playLetterSound]
  );

  const handleLetterTouchEnd = useCallback(() => {
    if (letterRepeatRef.current) {
      clearInterval(letterRepeatRef.current);
      letterRepeatRef.current = null;
    }
  }, []);

  const handleWormPosition = useCallback((x: number, y: number) => {
    setWormInitPos({ x, y });
  }, []);

  const handleAppleRotation = useCallback((angle: number) => {
    setAppleRotationAngle(angle);
  }, []);

  const handleApplePieceReturn = useCallback(() => {
    playSFX('correct');
    setApplePieceReturned(true);
  }, [playSFX]);

  const handleHint = useCallback(() => {
    if (freeHints <= 0) return; // TODO: show ad prompt
    // Find first unplaced letter
    const idx = placedLetters.findIndex((p) => !p);
    if (idx === -1) {
      // ตัวอักษรครบแล้ว — ถ้าหนอนยังไม่กลับ ให้ไฮไลต์แอปเปิ้ล
      if (!applePieceReturned) {
        setFreeHints((prev) => prev - 1);
        setHighlightApple(true);
        setTimeout(() => setHighlightApple(false), 3000);
      }
      return;
    }
    setFreeHints((prev) => prev - 1);
    setHighlightedSlot(idx);
    // Clear highlight after 3 seconds
    setTimeout(() => setHighlightedSlot(null), 3000);
  }, [freeHints, placedLetters, applePieceReturned]);

  const handleRetry = useCallback(() => {
    if (!canPlay) { setPhase('nohearts'); return; }
    setPhase('intro');
    setPlacedLetters(APPLE_LETTERS.map(() => false));
    setLetterSlotMap(APPLE_LETTERS.map(() => -1));
    setFilledSlots(APPLE_LETTERS.map(() => false));
    setApplePieceReturned(false);
    setFreeHints(HINT_FREE_COUNT);
    setHighlightedSlot(null);
    setHighlightApple(false);
    setShowCountdown(false);
    setIsTimerShaking(false);
    setIsHintBlinking(false);
    setWormInitPos(null);
    setScatterPositions(generateScatterPositions(sw, sh)); // สุ่มตำแหน่งใหม่!
    beepPlayedRef.current = false; // reset เสียง beep สำหรับรอบใหม่
    resetTimer();
  }, [resetTimer, sw, sh, canPlay]);

  const handleHome = useCallback(async () => {
    await stopAllSounds(); // หยุดเสียงทั้งหมดก่อนออกจากหน้า
    router.back();
  }, [router, stopAllSounds]);

  // === Render ===

  // Loading screen
  if (phase === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90D9" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const letterSize = slotPositions[0]?.size || 50;
  // Apple size — ใหญ่ชัดเจน
  const appleDisplaySize = Math.min(Math.max(sw * 0.35, 120), sh * 0.38, 230);
  // แอปเปิ้ลอยู่ส่วนบน ตัวอักษรอยู่ส่วนล่าง
  const appleTargetX = sw * 0.5;
  const appleTargetY = sh * 0.25;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ImageBackground
        source={GAME_IMAGES.bg}
        style={styles.container}
        resizeMode="cover"
      >
        {/* Back Button */}
        <Pressable style={styles.backBtn} onPress={handleHome}>
          <Text style={styles.backText}>{'←'}</Text>
        </Pressable>

        {/* Timer Bar — pre-render แต่ซ่อนตอน intro (absolute overlay ไม่กระทบ layout) */}
        {(phase === 'intro' || phase === 'playing') && (
          <View style={[StyleSheet.absoluteFill, { opacity: phase === 'playing' ? 1 : 0 }]} pointerEvents={phase === 'playing' ? 'box-none' : 'none'}>
            <TimerBar
              progress={progress}
              timeRemaining={timeRemaining}
              isShaking={isTimerShaking}
              hearts={hearts}
              maxHearts={maxHearts}
            />
          </View>
        )}

        {/* Intro Animation — เก็บไว้ตอน playing ชั่วครู่เพื่อไม่ให้กระตุก */}
        {(phase === 'intro' || phase === 'playing') && (
          <View style={[StyleSheet.absoluteFill, { opacity: phase === 'intro' ? 1 : 0 }]} pointerEvents="none">
            <AppleDrop
              sw={sw}
              sh={sh}
              scatterPositions={scatterPositions}
              onIntroComplete={handleIntroComplete}
              onWormPosition={handleWormPosition}
              onAppleRotation={handleAppleRotation}
            />
          </View>
        )}

        {/* Letter Slots (shadows) — pre-render แต่ซ่อนตอน intro (absolute ไม่กระทบ layout) */}
        {(phase === 'intro' || phase === 'playing') && (
          <View style={[StyleSheet.absoluteFill, { opacity: phase === 'playing' ? 1 : 0 }]} pointerEvents="none">
            {slotPositions.map((pos, i) => (
              <LetterSlot
                key={`slot-${i}`}
                char={APPLE_LETTERS[i].char}
                x={pos.x}
                y={pos.y}
                size={pos.size}
                isFilled={filledSlots[i]}
                isHighlighted={highlightedSlot === i}
              />
            ))}
          </View>
        )}

        {/* Draggable Letters — pre-render ซ่อนตอน intro (absolute overlay) */}
        {(phase === 'intro' || phase === 'playing') && (
          <View style={[StyleSheet.absoluteFill, { opacity: phase === 'playing' ? 1 : 0 }]} pointerEvents={phase === 'playing' ? 'box-none' : 'none'}>
            {APPLE_LETTERS.map((letter, i) => {
              const baseChar = letter.char.replace(/\d+$/, '');
              const validTargets = APPLE_LETTERS
                .map((sl, si) => ({ sl, si }))
                .filter(({ sl, si }) => {
                  const slotBase = sl.char.replace(/\d+$/, '');
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
                  key={`letter-${i}`}
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

        {/* Bitten Apple — pre-render ซ่อนตอน intro (absolute overlay) */}
        {(phase === 'intro' || phase === 'playing') && (
          <View style={[StyleSheet.absoluteFill, { opacity: phase === 'playing' ? 1 : 0 }]} pointerEvents={phase === 'playing' ? 'box-none' : 'none'}>
            <GestureDetector gesture={applePanGesture}>
              <Animated.View style={[styles.bittenApple, {
                left: appleTargetX - appleDisplaySize / 2,
                top: appleTargetY - appleDisplaySize / 2,
              }, appleAnimStyle]}>
                {/* วงกลม hint สีทอง */}
                <Animated.View style={[{
                  position: 'absolute',
                  width: appleDisplaySize,
                  height: appleDisplaySize,
                  borderRadius: 999,
                  borderStyle: 'dashed',
                }, appleHintStyle]} pointerEvents="none" />
                <Image
                  source={applePieceReturned ? GAME_IMAGES.apple : GAME_IMAGES.appleBitten}
                  style={{ width: appleDisplaySize, height: appleDisplaySize }}
                  contentFit="contain"
                />
              </Animated.View>
            </GestureDetector>
          </View>
        )}

        {/* Worm — pre-render ซ่อนตอน intro (absolute overlay) */}
        {(phase === 'intro' || phase === 'playing') && !applePieceReturned && (
          <View style={[StyleSheet.absoluteFill, { opacity: phase === 'playing' ? 1 : 0 }]} pointerEvents={phase === 'playing' ? 'box-none' : 'none'}>
            <WormCharacter
              sw={sw}
              sh={sh}
              initialX={wormInitPos?.x}
              initialY={wormInitPos?.y}
              appleTargetX={appleTargetX}
              appleTargetY={appleTargetY}
              appleSize={appleDisplaySize}
              appleRotation={appleRotationAngle}
              onReturnApple={handleApplePieceReturn}
              isActive={phase === 'playing' && !applePieceReturned}
            />
          </View>
        )}

        {/* Hint Button */}
        {phase === 'playing' && (
          <HintButton
            freeHints={freeHints}
            isBlinking={isHintBlinking}
            onPress={handleHint}
          />
        )}

        {/* Countdown Numbers */}
        {phase === 'playing' && showCountdown && countdownNum > 0 && (
          <CountdownNumber number={countdownNum} sw={sw} sh={sh} />
        )}

        {/* Celebration — แอปเปิ้ล + APPLE + confetti 3 วินาที */}
        {phase === 'celebration' && <CelebrationOverlay />}

        {/* Victory / Time's Up / No Hearts Overlay */}
        {(phase === 'victory' || phase === 'timeup' || phase === 'nohearts') && (
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
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#E8F4FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 18,
    color: '#4A90D9',
    fontWeight: '600',
  },
  backBtn: {
    position: 'absolute',
    top: 10,
    left: 15,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    borderWidth: 2,
    borderColor: '#4A90D9',
  },
  backText: {
    fontSize: 22,
    color: '#4A90D9',
    fontWeight: '700',
  },
  bittenApple: {
    position: 'absolute',
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { View, Text, Pressable, ImageBackground, useWindowDimensions, ActivityIndicator, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { useAssetPreloader } from '../hooks/useAssetPreloader';
import { useGameSounds } from '../hooks/useGameSounds';
import { useGameTimer } from '../hooks/useGameTimer';
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

type GamePhase = 'loading' | 'intro' | 'playing' | 'celebration' | 'victory' | 'timeup';

export default function GameScreen() {
  const router = useRouter();
  const { word, id } = useLocalSearchParams<{ word: string; id: string }>();
  const { width: sw, height: sh } = useWindowDimensions();
  const { loaded } = useAssetPreloader();
  const { playLetterSound, playWordSound, playSFX, startBGM, stopBGM, playWordThenWin } = useGameSounds();

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
  const [freeHints, setFreeHints] = useState(HINT_FREE_COUNT);
  const [highlightedSlot, setHighlightedSlot] = useState<number | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownNum, setCountdownNum] = useState(5);
  const [isTimerShaking, setIsTimerShaking] = useState(false);
  const [isHintBlinking, setIsHintBlinking] = useState(false);

  // Positions
  const slotPositions = useMemo(() => calculateSlotPositions(sw, sh), [sw, sh]);

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
        setPhase('timeup');
        stopBGM();
        playSFX('lose');
      },
    }),
    [stopBGM, playSFX]
  );

  const { timeRemaining, progress, start: startTimer, reset: resetTimer } =
    useGameTimer(timerCallbacks);

  // Countdown effect (5, 4, 3, 2, 1) + เสียง clock beep
  const lastBeepRef = useRef(0);
  useEffect(() => {
    if (showCountdown && timeRemaining <= 5 && timeRemaining > 0) {
      const num = Math.ceil(timeRemaining);
      setCountdownNum(num);
      // เล่นเสียง beep ทุกวินาที (ไม่ซ้ำ)
      if (num !== lastBeepRef.current) {
        lastBeepRef.current = num;
        playSFX('clockBeep');
      }
    }
  }, [showCountdown, timeRemaining, playSFX]);

  // Start game when assets loaded
  useEffect(() => {
    if (loaded && phase === 'loading') {
      setPhase('intro');
    }
  }, [loaded, phase]);

  // Check win condition: all letters + apple piece returned
  useEffect(() => {
    if (phase !== 'playing') return;
    const allPlaced = placedLetters.every(Boolean);
    if (allPlaced && applePieceReturned) {
      setPhase('celebration');
      stopBGM(); // หยุดเพลงพื้นหลัง
      playWordThenWin(); // เล่น "Apple" → รอจบ → เล่นเสียง win
      setTimeout(() => setPhase('victory'), 3500);
    }
  }, [placedLetters, applePieceReturned, phase, stopBGM, playWordThenWin]);

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

  const handleApplePieceReturn = useCallback(() => {
    playSFX('correct');
    setApplePieceReturned(true);
  }, [playSFX]);

  const handleHint = useCallback(() => {
    if (freeHints <= 0) return; // TODO: show ad prompt
    // Find first unplaced letter
    const idx = placedLetters.findIndex((p) => !p);
    if (idx === -1) return;
    setFreeHints((prev) => prev - 1);
    setHighlightedSlot(idx);
    // Clear highlight after 3 seconds
    setTimeout(() => setHighlightedSlot(null), 3000);
  }, [freeHints, placedLetters]);

  const handleRetry = useCallback(() => {
    setPhase('intro');
    setPlacedLetters(APPLE_LETTERS.map(() => false));
    setLetterSlotMap(APPLE_LETTERS.map(() => -1));
    setFilledSlots(APPLE_LETTERS.map(() => false));
    setApplePieceReturned(false);
    setFreeHints(HINT_FREE_COUNT);
    setHighlightedSlot(null);
    setShowCountdown(false);
    setIsTimerShaking(false);
    setIsHintBlinking(false);
    setWormInitPos(null);
    setScatterPositions(generateScatterPositions(sw, sh)); // สุ่มตำแหน่งใหม่!
    resetTimer();
  }, [resetTimer, sw, sh]);

  const handleHome = useCallback(() => {
    router.back();
  }, [router]);

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

        {/* Timer Bar — pre-render แต่ซ่อนตอน intro */}
        {(phase === 'intro' || phase === 'playing') && (
          <View style={{ opacity: phase === 'playing' ? 1 : 0 }} pointerEvents={phase === 'playing' ? 'auto' : 'none'}>
            <TimerBar
              progress={progress}
              timeRemaining={timeRemaining}
              isShaking={isTimerShaking}
            />
          </View>
        )}

        {/* Intro Animation — เก็บไว้ตอน playing ชั่วครู่เพื่อไม่ให้กระตุก */}
        {(phase === 'intro' || phase === 'playing') && (
          <View style={{ opacity: phase === 'intro' ? 1 : 0 }} pointerEvents="none">
            <AppleDrop
              sw={sw}
              sh={sh}
              scatterPositions={scatterPositions}
              onIntroComplete={handleIntroComplete}
              onWormPosition={handleWormPosition}
            />
          </View>
        )}

        {/* Letter Slots (shadows) — pre-render แต่ซ่อนตอน intro */}
        {(phase === 'intro' || phase === 'playing') &&
          slotPositions.map((pos, i) => (
            <View key={`slot-${i}`} style={{ opacity: phase === 'playing' ? 1 : 0 }}>
              <LetterSlot
                char={APPLE_LETTERS[i].char}
                x={pos.x}
                y={pos.y}
                size={pos.size}
                isFilled={filledSlots[i]}
                isHighlighted={highlightedSlot === i}
              />
            </View>
          ))}

        {/* Draggable Letters — pre-render ซ่อนตอน intro */}
        {(phase === 'intro' || phase === 'playing') &&
          APPLE_LETTERS.map((letter, i) => {
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
              <View key={`letter-${i}`} style={{ opacity: phase === 'playing' ? 1 : 0 }} pointerEvents={phase === 'playing' ? 'auto' : 'none'}>
                <DraggableLetter
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
              </View>
            );
          })}

        {/* Bitten Apple — pre-render ซ่อนตอน intro */}
        {(phase === 'intro' || phase === 'playing') && (
          <View style={{ opacity: phase === 'playing' ? 1 : 0 }} pointerEvents={phase === 'playing' ? 'auto' : 'none'}>
            <GestureDetector gesture={applePanGesture}>
              <Animated.View style={[styles.bittenApple, {
                left: appleTargetX - appleDisplaySize / 2,
                top: appleTargetY - appleDisplaySize / 2,
                width: appleDisplaySize,
                height: appleDisplaySize,
                borderRadius: appleDisplaySize / 2,
                borderWidth: applePieceReturned ? 0 : 3,
                borderColor: 'rgba(255,220,50,0.8)',
                borderStyle: 'dashed',
              }, appleAnimStyle]}>
                <Image
                  source={applePieceReturned ? GAME_IMAGES.apple : GAME_IMAGES.appleBitten}
                  style={{ width: appleDisplaySize * 0.9, height: appleDisplaySize * 0.9 }}
                  contentFit="contain"
                />
              </Animated.View>
            </GestureDetector>
          </View>
        )}

        {/* Worm — pre-render ซ่อนตอน intro */}
        {(phase === 'intro' || phase === 'playing') && !applePieceReturned && (
          <View style={{ opacity: phase === 'playing' ? 1 : 0 }} pointerEvents={phase === 'playing' ? 'auto' : 'none'}>
            <WormCharacter
              sw={sw}
              sh={sh}
              initialX={wormInitPos?.x}
              initialY={wormInitPos?.y}
              appleTargetX={appleTargetX}
              appleTargetY={appleTargetY}
              appleSize={appleDisplaySize}
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

        {/* Victory / Time's Up Overlay */}
        {(phase === 'victory' || phase === 'timeup') && (
          <GameOverlay
            type={phase}
            onRetry={handleRetry}
            onHome={handleHome}
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

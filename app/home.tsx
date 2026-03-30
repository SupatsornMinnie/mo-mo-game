import { Audio } from "expo-av";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import {
  ImageBackground,
  Pressable,
  Text,
  useWindowDimensions,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import SeaCreature from "../components/SeaCreature";
import VocabBubble, { BubbleInfo } from "../components/VocabBubble";
import { useVocabProgress } from "../hooks/useVocabProgress";
import { homeStyles } from "../styles/home.styles";
import { playBubblePop } from "../utils/playBubblePop";

// ===== ภาพ =====
const BG_HOME = require("../assets/home/bg2.jpg");
const WHALE = require("../assets/home/blue_whale.webp");
const JELLY1 = require("../assets/home/jelly_fish_1.webp");
const JELLY2 = require("../assets/home/jelly_fish_2.webp");
const JELLY3 = require("../assets/home/jelly_fish_3.webp");
const CRAB = require("../assets/home/crab.webp");

// ===== เสียง =====
const BGM = require("../assets/sounds/Abyssal_Lullaby.mp3");
const SFX_BREAK = require("../assets/sounds/bubble_break.wav");
const SFX_LOCK = require("../assets/sounds/bubble_lock.wav");
const SFX_BOUNCE = require("../assets/sounds/bubble-bounce.wav");

// ===== Bubble ว่าง =====
const EMPTY_BUBBLES = [
  require("../assets/bubble/bubble_1.webp"),
  require("../assets/bubble/bubble_2.webp"),
  require("../assets/bubble/bubble_3.webp"),
  require("../assets/bubble/bubble_4.webp"),
  require("../assets/bubble/bubble_5.webp"),
  require("../assets/bubble/bubble_6.webp"),
  require("../assets/bubble/bubble_7.webp"),
  require("../assets/bubble/bubble_8.webp"),
];

// ===== Vocabulary =====
const VOCAB_BUBBLES = [
  {
    id: 1,
    word: "Apple",
    image: require("../assets/vocabulary/1apple/bubble_apple.webp"),
    locked: false,
    hasGame: true, // เกมสร้างแล้ว → ไป /game
  },
  {
    id: 2,
    word: "Ant",
    image: require("../assets/vocabulary/2ant/bubble_ant.webp"),
    locked: false,
    hasGame: true,   // เกมสร้างแล้ว → ไป /games/2
  },
  {
    id: 3,
    word: "Actor",
    image: require("../assets/vocabulary/3actor/bubble_actor.webp"),
    locked: false,
    hasGame: false,
  },
  {
    id: 4,
    word: "Airplane",
    image: require("../assets/vocabulary/4airplan/bubble_airplan.webp"),
    locked: false,
    hasGame: false,
  },
  {
    id: 5,
    word: "Banana",
    image: require("../assets/vocabulary/5banana/bubble_banana.webp"),
    locked: true,
    hasGame: false,
  },
  {
    id: 6,
    word: "Bird",
    image: require("../assets/vocabulary/6bird/bubble_bird.webp"),
    locked: true,
    hasGame: false,
  },
  {
    id: 7,
    word: "Baker",
    image: require("../assets/vocabulary/7baker/bubble_baker.webp"),
    locked: true,
    hasGame: false,
  },
  {
    id: 8,
    word: "Ball",
    image: require("../assets/vocabulary/8ball/bubble_ball.webp"),
    locked: true,
    hasGame: false,
  },
];

const EMPTY_COUNT = 20;

export default function HomeScreen() {
  const { width: sw, height: sh } = useWindowDimensions();
  const router = useRouter();
  const {
    totalCompleted,
    isCompleted,
    reload: reloadVocab,
  } = useVocabProgress();

  // อ่าน progress ใหม่ทุกครั้งที่กลับมาหน้า home
  useFocusEffect(
    useCallback(() => {
      reloadVocab();
    }, [reloadVocab]),
  );
  const bgmRef = useRef<Audio.Sound | null>(null);
  const sfxCache = useRef<{ [key: string]: Audio.Sound | null }>({});

  // Bubble refs สำหรับ collision detection
  const emptyBubbleRefs = useRef<React.RefObject<BubbleInfo | null>[]>(
    Array.from({ length: EMPTY_COUNT }, () =>
      React.createRef<BubbleInfo | null>(),
    ),
  );
  const vocabBubbleRefs = useRef<React.RefObject<BubbleInfo | null>[]>(
    Array.from({ length: VOCAB_BUBBLES.length }, () =>
      React.createRef<BubbleInfo | null>(),
    ),
  );

  // === เล่นเพลงพื้นหลัง — หยุดตอนออกจากหน้า, เล่นต่อตอนกลับมา ===
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      const startBGM = async () => {
        try {
          await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
          });
          if (bgmRef.current) {
            // กลับมาหน้านี้ → เล่นต่อ
            await bgmRef.current.setPositionAsync(0);
            await bgmRef.current.playAsync();
          } else {
            const { sound } = await Audio.Sound.createAsync(BGM, {
              isLooping: true,
              volume: 0.3,
            });
            if (mounted) {
              bgmRef.current = sound;
              await sound.playAsync();
            } else {
              await sound.unloadAsync();
            }
          }
        } catch (e) {
          console.warn("BGM error:", e);
        }
      };
      startBGM();
      // ออกจากหน้านี้ → หยุดเพลง
      return () => {
        mounted = false;
        bgmRef.current?.stopAsync();
      };
    }, []),
  );

  // === เล่นเสียง SFX ===
  const playSound = useCallback(async (type: "break" | "lock" | "bounce") => {
    try {
      const src =
        type === "break" ? SFX_BREAK : type === "lock" ? SFX_LOCK : SFX_BOUNCE;
      // ปรับ volume ให้เท่ากัน (lock/bounce เบากว่า break ~6 เท่า)
      const vol = type === "break" ? 0.5 : type === "lock" ? 1.0 : 1.0;
      const { sound } = await Audio.Sound.createAsync(src, { volume: vol });
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (e) {
      console.warn("SFX error:", e);
    }
  }, []);

  // === Collision detection ===
  useEffect(() => {
    const checkCollisions = () => {
      const allEmpty = emptyBubbleRefs.current
        .map((r) => r.current)
        .filter(Boolean) as BubbleInfo[];
      const allVocab = vocabBubbleRefs.current
        .map((r) => r.current)
        .filter(Boolean) as BubbleInfo[];

      // empty vs empty
      for (let i = 0; i < allEmpty.length; i++) {
        for (let j = i + 1; j < allEmpty.length; j++) {
          const a = allEmpty[i];
          const b = allEmpty[j];
          if (!a.alive || !b.alive) continue;
          const dist = Math.sqrt(
            Math.pow(a.x + a.size / 2 - b.x - b.size / 2, 2) +
              Math.pow(a.y + a.size / 2 - b.y - b.size / 2, 2),
          );
          if (dist < (a.size + b.size) * 0.35) {
            a.pop();
            b.pop();
          }
        }
      }

      // empty vs vocab
      for (const empty of allEmpty) {
        if (!empty.alive) continue;
        for (const vocab of allVocab) {
          if (!vocab.alive) continue;
          const dist = Math.sqrt(
            Math.pow(empty.x + empty.size / 2 - vocab.x - vocab.size / 2, 2) +
              Math.pow(empty.y + empty.size / 2 - vocab.y - vocab.size / 2, 2),
          );
          if (dist < (empty.size + vocab.size) * 0.35) {
            empty.pop();
          }
        }
      }
    };

    const interval = setInterval(checkCollisions, 500);
    return () => clearInterval(interval);
  }, []);

  // สัตว์ทะเล
  const whaleSize = Math.min(sw * 0.4, 320);
  const jellyBigSize = Math.min(sw * 0.13, 150);
  const jellyMedSize = Math.min(sw * 0.1, 120);
  const jellySmSize = Math.min(sw * 0.08, 95);
  const crabSize = Math.min(sw * 0.09, 100);

  const creatures = [
    {
      source: WHALE,
      x: sw * 0.5,
      y: sh * -0.1, //**ความห่างหน้าจอของวาฬ
      size: whaleSize,
      floatAmount: 10,
      floatDuration: 3000,
    },
    {
      source: JELLY1,
      x: sw * 0.33,
      y: sh * 0.05,
      size: jellyBigSize,
      floatAmount: 12,
      floatDuration: 2500,
    },
    {
      source: JELLY2,
      x: sw * 0.42,
      y: sh * 0.18,
      size: jellyMedSize,
      floatAmount: 10,
      floatDuration: 2800,
    },
    {
      source: JELLY3,
      x: sw * 0.28,
      y: sh * 0.18,
      size: jellySmSize,
      floatAmount: 8,
      floatDuration: 2200,
    },
    {
      source: CRAB,
      x: sw * 0.58,
      y: sh * 0.68,
      size: crabSize,
      floatAmount: 2,
      floatDuration: 1500,
    },
  ];

  const handleVocabPop = useCallback(
    (vocab: (typeof VOCAB_BUBBLES)[0]) => {
      playBubblePop();
      if (!vocab.hasGame) {
        router.push({ pathname: "/vocab-placeholder", params: { word: vocab.word, id: String(vocab.id) } });
        return;
      }
      // ทุกเกมใช้ /games/[id] route เดียวกัน
      router.push({ pathname: `/games/${vocab.id}` as any });
    },
    [router],
  );

  const handleMyBubble = useCallback(() => {
    playBubblePop();
    router.push("/mybubble");
  }, [router]);

  return (
    <GestureHandlerRootView style={homeStyles.container}>
      <ImageBackground
        source={BG_HOME}
        style={homeStyles.background}
        resizeMode="cover"
      >
        {/* ===== สัตว์ทะเล — อยู่ด้านหลัง bubble (zIndex ต่ำ) ===== */}
        {creatures.map((c, i) => (
          <SeaCreature
            key={`creature-${i}`}
            source={c.source}
            initialX={c.x}
            initialY={c.y}
            size={c.size}
            index={i}
            floatAmount={c.floatAmount}
            floatDuration={c.floatDuration}
          />
        ))}

        {/* ===== Bubble ว่าง (20 ลูก กระจายทั่วจอ) ===== */}
        {Array.from({ length: EMPTY_COUNT }).map((_, i) => (
          <VocabBubble
            key={`empty-${i}`}
            source={EMPTY_BUBBLES[i % EMPTY_BUBBLES.length]}
            screenW={sw}
            screenH={sh}
            index={i}
            isVocab={false}
            isLocked={false}
            onPlaySound={(t) => playSound(t)}
            minSize={sw * 0.03}
            maxSize={sw * 0.12}
            bubbleRef={
              emptyBubbleRefs.current[
                i
              ] as React.MutableRefObject<BubbleInfo | null>
            }
          />
        ))}

        {/* ===== Vocabulary Bubbles — ซ่อนคำที่ชนะแล้ว ===== */}
        {VOCAB_BUBBLES.filter((vocab) => !isCompleted(vocab.id)).map(
          (vocab, i) => (
            <VocabBubble
              key={`vocab-${vocab.id}`}
              source={vocab.image}
              screenW={sw}
              screenH={sh}
              index={i + EMPTY_COUNT}
              isVocab={true}
              isLocked={vocab.locked}
              onPop={() => handleVocabPop(vocab)}
              onPlaySound={(t) => playSound(t)}
              minSize={sw * 0.11}
              maxSize={sw * 0.18}
              bubbleRef={
                vocabBubbleRefs.current[
                  i
                ] as React.MutableRefObject<BubbleInfo | null>
              }
            />
          ),
        )}

        {/* ===== My Bubble — มุมขวาบน (zIndex สูงสุด) ===== */}
        <Pressable style={homeStyles.myBubbleBtn} onPress={handleMyBubble}>
          <Text style={{ fontSize: 18 }}>🫧</Text>
          <Text style={homeStyles.myBubbleText}>My Bubble</Text>
          <Text style={homeStyles.myBubbleCount}>{totalCompleted}</Text>
        </Pressable>
      </ImageBackground>
    </GestureHandlerRootView>
  );
}

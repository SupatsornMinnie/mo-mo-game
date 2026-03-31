# MoMo Alphabet — Claude Code Guide

เกมสอนคำศัพท์ภาษาอังกฤษสำหรับเด็ก (React Native / Expo SDK 54)

---

## Stack

- **Expo SDK 54**, React 19, TypeScript
- **expo-router** (file-based routing)
- **react-native-reanimated ~4.1.1** — animation ทั้งหมด
- **react-native-gesture-handler ~2.28.0** — drag & drop
- **expo-av** — เสียง BGM / SFX
- **expo-image** — รูปภาพ (ดีกว่า Image ของ RN)
- **AsyncStorage** — เก็บ progress, hearts, hints

---

## โครงสร้างไฟล์

```
app/
  _layout.tsx          — root layout, preloadBubblePop() ที่นี่
  index.tsx            — splash / intro screen
  home.tsx             — หน้าหลัก (ฟองคำศัพท์ทั้งหมด)
  mybubble.tsx         — คำที่เล่นสำเร็จแล้ว
  vocab-placeholder.tsx — คำที่ยังไม่มีเกม
  games/[id].tsx       — router เกม (dispatch ตาม gameType)

components/
  BackButton.tsx
  SeaCreature.tsx       — mascot ปลาโลมา/วาฬบนหน้า Home
  VocabBubble.tsx       — ฟองคำศัพท์แต่ละใบ

  game/
    GameScreen.tsx      — shared engine สำหรับทุกเกม
    DraggableLetter.tsx — ตัวอักษรลากได้
    LetterSlot.tsx      — ช่องวางตัวอักษร
    CelebrationOverlay.tsx
    GameOverlay.tsx     — victory / timeup / nohearts
    TimerBar.tsx
    HintButton.tsx
    HeartDisplay.tsx
    CountdownNumber.tsx

    AppleDrop.tsx       — intro animation (Apple game)
    WormCharacter.tsx   — thief character (Apple game)
    SugarRoll.tsx       — intro animation (Ant game)
    AntCharacter.tsx    — marching ants + draggable sugar (Ant game)

    templates/
      AppleGame.tsx     — config สำหรับ GameScreen (Apple)
      AntGame.tsx       — config สำหรับ GameScreen (Ant)

hooks/
  useAssetPreloader.ts  — preload รูป/เสียงทั้งหมด
  useGameSounds.ts      — BGM + SFX
  useGameTimer.ts       — countdown timer
  useHearts.ts          — ระบบชีวิต (AsyncStorage)
  useHints.ts           — ระบบ hint
  useVocabProgress.ts   — บันทึกคำที่เล่นสำเร็จ

utils/
  vocabConfig.ts        — VOCAB_LIST (เพิ่มคำใหม่ตรงนี้)
  gameConfig.ts         — constants, LETTER_IMAGES, SFX_SOUNDS, GAME_IMAGES
  antConfig.ts          — ANT_IMAGES, ANT_LETTERS
  playBubblePop.ts      — preloaded bubble-pop sound utility
  storage.ts            — AsyncStorage helpers

styles/
  home.styles.ts
  game.styles.ts
  splash.styles.ts
```

---

## Game Architecture

### Template Pattern
ทุกเกมใช้ **GameScreen** เป็น engine กลาง รับ `GameConfig` object:

```ts
// games/[id].tsx
if (vocab.gameType === 'apple') return <AppleGame vocab={vocab} />;
if (vocab.gameType === 'ant')   return <AntGame vocab={vocab} />;
```

```ts
// GameConfig interface (GameScreen.tsx)
{
  id, word, letters, bgImage,
  renderIntro: (props) => <XxxDrop ... />,   // intro animation
  returnPiece: { pieceImage, completedImage, thiefImage, thiefSize, thiefAutoNavigates },
  renderThief: (props) => <XxxCharacter ... />, // playing phase
  celebrationImage,
  celebrationLetterKeys,
}
```

### Game Phases
`loading → intro → playing → celebration → victory`
(หรือ `timeup` / `nohearts`)

### เพิ่มเกมใหม่
1. สร้าง `components/game/templates/XxxGame.tsx`
2. สร้าง intro component (`XxxDrop.tsx`) + thief component (`XxxCharacter.tsx`)
3. เพิ่ม `gameType` ใน `vocabConfig.ts`
4. เพิ่ม dispatch ใน `games/[id].tsx`
5. เพิ่ม vocab entry ใน `VOCAB_LIST`

---

## เพิ่มคำศัพท์ใหม่

แก้ไขที่ `utils/vocabConfig.ts`:
```ts
{
  id: 3,
  word: 'Ball',
  card:     require('../assets/vocabulary/3ball/ball_card.webp'),
  bubble:   require('../assets/vocabulary/3ball/bubble_ball.webp'),
  route:    '/games/3',
  gameType: 'apple', // หรือ 'ant' หรือ gameType ใหม่
}
```

---

## Conventions

- **useAnimatedStyle ห้ามอยู่ใน `.map()`** — ให้แยกเป็น component ย่อยเสมอ (React Compiler enabled)
- **Hooks ใน loop ห้ามทำ** — ใช้ `useSharedValue` array แทน
- รูปทุกไฟล์ใช้ `.webp` (ยกเว้นบางไฟล์เก่าที่เป็น `.png`)
- BGM/SFX ทั้งหมดอยู่ใน `assets/sounds/`
- ตัวอักษรซ้ำใน 1 คำ ใช้ suffix ตัวเลข เช่น `P` และ `P2` สำหรับ APPLE
- `playBubblePop()` ใส่ทุก button press

---

## Key Constants (gameConfig.ts)

```ts
GAME_DURATION = 30        // วินาที
SNAP_THRESHOLD = 70       // px — ระยะ snap ตัวอักษรเข้าช่อง
HINT_FREE_COUNT = 3
MAX_HEARTS = 5
HEART_REGEN_MS = 0.5 * 60 * 1000  // แก้ 0.5 → 15 สำหรับ 15 นาที/หัวใจ
```

---

## Assets

```
assets/
  alphabet/A–Z/       — รูปตัวอักษร A.webp (บาง letter มี sprite_x1-4.webp)
  sounds/a-z/         — เสียงตัวอักษร A.mp3 – Z.mp3
  sounds/words/       — เสียงคำศัพท์ apple.mp3, ant.mp3 ...
  sounds/sfx/         — bang.wav, correct.wav, wrong.wav, fall.wav, win.wav, lose.wav, bubble-pop.wav
  sounds/bgm/         — เพลงพื้นหลัง
  bubble/             — bubble_1–8.webp (ใช้สุ่มใน VocabBubble)
  character/          — mascot (Alba = ปลาโลมา, Ayane = วาฬ)
  vocabulary/
    1apple/           — apple.webp, apple_bitten.webp, worm.webp, bg.webp ...
    2ant/             — sugar.webp, sugar_break1.webp, sugar_break2.webp,
                        ant_1.webp, sprite_ant1–4.webp, bg_ant.jpg ...
```

---

## Ant Game Flow

**Intro (SugarRoll.tsx):**
1. ก้อนน้ำตาลตกจากบน → กระทบ → sprite crack (4 frames) → sugar_break1 ค้าง
2. sugar_break2 โผล่ที่ตำแหน่งเดียวกัน
3. มดโผล่จากล่าง → เดินไปหาน้ำตาล → หยิบ sugar_break2 (ย่อลง 35%)
4. มดแบก sugar_break2 เดินกลับไปที่ `antFinalX/Y` (sw*0.65, sh*0.6)
5. `onIntroComplete()` → phase = playing

**Playing (AntCharacter.tsx):**
- มด 5 ตัวเดินแถวจากขวาไปซ้าย วนลูป (marchOffset shared value)
- มดตัวที่ 1 มี sugar_break2 บนหัว (ลากได้)
- ผู้เล่นลาก sugar_break2 ไปวางที่ sugar_break1 (pieceTargetX/Y = sw*0.5, sh*0.25)
- snap ระยะ < sugarSize * 0.6 → เรียก onReturnSugar()

---

## Apple Game Flow

**Intro (AppleDrop.tsx):**
1. แอปเปิ้ลตกจากบน → กระทบ → ตัวอักษร APPLE กระเด็น
2. `onIntroComplete()` → phase = playing

**Playing (WormCharacter.tsx):**
- หนอนมองหา apple_bitten piece (thiefAutoNavigates = true)
- ผู้เล่นลาก apple_bitten → หนอนเดินหา → snap → เรียก onReturnPiece()

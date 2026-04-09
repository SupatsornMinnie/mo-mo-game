// ===== Game Constants =====
export const GAME_DURATION = 30; // seconds
export const HINT_FREE_COUNT = 3;
export const HINT_AD_MAX = 6;
export const INTRO_DURATION = 3000; // ms
export const SNAP_THRESHOLD = 70; // px — how close to slot to count as correct

// ===== Heart / Life System =====
export const MAX_HEARTS = 5;
export const HEART_REGEN_MS = 0.5 * 60 * 1000; // 5 นาทีต่อ 1 หัวใจ อยากได้ 15 นาที แก้ 0.5 เป็น 15

// ===== Word Data =====
export interface LetterData {
  char: string;
  index: number;
}

export const APPLE_LETTERS: LetterData[] = [
  { char: "A", index: 0 },
  { char: "P", index: 1 },
  { char: "P2", index: 2 },
  { char: "L", index: 3 },
  { char: "E", index: 4 },
];

export const ACTOR_LETTERS: LetterData[] = [
  { char: "A", index: 0 },
  { char: "C", index: 1 },
  { char: "T", index: 2 },
  { char: "O", index: 3 },
  { char: "R", index: 4 },
];

// ===== Asset Maps (all from vocabulary/1apple/) =====
export const LETTER_IMAGES: Record<string, any> = {
  A: require("../assets/alphabet/A/A.webp"),
  B: require("../assets/alphabet/B/B.webp"),
  C: require("../assets/alphabet/C/C.webp"),
  D: require("../assets/alphabet/D/D.webp"),
  E: require("../assets/alphabet/E/E.webp"),
  F: require("../assets/alphabet/F/F.webp"),
  H: require("../assets/alphabet/H/H.webp"),
  I: require("../assets/alphabet/I/I.webp"),
  J: require("../assets/alphabet/J/J.webp"),
  K: require("../assets/alphabet/K/K.webp"),
  L: require("../assets/alphabet/L/L.webp"),
  M: require("../assets/alphabet/M/M.webp"),
  N: require("../assets/alphabet/N/N.webp"),
  O: require("../assets/alphabet/O/O.webp"),
  P: require("../assets/alphabet/P/P.webp"),
  P2: require("../assets/alphabet/P/P2.webp"),
  Q: require("../assets/alphabet/Q/Q.webp"),
  R: require("../assets/alphabet/R/R.webp"),
  S: require("../assets/alphabet/S/S.webp"),
  T: require("../assets/alphabet/T/T.webp"),
  U: require("../assets/alphabet/U/U.webp"),
  V: require("../assets/alphabet/V/V.webp"),
  W: require("../assets/alphabet/W/W.webp"),
  X: require("../assets/alphabet/X/X.webp"),
  Y: require("../assets/alphabet/Y/Y.webp"),
  Z: require("../assets/alphabet/Z/Z.webp"),
};

export const LETTER_SOUNDS: Record<string, any> = {
  A: require("../assets/sounds/a-z/A.mp3"),
  B: require("../assets/sounds/a-z/B.mp3"),
  C: require("../assets/sounds/a-z/C.mp3"),
  D: require("../assets/sounds/a-z/D.mp3"),
  E: require("../assets/sounds/a-z/E.mp3"),
  F: require("../assets/sounds/a-z/F.mp3"),
  G: require("../assets/sounds/a-z/G.mp3"),
  H: require("../assets/sounds/a-z/H.mp3"),
  I: require("../assets/sounds/a-z/I.mp3"),
  J: require("../assets/sounds/a-z/J.mp3"),
  K: require("../assets/sounds/a-z/K.mp3"),
  L: require("../assets/sounds/a-z/L.mp3"),
  M: require("../assets/sounds/a-z/M.mp3"),
  N: require("../assets/sounds/a-z/N.mp3"),
  O: require("../assets/sounds/a-z/O.mp3"),
  P: require("../assets/sounds/a-z/P.mp3"),
  P2: require("../assets/sounds/a-z/P.mp3"),
  Q: require("../assets/sounds/a-z/Q.mp3"),
  R: require("../assets/sounds/a-z/R.mp3"),
  S: require("../assets/sounds/a-z/S.mp3"),
  T: require("../assets/sounds/a-z/T.mp3"),
  U: require("../assets/sounds/a-z/U.mp3"),
  V: require("../assets/sounds/a-z/V.mp3"),
  W: require("../assets/sounds/a-z/W.mp3"),
  X: require("../assets/sounds/a-z/X.mp3"),
  Y: require("../assets/sounds/a-z/Y.mp3"),
  Z: require("../assets/sounds/a-z/Z.mp3"),
};

export const WORD_SOUND = require("../assets/sounds/Apple.mp3");

export const GAME_IMAGES = {
  apple: require("../assets/vocabulary/1apple/apple.webp"),
  appleBitten: require("../assets/vocabulary/1apple/apple_bitten.webp"),
  applePiece: require("../assets/vocabulary/1apple/apple_bitten2.webp"),
  worm: require("../assets/vocabulary/1apple/worm.webp"),
  wormRun: require("../assets/vocabulary/1apple/worm_run.webp"),
  bg: require("../assets/vocabulary/1apple/bg.webp"),
  hint: require("../assets/vocabulary/1apple/hint.webp"),
  hint1: require("../assets/vocabulary/1apple/hint1.webp"),
  hint2: require("../assets/vocabulary/1apple/hint2.webp"),
  hint3: require("../assets/vocabulary/1apple/hint3.webp"),
  letters: LETTER_IMAGES,
  heart: require("../assets/images/life.png"),
};

export const SFX_SOUNDS = {
  correct: require("../assets/sounds/correct.mp3"),
  wrong: require("../assets/sounds/wrong.mp3"),
  fall: require("../assets/sounds/fall.mp3"),
  bang: require("../assets/sounds/jump.mp3"),
  pop: require("../assets/sounds/bubble_break.wav"),
  bgm: require("../assets/sounds/happy-music-loop.mp3"),
  clockBeep: require("../assets/sounds/clock_beep.wav"),
  win: require("../assets/sounds/win.wav"),
  lose: require("../assets/sounds/lose.mp3"),
  bubblePop: require("../assets/sounds/bubble-pop.wav"),
};

// ===== Position Helpers =====

/** Calculate center-aligned slot positions for the word letters */
export function calculateSlotPositions(sw: number, sh: number, letterCount: number = APPLE_LETTERS.length) {
  const slotSize = Math.min(sw * 0.2, sh * 0.3, 130);
  const gap = slotSize * -0.15; //**ระยะห่างระหว่างตัวอักษร ยิ่งติดลบยิ่งชิด
  const totalWidth = letterCount * slotSize + (letterCount - 1) * gap;
  const startX = (sw - totalWidth) / 2;
  const centerY = sh * 0.42;

  return Array.from({ length: letterCount }).map((_, i) => ({
    x: startX + i * (slotSize + gap),
    y: centerY,
    size: slotSize,
  }));
}

/** Generate random scattered positions + rotation */
export function generateScatterPositions(sw: number, sh: number, letterCount: number = APPLE_LETTERS.length) {
  const actualSize = Math.min(sw * 0.16, sh * 0.22, 110);

  const mL = 20;
  const mR = 20;
  const mT = 50; // เว้น timer bar
  const mB = 20;

  const safeW = sw - mL - mR - actualSize;
  const safeH = sh - mT - mB - actualSize;

  const cols = letterCount;
  const zoneW = safeW / cols;

  const positions: { x: number; y: number; rotation: number }[] = [];

  for (let i = 0; i < cols; i++) {
    let x: number, y: number;
    let tries = 0;

    do {
      // X — แต่ละตัวอยู่ในคอลัมน์ของตัวเอง
      x = mL + i * zoneW + Math.random() * (zoneW * 0.85);

      // Y — สลับบน/ล่างเพื่อกระจาย
      if (i % 2 === 0) {
        y = mT + Math.random() * (safeH * 0.45); // บน
      } else {
        y = mT + safeH * 0.55 + Math.random() * (safeH * 0.45); // ล่าง
      }
      tries++;
    } while (
      tries < 20 &&
      positions.some(
        (p) =>
          Math.abs(p.x - x) < actualSize * 0.85 &&
          Math.abs(p.y - y) < actualSize * 0.85,
      )
    );

    // Clamp เข้มงวด — ห้ามล้นขอบเลย
    x = Math.max(mL, Math.min(x, sw - mR - actualSize));
    y = Math.max(mT, Math.min(y, sh - mB - actualSize));

    const rotation = Math.random() * 360 - 180;
    positions.push({ x, y, rotation });
  }
  return positions;
}

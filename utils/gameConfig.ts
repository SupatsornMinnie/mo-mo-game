// ===== Game Constants =====
export const GAME_DURATION = 30; // seconds
export const HINT_FREE_COUNT = 3;
export const HINT_AD_MAX = 5;
export const INTRO_DURATION = 3000; // ms
export const SNAP_THRESHOLD = 40; // px — how close to slot to count as correct

// ===== Word Data =====
export interface LetterData {
  char: string;
  index: number;
}

export const APPLE_LETTERS: LetterData[] = [
  { char: 'A', index: 0 },
  { char: 'P', index: 1 },
  { char: 'P2', index: 2 },
  { char: 'L', index: 3 },
  { char: 'E', index: 4 },
];

// ===== Asset Maps (all from vocabulary/1apple/) =====
export const LETTER_IMAGES: Record<string, any> = {
  A: require('../assets/alphabet/A/A.webp'),
  P: require('../assets/alphabet/P/P.webp'),
  P2: require('../assets/alphabet/P/P2.webp'),
  L: require('../assets/alphabet/L/L.webp'),
  E: require('../assets/alphabet/E/E.webp'),
};

export const LETTER_SOUNDS: Record<string, any> = {
  A: require('../assets/sounds/A.mp3'),
  P: require('../assets/sounds/P.mp3'),
  P2: require('../assets/sounds/P.mp3'), // same sound as P
  L: require('../assets/sounds/L.mp3'),
  E: require('../assets/sounds/E.mp3'),
};

export const WORD_SOUND = require('../assets/sounds/Apple.mp3');

export const GAME_IMAGES = {
  apple: require('../assets/vocabulary/1apple/apple.webp'),
  appleBitten: require('../assets/vocabulary/1apple/apple_bitten.webp'),
  applePiece: require('../assets/vocabulary/1apple/apple_bitten2.png'), // เล็กอยู่แล้ว (2KB)
  worm: require('../assets/vocabulary/1apple/worm.webp'),
  wormRun: require('../assets/vocabulary/1apple/worm_run.webp'),
  bg: require('../assets/vocabulary/1apple/bg.webp'),
  hint: require('../assets/vocabulary/1apple/hint.webp'),
  hint1: require('../assets/vocabulary/1apple/hint1.webp'),
  hint2: require('../assets/vocabulary/1apple/hint2.webp'),
  hint3: require('../assets/vocabulary/1apple/hint3.webp'),
};

export const SFX_SOUNDS = {
  correct: require('../assets/sounds/bubble_lock.wav'),   // ใช้แทนไปก่อน
  wrong: require('../assets/sounds/bubble-bounce.wav'),    // ใช้แทนไปก่อน
  pop: require('../assets/sounds/bubble_break.wav'),
};

// ===== Position Helpers =====

/** Calculate center-aligned slot positions for the word letters */
export function calculateSlotPositions(sw: number, sh: number) {
  const letterCount = APPLE_LETTERS.length;
  const slotSize = Math.min(sw * 0.18, sh * 0.25, 110);
  const gap = slotSize * 0.25;
  const totalWidth = letterCount * slotSize + (letterCount - 1) * gap;
  const startX = (sw - totalWidth) / 2;
  const centerY = sh * 0.62;

  return APPLE_LETTERS.map((_, i) => ({
    x: startX + i * (slotSize + gap),
    y: centerY,
    size: slotSize,
  }));
}

/** Generate random scattered positions avoiding edges and slot area */
export function generateScatterPositions(sw: number, sh: number) {
  const slotSize = Math.min(sw * 0.08, sh * 0.18, 70);
  const margin = slotSize;
  const positions: { x: number; y: number }[] = [];

  for (let i = 0; i < APPLE_LETTERS.length; i++) {
    let x: number, y: number;
    let tries = 0;
    do {
      x = margin + Math.random() * (sw - 2 * margin - slotSize);
      // กระจายทั่วจอ แต่หลีก slot area (sh*0.55-0.72) และ apple area (sh*0.10-0.40)
      const zone = Math.random();
      if (zone < 0.4) {
        y = sh * 0.08 + Math.random() * (sh * 0.30); // ส่วนบน (ใต้ timer)
      } else {
        y = sh * 0.75 + Math.random() * (sh * 0.18); // ส่วนล่างสุด
      }
      tries++;
    } while (
      tries < 20 &&
      positions.some(
        (p) => Math.abs(p.x - x) < slotSize * 1.8 && Math.abs(p.y - y) < slotSize * 1.8
      )
    );
    positions.push({ x, y });
  }
  return positions;
}

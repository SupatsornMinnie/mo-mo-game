// ===== Game Constants =====
export const GAME_DURATION = 10; // seพrrconds
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
  A: require('../assets/sounds/a-z/A.mp3'),
  P: require('../assets/sounds/a-z/P.mp3'),
  P2: require('../assets/sounds/a-z/P.mp3'),
  L: require('../assets/sounds/a-z/L.mp3'),
  E: require('../assets/sounds/a-z/E.mp3'),
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
  letters: LETTER_IMAGES,
};

export const SFX_SOUNDS = {
  correct: require('../assets/sounds/correct.mp3'),
  wrong: require('../assets/sounds/wrong.mp3'),
  fall: require('../assets/sounds/fall.mp3'),
  bang: require('../assets/sounds/jump.mp3'),
  pop: require('../assets/sounds/bubble_break.wav'),
  bgm: require('../assets/sounds/happy-music-loop.mp3'),
  clockBeep: require('../assets/sounds/clock_beep.wav'),
  win: require('../assets/sounds/win.wav'),
  lose: require('../assets/sounds/lose.mp3'),
};

// ===== Position Helpers =====

/** Calculate center-aligned slot positions for the word letters */
export function calculateSlotPositions(sw: number, sh: number) {
  const letterCount = APPLE_LETTERS.length;
  const slotSize = Math.min(sw * 0.2, sh * 0.3, 130);
  const gap = slotSize * 0.2;
  const totalWidth = letterCount * slotSize + (letterCount - 1) * gap;
  const startX = (sw - totalWidth) / 2;
  const centerY = sh * 0.42; // ขยับขึ้น 20%

  return APPLE_LETTERS.map((_, i) => ({
    x: startX + i * (slotSize + gap),
    y: centerY,
    size: slotSize,
  }));
}

/** Generate random scattered positions + rotation */
export function generateScatterPositions(sw: number, sh: number) {
  const actualSize = Math.min(sw * 0.2, sh * 0.3, 130);
  // margin ต้องมากพอ: ตัวอักษร position คือ top-left ของกล่อง
  // ดังนั้นต้อง margin อย่างน้อย = actualSize เพื่อไม่ให้ตกขอบขวา/ล่าง
  const marginLeft = actualSize * 0.5;
  const marginRight = actualSize * 1.5; // ตัวอักษรมีขนาด → ต้องเว้นมากกว่า
  const marginTop = actualSize * 0.3;
  const marginBottom = actualSize * 1.3;
  const positions: { x: number; y: number; rotation: number }[] = [];

  // แบ่งพื้นที่จอเป็น zone ให้กระจายทั่ว ไม่กองกัน
  const cols = 3;
  const rows = 2;
  const zoneW = (sw - marginLeft - marginRight) / cols;
  const zoneH = (sh - marginTop - marginBottom) / rows;

  for (let i = 0; i < APPLE_LETTERS.length; i++) {
    let x: number, y: number;
    let tries = 0;

    // กระจายตาม zone เพื่อไม่ให้กองกัน
    const col = i % cols;
    const row = Math.floor(i / cols) % rows;

    do {
      x = marginLeft + col * zoneW + Math.random() * (zoneW * 0.7);
      y = marginTop + row * zoneH + Math.random() * (zoneH * 0.7);
      tries++;
    } while (
      tries < 30 &&
      positions.some(
        (p) => Math.abs(p.x - x) < actualSize * 1.3 && Math.abs(p.y - y) < actualSize * 1.3
      )
    );

    // Clamp ให้อยู่ในจออย่างแน่นอน
    x = Math.max(marginLeft, Math.min(x, sw - marginRight));
    y = Math.max(marginTop, Math.min(y, sh - marginBottom));

    const rotation = Math.random() * 360 - 180; // สุ่ม 360 องศา
    positions.push({ x, y, rotation });
  }
  return positions;
}

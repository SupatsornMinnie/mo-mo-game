// ===== Vocabulary Config =====
// เพิ่มคำศัพท์ตรงนี้ได้เรื่อยๆ รองรับได้หลายพันคำ

export type GameType = 'apple' | 'ant' | 'actor' | 'letter-drag';

export interface VocabItem {
  id: number;
  word: string;
  card: any;         // รูปการ์ดสำหรับ My Bubble
  bubble: any;       // รูปฟองสำหรับหน้า Home
  route: string;     // route ของเกมคำนี้
  gameType: GameType;
}

export const VOCAB_LIST: VocabItem[] = [
  {
    id: 1,
    word: 'Apple',
    card:     require('../assets/vocabulary/1apple/apple_card.png'),
    bubble:   require('../assets/vocabulary/1apple/bubble_apple.webp'),
    route:    '/games/1',
    gameType: 'apple',
  },
  {
    id: 2,
    word: 'Ant',
    card:     require('../assets/vocabulary/2ant/ant.webp'),
    bubble:   require('../assets/vocabulary/2ant/bubble_ant.webp'),
    route:    '/games/2',
    gameType: 'ant',
  },
  {
    id: 3,
    word: 'Actor',
    card:     require('../assets/vocabulary/3actor/actor.webp'),
    bubble:   require('../assets/vocabulary/3actor/bubble_actor.webp'),
    route:    '/games/3',
    gameType: 'actor',
  },
  // ===== เพิ่มคำต่อไปตรงนี้ =====
];

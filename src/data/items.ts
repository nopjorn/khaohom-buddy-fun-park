export const COUNT_ITEMS = ['🍎', '🍌', '🍓', '🐟', '🐥', '⭐', '🎈', '🚗', '🌸', '🍪', '🐶', '🐱'];

/** แต่ละชุดใช้สร้างแบบรูปหนึ่งโจทย์ เพื่อให้ของในโจทย์เป็นหมวดเดียวกัน */
export const PATTERN_SETS = [
  ['🔴', '🔵', '🟡', '🟢', '🟣', '🟠'],
  ['⭐', '🌙', '☀️', '🌈', '☁️', '⚡'],
  ['🍎', '🍌', '🍇', '🍓', '🍊', '🍉'],
  ['🐶', '🐱', '🐰', '🐸', '🐷', '🐵'],
];

export const MEMORY_ITEMS = [
  '🐶', '🐱', '🐰', '🐸', '🐷', '🐵', '🦁', '🐼', '🍎', '🍌',
  '🍓', '🍉', '🚗', '🚀', '⚽', '🎈', '🌈', '⭐', '🌸', '🐟',
];

export interface StickerSet {
  id: string;
  icon: string;
  name: string;
  stickers: string[];
  /** ภาพประจำตัวที่ปลดล็อกเมื่อสะสมครบชุด */
  unlocks: string[];
}

export const STICKER_SETS: StickerSet[] = [
  { id: 'land', icon: '🐾', name: 'สัตว์บก', stickers: ['🦄', '🐼', '🦊', '🦖', '🦁', '🐢'], unlocks: ['🦒', '🦘'] },
  { id: 'sea', icon: '🌊', name: 'น้ำและฟ้า', stickers: ['🐸', '🐙', '🐳', '🦋', '🐝', '🐧'], unlocks: ['🦭', '🦩'] },
  { id: 'party', icon: '🎉', name: 'ปาร์ตี้', stickers: ['🎈', '🎁', '🍦', '🍭', '🧸', '🎠'], unlocks: ['🤖', '👾'] },
  { id: 'magic', icon: '✨', name: 'ของวิเศษ', stickers: ['🚀', '🌈', '🌟', '🪐', '🏆', '👑'], unlocks: ['🧚', '🐲'] },
];

/** สติกเกอร์ที่ได้จากการเล่นจบเกม */
export const STICKERS = STICKER_SETS.flatMap((s) => s.stickers);

/** สติกเกอร์รางวัลพิเศษ ได้จากภารกิจประจำวันและการเล่นต่อเนื่องเท่านั้น */
export const SPECIAL_STICKERS = ['🥇', '🏅', '🎖️', '💎', '🔮', '🎀', '🪅', '🌻', '🍀', '🦚'];

export interface EnglishWord {
  letter: string;
  word: string;
  emoji: string;
}

/** จำนวนคำแรกในรายการที่ใช้กับระดับเริ่มต้น */
export const ENGLISH_EASY_COUNT = 10;

/** ตัวอักษรละหนึ่งคำ (ไม่มี X เพราะไม่มี emoji ที่เหมาะ) เรียงคำง่ายไว้ก่อน */
export const ENGLISH_WORDS: EnglishWord[] = [
  { letter: 'A', word: 'Apple', emoji: '🍎' },
  { letter: 'B', word: 'Ball', emoji: '⚽' },
  { letter: 'C', word: 'Cat', emoji: '🐱' },
  { letter: 'D', word: 'Dog', emoji: '🐶' },
  { letter: 'E', word: 'Egg', emoji: '🥚' },
  { letter: 'F', word: 'Fish', emoji: '🐟' },
  { letter: 'H', word: 'Hat', emoji: '🎩' },
  { letter: 'M', word: 'Moon', emoji: '🌙' },
  { letter: 'P', word: 'Pig', emoji: '🐷' },
  { letter: 'S', word: 'Sun', emoji: '☀️' },
  { letter: 'G', word: 'Grapes', emoji: '🍇' },
  { letter: 'I', word: 'Ice cream', emoji: '🍦' },
  { letter: 'J', word: 'Juice', emoji: '🧃' },
  { letter: 'K', word: 'Key', emoji: '🔑' },
  { letter: 'L', word: 'Lion', emoji: '🦁' },
  { letter: 'N', word: 'Nose', emoji: '👃' },
  { letter: 'O', word: 'Orange', emoji: '🍊' },
  { letter: 'Q', word: 'Queen', emoji: '👸' },
  { letter: 'R', word: 'Rabbit', emoji: '🐰' },
  { letter: 'T', word: 'Tiger', emoji: '🐯' },
  { letter: 'U', word: 'Umbrella', emoji: '☂️' },
  { letter: 'V', word: 'Violin', emoji: '🎻' },
  { letter: 'W', word: 'Whale', emoji: '🐳' },
  { letter: 'Y', word: 'Yo-yo', emoji: '🪀' },
  { letter: 'Z', word: 'Zebra', emoji: '🦓' },
];

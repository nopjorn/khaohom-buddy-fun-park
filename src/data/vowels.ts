export type VowelKey = 'aa' | 'uu' | 'ii' | 'ue' | 'ai';

export interface VowelDef {
  key: VowelKey;
  /** รูปสระที่วางบนวงกลมประ (U+25CC) เพื่อให้เห็นตำแหน่งของพยัญชนะ */
  shown: string;
  name: string;
}

export const VOWELS: VowelDef[] = [
  { key: 'aa', shown: '◌า', name: 'สระอา' },
  { key: 'uu', shown: '◌ู', name: 'สระอู' },
  { key: 'ii', shown: '◌ี', name: 'สระอี' },
  { key: 'ue', shown: '◌ือ', name: 'สระอือ' },
  { key: 'ai', shown: 'ไ◌', name: 'สระไอ' },
];

export interface VowelWord {
  word: string;
  consonant: string;
  vowel: VowelKey;
  emoji: string;
}

/** คำสองพยางค์แรกที่ไม่มีวรรณยุกต์และไม่มีตัวควบกล้ำ เด็กจะประสมเสียงได้ตรง ๆ */
export const VOWEL_WORDS: VowelWord[] = [
  { word: 'ตา', consonant: 'ต', vowel: 'aa', emoji: '👁️' },
  { word: 'งู', consonant: 'ง', vowel: 'uu', emoji: '🐍' },
  { word: 'ขา', consonant: 'ข', vowel: 'aa', emoji: '🦵' },
  { word: 'ปู', consonant: 'ป', vowel: 'uu', emoji: '🦀' },
  { word: 'ไฟ', consonant: 'ฟ', vowel: 'ai', emoji: '🔥' },
  { word: 'ผี', consonant: 'ผ', vowel: 'ii', emoji: '👻' },
  { word: 'หู', consonant: 'ห', vowel: 'uu', emoji: '👂' },
  { word: 'ยา', consonant: 'ย', vowel: 'aa', emoji: '💊' },
  { word: 'มือ', consonant: 'ม', vowel: 'ue', emoji: '🤚' },
  { word: 'ชา', consonant: 'ช', vowel: 'aa', emoji: '🍵' },
  { word: 'นา', consonant: 'น', vowel: 'aa', emoji: '🌾' },
];

/** คำที่ใช้สระเดียวกัน สำหรับโจทย์คำคล้องจองของผู้ปกครอง ไม่ต้องมีภาพ */
export const RHYME_WORDS: Record<VowelKey, string[]> = {
  aa: ['ตา', 'ขา', 'ยา', 'ชา', 'นา', 'กา', 'มา', 'ปา', 'ลา'],
  uu: ['งู', 'ปู', 'หู', 'ดู', 'รู', 'ถู', 'ชู'],
  ii: ['ผี', 'ดี', 'มี', 'ปี', 'ตี', 'สี'],
  ue: ['มือ', 'ถือ', 'คือ', 'หรือ'],
  ai: ['ไฟ', 'ไป', 'ไว', 'ไข'],
};

export const vowelOf = (key: VowelKey): VowelDef => VOWELS.find((v) => v.key === key) ?? VOWELS[0];

/** ส่วนที่แสดงตอนประสมคำ สระไอเขียนไว้หน้าพยัญชนะ */
export function blendParts(w: VowelWord): [string, string] {
  const shown = vowelOf(w.vowel).shown;
  return w.vowel === 'ai' ? [shown, w.consonant] : [w.consonant, shown];
}

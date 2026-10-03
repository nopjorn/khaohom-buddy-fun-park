export interface ThaiLetter {
  letter: string;
  word: string;
  emoji: string;
}

/** จำนวนตัวอักษรแรกในรายการที่ใช้กับระดับเริ่มต้น */
export const THAI_EASY_COUNT = 12;

/** เลือกเฉพาะตัวที่มี emoji สื่อความหมายชัดเจน เรียงตัวที่พบบ่อยไว้ก่อน */
export const THAI_LETTERS: ThaiLetter[] = [
  { letter: 'ก', word: 'ไก่', emoji: '🐔' },
  { letter: 'ข', word: 'ไข่', emoji: '🥚' },
  { letter: 'ง', word: 'งู', emoji: '🐍' },
  { letter: 'จ', word: 'จาน', emoji: '🍽️' },
  { letter: 'ช', word: 'ช้าง', emoji: '🐘' },
  { letter: 'ด', word: 'เด็ก', emoji: '👦' },
  { letter: 'ต', word: 'เต่า', emoji: '🐢' },
  { letter: 'น', word: 'หนู', emoji: '🐭' },
  { letter: 'ป', word: 'ปลา', emoji: '🐟' },
  { letter: 'ม', word: 'ม้า', emoji: '🐴' },
  { letter: 'ล', word: 'ลิง', emoji: '🐵' },
  { letter: 'ส', word: 'เสือ', emoji: '🐯' },
  { letter: 'ค', word: 'ควาย', emoji: '🐃' },
  { letter: 'ซ', word: 'โซ่', emoji: '⛓️' },
  { letter: 'ถ', word: 'ถุง', emoji: '🛍️' },
  { letter: 'ท', word: 'ทหาร', emoji: '💂' },
  { letter: 'ธ', word: 'ธง', emoji: '🚩' },
  { letter: 'บ', word: 'ใบไม้', emoji: '🍃' },
  { letter: 'ผ', word: 'ผึ้ง', emoji: '🐝' },
  { letter: 'ฟ', word: 'ฟัน', emoji: '🦷' },
  { letter: 'ย', word: 'ยักษ์', emoji: '👹' },
  { letter: 'ร', word: 'เรือ', emoji: '⛵' },
  { letter: 'ว', word: 'แหวน', emoji: '💍' },
  { letter: 'ห', word: 'หีบ', emoji: '🧰' },
  { letter: 'อ', word: 'อ่าง', emoji: '🛁' },
  { letter: 'ฮ', word: 'นกฮูก', emoji: '🦉' },
  { letter: 'ญ', word: 'หญิง', emoji: '👩' },
  { letter: 'ฬ', word: 'จุฬา', emoji: '🪁' },
  { letter: 'ฒ', word: 'ผู้เฒ่า', emoji: '👴' },
];

export const ALL_CONSONANTS = Array.from('กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮ');

/** ตัวอักษรที่หน้าตาคล้ายกัน ใช้เป็นตัวลวงในโจทย์ของผู้ปกครอง */
export const THAI_LOOKALIKES: Record<string, string[]> = {
  ก: ['ถ', 'ภ', 'ฎ'],
  ข: ['ฃ', 'ช', 'ซ'],
  ค: ['ฅ', 'ด', 'ต'],
  ง: ['ว', 'ร'],
  จ: ['ฉ', 'ว'],
  ช: ['ซ', 'ข', 'ฃ'],
  ซ: ['ช', 'ข', 'ฃ'],
  ด: ['ค', 'ต', 'ฅ'],
  ต: ['ด', 'ค', 'ฅ'],
  ถ: ['ก', 'ภ'],
  ท: ['ฑ', 'ธ', 'ห'],
  ธ: ['ร', 'ฐ', 'ท'],
  น: ['ม', 'ฉ'],
  บ: ['ป', 'ษ'],
  ป: ['บ', 'ษ'],
  ผ: ['ฝ', 'พ', 'ฟ'],
  ฟ: ['ฝ', 'พ', 'ผ'],
  ม: ['น', 'ฆ'],
  ย: ['ผ', 'ฝ'],
  ร: ['ธ', 'ว'],
  ล: ['ส', 'ศ'],
  ว: ['จ', 'ร', 'ง'],
  ส: ['ล', 'ศ'],
  ห: ['ท', 'ฬ'],
  อ: ['ฮ'],
  ฮ: ['อ'],
  ญ: ['ฌ', 'ณ'],
  ฬ: ['ห', 'พ'],
  ฒ: ['ฌ', 'ณ'],
};

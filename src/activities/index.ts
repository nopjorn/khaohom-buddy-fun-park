import { COLORS, SHAPES, shapeEmoji } from '../data/colors';
import { ENGLISH_WORDS } from '../data/english';
import { VOWEL_WORDS } from '../data/vowels';
import { THAI_LETTERS } from '../data/thai';
import type { ActivityDef, ActivityId, ItemWeight, Question, Rng, ZoneId } from '../types';
import { COMPARE_MAX_LEVEL, generateCompare } from './compare';
import { COUNTING_MAX_LEVEL, generateCounting } from './counting';
import { ENGLISH_MAX_LEVEL, generateEnglish } from './english';
import { MEMORY_MAX_LEVEL, createMemory } from './memory';
import { MONEY_MAX_LEVEL, generateMoney } from './money';
import { PATTERN_MAX_LEVEL, generatePattern } from './pattern';
import { createQuiz } from './quizView';
import { SHAPES_MAX_LEVEL, generateShapes } from './shapes';
import { THAI_MAX_LEVEL, generateThai } from './thaiLetters';
import { VOWELS_MAX_LEVEL, generateVowels } from './vowels';

type Generator = (level: number, rng: Rng, weight?: ItemWeight) => Question;

function quizActivity(id: ActivityId, maxLevel: number, generate: Generator): ActivityDef {
  return {
    id,
    maxLevel,
    generate,
    create: (level, rng, weight) => createQuiz(generate(level, rng, weight)),
  };
}

export const ACTIVITIES: Record<ActivityId, ActivityDef> = {
  counting: quizActivity('counting', COUNTING_MAX_LEVEL, generateCounting),
  // เงินแต่ละระดับฝึกเรื่องเดียว ไม่มีชุดของให้ทวน จึงไม่ใช้น้ำหนัก
  money: quizActivity('money', MONEY_MAX_LEVEL, (level, rng) => generateMoney(level, rng)),
  thai: quizActivity('thai', THAI_MAX_LEVEL, generateThai),
  vowels: quizActivity('vowels', VOWELS_MAX_LEVEL, generateVowels),
  english: quizActivity('english', ENGLISH_MAX_LEVEL, generateEnglish),
  shapes: quizActivity('shapes', SHAPES_MAX_LEVEL, generateShapes),
  compare: quizActivity('compare', COMPARE_MAX_LEVEL, generateCompare),
  // แบบรูปไม่มีชุดของให้ทวน จึงไม่ใช้น้ำหนัก
  pattern: quizActivity('pattern', PATTERN_MAX_LEVEL, (level, rng) => generatePattern(level, rng)),
  memory: {
    id: 'memory',
    maxLevel: MEMORY_MAX_LEVEL,
    create: (level, rng) => createMemory(level, rng),
  },
};

export const ACTIVITY_IDS = Object.keys(ACTIVITIES) as ActivityId[];

export const ACTIVITY_NAMES: Record<ActivityId, string> = {
  counting: '🔢 ตัวเลข',
  money: '🪙 นับเงิน',
  thai: '🐔 ก ไก่',
  vowels: '🔥 ประสมคำ',
  english: '🔤 ABC',
  shapes: '🎨 สีและรูปทรง',
  compare: '📏 ใหญ่เล็ก ซ้ายขวา',
  pattern: '🧩 แบบรูป',
  memory: '🃏 จับคู่ภาพ',
};

export interface ZoneDef {
  id: ZoneId;
  icon: string;
  name: string;
  hint: string;
  activities: ActivityId[];
}

export const ZONES: ZoneDef[] = [
  { id: 'numbers', icon: '🔢', name: 'ตัวเลข', hint: 'นับเลขและนับเงิน', activities: ['counting', 'money'] },
  { id: 'thai', icon: '🐔', name: 'ก ไก่', hint: 'ตัวอักษรและประสมคำ', activities: ['thai', 'vowels'] },
  { id: 'english', icon: '🔤', name: 'ABC', hint: 'ภาษาอังกฤษ', activities: ['english'] },
  { id: 'colors', icon: '🎨', name: 'สีและขนาด', hint: 'สี รูปทรง ใหญ่เล็ก ซ้ายขวา', activities: ['shapes', 'compare'] },
  { id: 'brain', icon: '🧠', name: 'ฝึกสมอง', hint: 'จับคู่ภาพและแบบรูป', activities: ['memory', 'pattern'] },
  {
    id: 'mix',
    icon: '🎲',
    name: 'สุ่มรวม',
    hint: 'ทุกอย่างปนกัน',
    activities: ['counting', 'money', 'thai', 'vowels', 'english', 'shapes', 'compare', 'pattern', 'memory'],
  },
];

export function zoneById(id: ZoneId): ZoneDef {
  return ZONES.find((z) => z.id === id) ?? ZONES[0];
}

/** ข้อความและภาพของสิ่งที่ฝึก (Question.item) สำหรับแสดงในหน้าสรุปของผู้ปกครอง */
export function describeItem(itemId: string): { icon: string; label: string } {
  const [activity, key] = itemId.split(':');
  if (activity === 'thai') {
    const entry = THAI_LETTERS.find((t) => t.letter === key);
    if (entry) return { icon: entry.emoji, label: `${entry.letter} ${entry.word}` };
  }
  if (activity === 'english') {
    const entry = ENGLISH_WORDS.find((w) => w.letter === key);
    if (entry) return { icon: entry.emoji, label: `${entry.letter} ${entry.word}` };
  }
  if (activity === 'counting') {
    if (key === 'compare') return { icon: '⚖️', label: 'เทียบมากน้อย' };
    if (key === 'add') return { icon: '➕', label: 'บวกด้วยภาพ' };
    return { icon: '🔢', label: `นับ ${key}` };
  }
  if (activity === 'pattern') return { icon: '🧩', label: `แบบรูป ระดับ ${key}` };
  if (activity === 'vowels') {
    const entry = VOWEL_WORDS.find((w) => w.word === key);
    if (entry) return { icon: entry.emoji, label: `ประสมคำ ${entry.word}` };
  }
  if (activity === 'shapes') {
    if (key === 'odd') return { icon: '🔍', label: 'หาอันที่ไม่เหมือนเพื่อน' };
    const [first, second] = key.split('-');
    const shape = SHAPES.find((s) => s.key === first);
    const color = COLORS.find((c) => c.key === (second ?? first));
    if (shape && color && second) return { icon: shapeEmoji(shape.key, color.key), label: `${shape.name}${color.name}` };
    if (shape) return { icon: shapeEmoji(shape.key, 'blue'), label: `รูป${shape.name}` };
    if (color) return { icon: shapeEmoji('circle', color.key), label: color.name };
  }
  if (activity === 'compare') {
    const labels: Record<string, [string, string]> = {
      size: ['📏', 'ใหญ่และเล็ก'],
      before: ['⬅️', 'เลขที่มาก่อน'],
      after: ['➡️', 'เลขที่มาหลัง'],
      left: ['👈', 'ซ้ายสุด'],
      middle: ['🎯', 'ตรงกลาง'],
      right: ['👉', 'ขวาสุด'],
    };
    if (labels[key]) return { icon: labels[key][0], label: labels[key][1] };
  }
  if (activity === 'money') {
    const labels: Record<string, string> = {
      '1': 'นับเหรียญบาท',
      '5': 'เหรียญห้ากับเหรียญบาท',
      '10': 'นับเงินทุกเหรียญ',
      most: 'กองไหนเงินมากที่สุด',
    };
    if (labels[key]) return { icon: '🪙', label: labels[key] };
  }
  return { icon: '❔', label: itemId };
}

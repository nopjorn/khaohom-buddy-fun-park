import { ENGLISH_WORDS } from '../data/english';
import { THAI_LETTERS } from '../data/thai';
import type { ActivityDef, ActivityId, ItemWeight, Question, Rng, ZoneId } from '../types';
import { COUNTING_MAX_LEVEL, generateCounting } from './counting';
import { ENGLISH_MAX_LEVEL, generateEnglish } from './english';
import { MEMORY_MAX_LEVEL, createMemory } from './memory';
import { PATTERN_MAX_LEVEL, generatePattern } from './pattern';
import { createQuiz } from './quizView';
import { THAI_MAX_LEVEL, generateThai } from './thaiLetters';

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
  thai: quizActivity('thai', THAI_MAX_LEVEL, generateThai),
  english: quizActivity('english', ENGLISH_MAX_LEVEL, generateEnglish),
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
  thai: '🐔 ก ไก่',
  english: '🔤 ABC',
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
  { id: 'numbers', icon: '🔢', name: 'ตัวเลข', hint: 'นับและบวกเลข', activities: ['counting'] },
  { id: 'thai', icon: '🐔', name: 'ก ไก่', hint: 'ตัวอักษรไทย', activities: ['thai'] },
  { id: 'english', icon: '🔤', name: 'ABC', hint: 'ภาษาอังกฤษ', activities: ['english'] },
  { id: 'brain', icon: '🧠', name: 'ฝึกสมอง', hint: 'จับคู่ภาพและแบบรูป', activities: ['memory', 'pattern'] },
  {
    id: 'mix',
    icon: '🎲',
    name: 'สุ่มรวม',
    hint: 'ทุกอย่างปนกัน',
    activities: ['counting', 'thai', 'english', 'pattern', 'memory'],
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
  return { icon: '❔', label: itemId };
}

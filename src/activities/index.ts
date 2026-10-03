import type { ActivityDef, ActivityId, ZoneId } from '../types';
import { COUNTING_MAX_LEVEL, generateCounting } from './counting';
import { ENGLISH_MAX_LEVEL, generateEnglish } from './english';
import { MEMORY_MAX_LEVEL, createMemory } from './memory';
import { PATTERN_MAX_LEVEL, generatePattern } from './pattern';
import { createQuiz } from './quizView';
import { THAI_MAX_LEVEL, generateThai } from './thaiLetters';

export const ACTIVITIES: Record<ActivityId, ActivityDef> = {
  counting: {
    id: 'counting',
    maxLevel: COUNTING_MAX_LEVEL,
    create: (level, rng) => createQuiz(generateCounting(level, rng)),
  },
  thai: {
    id: 'thai',
    maxLevel: THAI_MAX_LEVEL,
    create: (level, rng) => createQuiz(generateThai(level, rng)),
  },
  english: {
    id: 'english',
    maxLevel: ENGLISH_MAX_LEVEL,
    create: (level, rng) => createQuiz(generateEnglish(level, rng)),
  },
  pattern: {
    id: 'pattern',
    maxLevel: PATTERN_MAX_LEVEL,
    create: (level, rng) => createQuiz(generatePattern(level, rng)),
  },
  memory: {
    id: 'memory',
    maxLevel: MEMORY_MAX_LEVEL,
    create: createMemory,
  },
};

export const ACTIVITY_IDS = Object.keys(ACTIVITIES) as ActivityId[];

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

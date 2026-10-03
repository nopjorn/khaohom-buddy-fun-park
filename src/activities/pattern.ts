import { pick, randInt, sample, shuffle } from '../core/rng';
import { PATTERN_SETS } from '../data/items';
import type { Question, Rng } from '../types';
import { emojiChoice, numberChoices, textChoice, th } from './util';

export const PATTERN_MAX_LEVEL = 4;

/** หน่วยที่วนซ้ำของแต่ละระดับ ตัวอักษรแทนของต่างชนิดกัน */
const UNITS: Record<number, string[]> = {
  1: ['AB'],
  2: ['AAB', 'ABB'],
  3: ['ABC'],
  4: ['AABB', 'ABAC', 'ABCC'],
};

function numberSequence(rng: Rng): Question {
  const step = randInt(rng, 2, 9);
  const up = rng() < 0.7;
  const start = up ? randInt(rng, 1, 12) : randInt(rng, 4 * step + 1, 4 * step + 12);
  const at = (i: number) => start + (up ? i : -i) * step;
  const next = at(4);
  const { values, answer } = numberChoices(next, 6, Math.max(0, next - 10), next + 10, rng);
  return {
    text: 'ตัวต่อไปคือ?',
    visual: { kind: 'sequence', items: [0, 1, 2, 3].map((i) => String(at(i))) },
    say: [],
    choices: values.map((v) => textChoice(String(v))),
    answer,
  };
}

/** ระดับที่สูงกว่า PATTERN_MAX_LEVEL เป็นโจทย์ลำดับตัวเลขของผู้ปกครอง */
export function generatePattern(level: number, rng: Rng): Question {
  if (level > PATTERN_MAX_LEVEL) return numberSequence(rng);

  const unit = pick(rng, UNITS[Math.max(level, 1)]);
  const symbols = sample(rng, pick(rng, PATTERN_SETS), 4);
  const symbolOf = (letter: string) => symbols[letter.charCodeAt(0) - 65];
  const at = (i: number) => symbolOf(unit[i % unit.length]);

  // แสดงอย่างน้อยหนึ่งหน่วยครึ่ง เพื่อให้เห็นว่าแบบรูปวนซ้ำ
  const shown = unit.length + randInt(rng, Math.ceil(unit.length / 2), unit.length);
  const items = Array.from({ length: shown }, (_, i) => at(i));
  const correct = at(shown);

  const used = Array.from(new Set(Array.from(unit, symbolOf)));
  const extras = symbols.filter((s) => !used.includes(s));
  const options = shuffle(rng, [...used, ...extras].slice(0, 3));
  return {
    text: 'อะไรมาต่อ?',
    visual: { kind: 'sequence', items },
    say: [th('อะไรมาต่อนะ')],
    choices: options.map(emojiChoice),
    answer: options.indexOf(correct),
    item: `pattern:${Math.max(level, 1)}`,
  };
}

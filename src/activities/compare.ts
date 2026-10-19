import { pick, randInt, sample, shuffle, weightedPick } from '../core/rng';
import { ROW_ITEMS, SIZE_ITEMS } from '../data/colors';
import type { ItemWeight, Question, Rng } from '../types';
import { emojiChoice, evenWeight, numberChoices, textChoice, th } from './util';

export const COMPARE_MAX_LEVEL = 4;

type Kind = 'size' | 'before' | 'after' | 'left' | 'middle' | 'right';

const SCALES: Record<number, number[]> = {
  3: [0.45, 0.7, 1],
  4: [0.4, 0.6, 0.8, 1],
};

function sizeQuestion(rng: Rng, count: 3 | 4): Question {
  const emoji = pick(rng, SIZE_ITEMS);
  const scales = shuffle(rng, SCALES[count]);
  const biggest = rng() < 0.6;
  const wanted = biggest ? Math.max(...scales) : Math.min(...scales);
  const word = biggest ? 'ใหญ่' : 'เล็ก';
  return {
    text: `อันไหน${word}ที่สุด?`,
    say: [th(`อันไหน${word}ที่สุดนะ`)],
    choices: scales.map((scale) => ({ kind: 'sized', label: emoji, scale })),
    answer: scales.indexOf(wanted),
    item: 'compare:size',
  };
}

function orderQuestion(rng: Rng, kind: 'before' | 'after', max: number): Question {
  const n = kind === 'after' ? randInt(rng, 1, max - 1) : randInt(rng, 2, max);
  const result = kind === 'after' ? n + 1 : n - 1;
  const word = kind === 'after' ? 'หลัง' : 'ก่อน';
  const { values, answer } = numberChoices(result, 3, 1, max, rng);
  return {
    text: `เลขอะไรมา${word} ${n}?`,
    visual: { kind: 'glyph', text: kind === 'after' ? `${n} → ?` : `? → ${n}` },
    say: [th(`เลขอะไรมา${word} ${n} นะ`)],
    choices: values.map((v) => textChoice(String(v))),
    answer,
    item: `compare:${kind}`,
  };
}

const POSITION_WORD: Record<'left' | 'middle' | 'right', string> = {
  left: 'ทางซ้ายสุด',
  middle: 'ตรงกลาง',
  right: 'ทางขวาสุด',
};

function positionQuestion(rng: Rng, kind: 'left' | 'middle' | 'right', count: 3 | 4): Question {
  const items = sample(rng, ROW_ITEMS, count);
  const index = kind === 'left' ? 0 : kind === 'right' ? count - 1 : 1;
  const correct = items[index];
  // ตัวเลือกมาจากของในแถวเดียวกัน ต้องดูตำแหน่งจึงจะตอบถูก
  const choices = shuffle(rng, [correct, ...sample(rng, items.filter((e) => e !== correct), 2)]);
  return {
    text: `ตัวไหนอยู่${POSITION_WORD[kind]}?`,
    visual: { kind: 'row', items },
    say: [th(`ตัวไหนอยู่${POSITION_WORD[kind]}นะ`)],
    choices: choices.map(emojiChoice),
    answer: choices.indexOf(correct),
    item: `compare:${kind}`,
  };
}

function parentNumbers(rng: Rng): Question {
  const tens = randInt(rng, 2, 8);
  const ones = randInt(rng, 1, 9);
  const base = tens * 10 + ones;
  // ตัวลวงสลับหลักหรือใกล้เคียงกัน ต้องดูทั้งสองหลัก
  const pool = new Set<number>([ones * 10 + tens, base + 1, base - 1, base + 10, base - 10, base + 9, base - 9]);
  pool.delete(base);
  const others = sample(rng, [...pool].filter((v) => v >= 10 && v <= 99), 5);
  const values = shuffle(rng, [base, ...others]);
  const most = rng() < 0.5;
  const wanted = most ? Math.max(...values) : Math.min(...values);
  return {
    text: most ? 'จำนวนไหนมากที่สุด?' : 'จำนวนไหนน้อยที่สุด?',
    say: [],
    choices: values.map((v) => textChoice(String(v))),
    answer: values.indexOf(wanted),
  };
}

/**
 * ระดับ 1 ใหญ่เล็ก, ระดับ 2 เลขก่อนหลัง, ระดับ 3 ซ้ายขวา, ระดับ 4 ทุกแบบปนกันและยากขึ้น
 * ระดับที่สูงกว่านั้นเป็นโจทย์เทียบจำนวนสองหลักของผู้ปกครอง
 */
export function generateCompare(level: number, rng: Rng, weight: ItemWeight = evenWeight): Question {
  const w = (k: Kind) => weight(`compare:${k}`);
  if (level <= 1) return sizeQuestion(rng, 3);
  if (level === 2) return orderQuestion(rng, weightedPick(rng, ['before', 'after'] as const, w), 10);
  if (level === 3) return positionQuestion(rng, weightedPick(rng, ['left', 'middle', 'right'] as const, w), 3);
  if (level === 4) {
    const kind = weightedPick(rng, ['size', 'before', 'after', 'left', 'right'] as const, w);
    if (kind === 'size') return sizeQuestion(rng, 4);
    if (kind === 'before' || kind === 'after') return orderQuestion(rng, kind, 20);
    return positionQuestion(rng, kind, 4);
  }
  return parentNumbers(rng);
}

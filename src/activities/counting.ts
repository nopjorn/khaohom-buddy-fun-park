import { pick, randInt, sample } from '../core/rng';
import { COUNT_ITEMS } from '../data/items';
import type { Question, Rng } from '../types';
import { groupChoice, numberChoices, textChoice, th } from './util';

export const COUNTING_MAX_LEVEL = 4;

/**
 * ระดับ 1 นับ 1-5, ระดับ 2 นับถึง 10, ระดับ 3 เทียบมากน้อย, ระดับ 4 บวกด้วยภาพ
 * ระดับที่สูงกว่านั้นเป็นโจทย์บวกลบไม่เกิน 20 ของผู้ปกครอง
 */
export function generateCounting(level: number, rng: Rng): Question {
  const emoji = pick(rng, COUNT_ITEMS);

  if (level <= 2) {
    const max = level <= 1 ? 5 : 10;
    const n = randInt(rng, level <= 1 ? 1 : 3, max);
    const { values, answer } = numberChoices(n, 3, 1, max, rng);
    return {
      text: 'มีกี่อันนะ?',
      visual: { kind: 'groups', groups: [Array<string>(n).fill(emoji)] },
      say: [th('นับดูสิ มีกี่อันนะ')],
      choices: values.map((v) => textChoice(String(v))),
      answer,
    };
  }

  if (level === 3) {
    const counts = sample(rng, [1, 2, 3, 4, 5, 6, 7, 8, 9], 3);
    const most = rng() < 0.7;
    const wanted = most ? Math.max(...counts) : Math.min(...counts);
    return {
      text: most ? 'กลุ่มไหนมากที่สุด?' : 'กลุ่มไหนน้อยที่สุด?',
      say: [th(most ? 'กลุ่มไหนมากที่สุดนะ' : 'กลุ่มไหนน้อยที่สุดนะ')],
      choices: counts.map((c) => groupChoice(emoji, c)),
      answer: counts.indexOf(wanted),
    };
  }

  if (level === 4) {
    const a = randInt(rng, 1, 5);
    const b = randInt(rng, 1, 5);
    const { values, answer } = numberChoices(a + b, 3, 2, 10, rng);
    return {
      text: 'รวมกันได้เท่าไหร่?',
      visual: {
        kind: 'groups',
        groups: [Array<string>(a).fill(emoji), Array<string>(b).fill(emoji)],
        joiner: '+',
      },
      say: [th(`${a} บวก ${b} ได้เท่าไหร่นะ`)],
      choices: values.map((v) => textChoice(String(v))),
      answer,
    };
  }

  const plus = rng() < 0.5;
  const a = plus ? randInt(rng, 3, 12) : randInt(rng, 8, 20);
  const b = plus ? randInt(rng, 3, 20 - a) : randInt(rng, 3, a - 2);
  const result = plus ? a + b : a - b;
  const { values, answer } = numberChoices(result, 6, 0, 20, rng);
  return {
    text: 'ได้เท่าไหร่?',
    visual: { kind: 'glyph', text: plus ? `${a} + ${b}` : `${a} − ${b}` },
    say: [],
    choices: values.map((v) => textChoice(String(v))),
    answer,
  };
}

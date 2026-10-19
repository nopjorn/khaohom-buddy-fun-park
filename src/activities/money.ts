import { pick, randInt, sample, shuffle } from '../core/rng';
import type { Choice, Question, Rng } from '../types';
import { numberChoices, textChoice, th } from './util';

export const MONEY_MAX_LEVEL = 4;

/** เหรียญไทยที่เด็กเจอบ่อย */
export const COINS = [1, 2, 5, 10];

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
/** เรียงเหรียญใหญ่ไว้ก่อน นับต่อได้ง่ายกว่า */
const sorted = (values: number[]) => values.slice().sort((a, b) => b - a);

function randomPile(rng: Rng, coins: number, max: number): number[] {
  for (;;) {
    const pile = Array.from({ length: coins }, () => pick(rng, COINS));
    if (sum(pile) <= max) return sorted(pile);
  }
}

function totalQuestion(values: number[], max: number, item: string, rng: Rng): Question {
  const total = sum(values);
  const { values: options, answer } = numberChoices(total, 3, 1, max, rng);
  return {
    text: 'มีเงินกี่บาท?',
    visual: { kind: 'coins', values },
    say: [th('มีเงินกี่บาทนะ')],
    choices: options.map((v) => textChoice(String(v))),
    answer,
    item,
  };
}

/**
 * ระดับ 1 นับเหรียญบาท, ระดับ 2 เหรียญห้ากับเหรียญบาท, ระดับ 3 ทุกเหรียญรวมไม่เกิน 20,
 * ระดับ 4 กองไหนมีเงินมากที่สุด ระดับที่สูงกว่านั้นเป็นโจทย์เงินทอนของผู้ปกครอง
 */
export function generateMoney(level: number, rng: Rng): Question {
  if (level <= 1) return totalQuestion(Array<number>(randInt(rng, 1, 5)).fill(1), 6, 'money:1', rng);
  if (level === 2) {
    const ones = randInt(rng, 0, 4);
    const values = ones === 0 ? [5, 5] : [5, ...Array<number>(ones).fill(1)];
    return totalQuestion(values, 12, 'money:5', rng);
  }
  if (level === 3) return totalQuestion(randomPile(rng, randInt(rng, 2, 4), 20), 22, 'money:10', rng);

  if (level === 4) {
    const piles: number[][] = [];
    while (piles.length < 3) {
      const pile = randomPile(rng, randInt(rng, 1, 3), 15);
      if (!piles.some((p) => sum(p) === sum(pile))) piles.push(pile);
    }
    const best = Math.max(...piles.map(sum));
    const choices: Choice[] = piles.map((p) => ({ kind: 'coins', label: `${sum(p)}`, values: p }));
    return {
      text: 'กองไหนมีเงินมากที่สุด?',
      say: [th('กองไหนมีเงินมากที่สุดนะ')],
      choices,
      answer: piles.findIndex((p) => sum(p) === best),
      item: 'money:most',
    };
  }

  const price = randInt(rng, 11, 89);
  const change = 100 - price;
  // ตัวลวงคือความผิดพลาดที่พบบ่อยตอนทอนเงิน เช่น ลืมยืมหลักสิบ
  const traps = new Set([change + 10, change - 10, change + 1, change - 1, change + 9, change - 9, change + 2]);
  traps.delete(change);
  const values = shuffle(rng, [change, ...sample(rng, [...traps].filter((v) => v > 0 && v < 100), 5)]);
  return {
    text: 'จ่าย 100 บาท ได้เงินทอนเท่าไหร่?',
    visual: { kind: 'glyph', text: `🛒 ${price} บาท` },
    say: [],
    choices: values.map((v) => textChoice(String(v))),
    answer: values.indexOf(change),
  };
}

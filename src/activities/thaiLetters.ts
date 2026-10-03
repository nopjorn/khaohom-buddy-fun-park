import { sample, shuffle, weightedPick } from '../core/rng';
import { ALL_CONSONANTS, THAI_EASY_COUNT, THAI_LETTERS, THAI_LOOKALIKES } from '../data/thai';
import type { ItemWeight, Question, Rng } from '../types';
import { emojiChoice, evenWeight, textChoice, th, withDistractors } from './util';

export const THAI_MAX_LEVEL = 4;

/**
 * ระดับ 1 ตัวอักษรที่พบบ่อย → ภาพ, ระดับ 2 ตัวอักษรทั้งหมด → ภาพ,
 * ระดับ 3 ภาพ → ตัวอักษร, ระดับ 4 ตัวอักษร → ภาพ โดยไม่บอกคำ
 * ระดับที่สูงกว่านั้นเป็นโจทย์ของผู้ปกครอง ที่ตัวลวงหน้าตาคล้ายคำตอบ
 */
export function generateThai(level: number, rng: Rng, weight: ItemWeight = evenWeight): Question {
  const pool = level <= 1 ? THAI_LETTERS.slice(0, THAI_EASY_COUNT) : THAI_LETTERS;
  const target = weightedPick(rng, pool, (t) => weight(`thai:${t.letter}`));
  const item = `thai:${target.letter}`;

  if (level <= 2 || level === 4) {
    const reveal = level !== 4;
    const { options, answer } = withDistractors(rng, target, pool, reveal ? 3 : 4);
    return {
      text: 'ภาพไหนคู่กับตัวนี้?',
      visual: {
        kind: 'glyph',
        text: target.letter,
        caption: reveal ? `${target.letter} ${target.word}` : undefined,
      },
      say: [th(reveal ? `${target.letter} ${target.word} อยู่ไหนนะ` : 'ตัวนี้คู่กับภาพไหนนะ')],
      choices: options.map((o) => emojiChoice(o.emoji)),
      answer,
      item,
    };
  }

  if (level === 3) {
    const { options, answer } = withDistractors(rng, target, pool, 3);
    return {
      text: 'ตัวไหนคู่กับภาพนี้?',
      visual: { kind: 'glyph', text: target.emoji, caption: target.word },
      say: [th(`${target.word} คู่กับตัวไหนนะ`)],
      choices: options.map((o) => textChoice(o.letter)),
      answer,
      item,
    };
  }

  const lookalikes = THAI_LOOKALIKES[target.letter] ?? [];
  const fillers = sample(
    rng,
    ALL_CONSONANTS.filter((c) => c !== target.letter && !lookalikes.includes(c)),
    5 - lookalikes.length,
  );
  const letters = shuffle(rng, [target.letter, ...lookalikes, ...fillers]);
  return {
    text: 'ตัวไหนคู่กับภาพนี้?',
    visual: { kind: 'glyph', text: target.emoji, caption: target.word },
    say: [],
    choices: letters.map(textChoice),
    answer: letters.indexOf(target.letter),
  };
}

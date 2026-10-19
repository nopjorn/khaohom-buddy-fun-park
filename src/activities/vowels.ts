import { pick, sample, shuffle, weightedPick } from '../core/rng';
import { RHYME_WORDS, VOWELS, VOWEL_WORDS, type VowelKey, blendParts, vowelOf } from '../data/vowels';
import type { ItemWeight, Question, Rng } from '../types';
import { emojiChoice, evenWeight, textChoice, th, withDistractors } from './util';

export const VOWELS_MAX_LEVEL = 4;

/** เสียงของพยัญชนะตัวเดียวคือพยัญชนะกับ อ เช่น ต อ่านว่า ตอ */
const sound = (consonant: string) => `${consonant}อ`;

/**
 * ระดับ 1 ฟังคำ เลือกภาพ, ระดับ 2 ประสมพยัญชนะกับสระ เลือกภาพ, ระดับ 3 เห็นภาพ เลือกคำ,
 * ระดับ 4 เห็นภาพ เลือกสระที่หายไป ระดับที่สูงกว่านั้นเป็นโจทย์คำคล้องจองของผู้ปกครอง
 */
export function generateVowels(level: number, rng: Rng, weight: ItemWeight = evenWeight): Question {
  if (level > VOWELS_MAX_LEVEL) return rhyme(rng);

  const target = weightedPick(rng, VOWEL_WORDS, (w) => weight(`vowels:${w.word}`));
  const item = `vowels:${target.word}`;
  const vowel = vowelOf(target.vowel);

  if (level <= 2) {
    const { options, answer } = withDistractors(rng, target, VOWEL_WORDS, 3);
    const [a, b] = blendParts(target);
    return level <= 1
      ? {
          text: 'ภาพไหนคือคำนี้?',
          visual: { kind: 'glyph', text: target.word },
          say: [th(`${target.word} อยู่ไหนนะ`)],
          choices: options.map((o) => emojiChoice(o.emoji)),
          answer,
          item,
        }
      : {
          text: 'ประสมแล้วได้คำว่าอะไร?',
          visual: { kind: 'glyph', text: `${a} + ${b}` },
          say: [th(`${sound(target.consonant)} ประสมกับ ${vowel.name} อ่านว่าอะไรนะ`)],
          choices: options.map((o) => emojiChoice(o.emoji)),
          answer,
          item,
        };
  }

  if (level === 3) {
    const { options, answer } = withDistractors(rng, target, VOWEL_WORDS, 3);
    return {
      text: 'ภาพนี้คือคำไหน?',
      visual: { kind: 'glyph', text: target.emoji },
      say: [th('ภาพนี้คือคำว่าอะไรนะ')],
      choices: options.map((o) => textChoice(o.word)),
      answer,
      item,
    };
  }

  const others = sample(rng, VOWELS.filter((v) => v.key !== target.vowel), 2);
  const options = shuffle(rng, [vowel, ...others]);
  return {
    text: 'ใช้สระอะไร?',
    visual: { kind: 'glyph', text: target.emoji, caption: `${target.consonant} + ?` },
    say: [th(`${target.word} ใช้สระอะไรนะ`)],
    choices: options.map((v) => textChoice(v.shown)),
    answer: options.indexOf(vowel),
    item,
  };
}

function rhyme(rng: Rng): Question {
  const keys = Object.keys(RHYME_WORDS) as VowelKey[];
  const key = pick(rng, keys);
  const [prompt, correct] = sample(rng, RHYME_WORDS[key], 2);
  const fillers = sample(
    rng,
    keys.filter((k) => k !== key).flatMap((k) => RHYME_WORDS[k]),
    5,
  );
  const words = shuffle(rng, [correct, ...fillers]);
  return {
    text: 'คำไหนใช้สระเดียวกัน?',
    visual: { kind: 'glyph', text: prompt },
    say: [],
    choices: words.map(textChoice),
    answer: words.indexOf(correct),
  };
}

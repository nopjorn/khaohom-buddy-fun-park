import { pick, randInt, shuffle } from '../core/rng';
import { ENGLISH_EASY_COUNT, ENGLISH_WORDS } from '../data/english';
import type { Question, Rng } from '../types';
import { emojiChoice, en, textChoice, th, withDistractors } from './util';

export const ENGLISH_MAX_LEVEL = 4;

const VOWELS = 'aeiou';
const isLetter = (c: string) => c >= 'a' && c <= 'z';
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** สร้างคำที่สะกดผิดแบบเนียน ๆ ไม่ซ้ำกันและไม่ตรงกับคำจริง */
export function misspellings(word: string, n: number, rng: Rng): string[] {
  const base = word.toLowerCase();
  const letterIndexes = Array.from(base, (c, i) => (isLetter(c) ? i : -1)).filter((i) => i >= 0);
  const out = new Set<string>();

  for (let guard = 0; out.size < n && guard < 500; guard++) {
    const chars = Array.from(base);
    const i = pick(rng, letterIndexes);
    switch (randInt(rng, 0, 3)) {
      case 0: {
        const j = i + 1;
        if (j >= chars.length || !isLetter(chars[j])) continue;
        [chars[i], chars[j]] = [chars[j], chars[i]];
        break;
      }
      case 1: {
        const current = chars[i];
        if (!VOWELS.includes(current)) continue;
        chars[i] = pick(
          rng,
          Array.from(VOWELS).filter((v) => v !== current),
        );
        break;
      }
      case 2:
        chars.splice(i, 0, chars[i]);
        break;
      default:
        if (letterIndexes.length <= 3) continue;
        chars.splice(i, 1);
    }
    const candidate = capitalize(chars.join(''));
    if (candidate !== word) out.add(candidate);
  }
  return Array.from(out);
}

/**
 * ระดับ 1 ฟังคำ → ภาพ, ระดับ 2 ตัวอักษร → ภาพที่ขึ้นต้นด้วยตัวนั้น,
 * ระดับ 3 ตัวพิมพ์ใหญ่ → ตัวพิมพ์เล็ก, ระดับ 4 ภาพ → ตัวอักษรขึ้นต้น
 * ระดับที่สูงกว่านั้นเป็นโจทย์เลือกคำที่สะกดถูกของผู้ปกครอง
 */
export function generateEnglish(level: number, rng: Rng): Question {
  const pool = level <= 1 ? ENGLISH_WORDS.slice(0, ENGLISH_EASY_COUNT) : ENGLISH_WORDS;
  const target = pick(rng, pool);

  if (level <= 1) {
    const { options, answer } = withDistractors(rng, target, pool, 3);
    return {
      text: 'อันไหนคือคำนี้?',
      visual: { kind: 'glyph', text: target.word },
      say: [th('อันไหนคือ'), en(target.word)],
      choices: options.map((o) => emojiChoice(o.emoji)),
      answer,
    };
  }

  if (level === 2) {
    const { options, answer } = withDistractors(rng, target, pool, 3);
    return {
      text: 'ภาพไหนขึ้นต้นด้วยตัวนี้?',
      visual: {
        kind: 'glyph',
        text: `${target.letter} ${target.letter.toLowerCase()}`,
        caption: target.word,
      },
      say: [en(target.letter), en(target.word), th('อยู่ไหนนะ')],
      choices: options.map((o) => emojiChoice(o.emoji)),
      answer,
    };
  }

  if (level === 3) {
    const { options, answer } = withDistractors(rng, target, pool, 3);
    return {
      text: 'ตัวพิมพ์เล็กคือตัวไหน?',
      visual: { kind: 'glyph', text: target.letter },
      say: [th('ตัวเล็กของ'), en(target.letter), th('คือตัวไหนนะ')],
      choices: options.map((o) => textChoice(o.letter.toLowerCase())),
      answer,
    };
  }

  if (level === 4) {
    const { options, answer } = withDistractors(rng, target, pool, 4);
    return {
      text: 'ขึ้นต้นด้วยตัวอะไร?',
      visual: { kind: 'glyph', text: target.emoji },
      say: [en(target.word), th('ขึ้นต้นด้วยตัวอะไรนะ')],
      choices: options.map((o) => textChoice(o.letter)),
      answer,
    };
  }

  const spellings = shuffle(rng, [target.word, ...misspellings(target.word, 5, rng)]);
  return {
    text: 'สะกดแบบไหนถูก?',
    visual: { kind: 'glyph', text: target.emoji },
    say: [],
    choices: spellings.map(textChoice),
    answer: spellings.indexOf(target.word),
  };
}

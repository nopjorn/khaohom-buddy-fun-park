import { describe, expect, it } from 'vitest';
import { COUNTING_MAX_LEVEL, generateCounting } from '../src/activities/counting';
import { ENGLISH_MAX_LEVEL, generateEnglish, misspellings } from '../src/activities/english';
import { PATTERN_MAX_LEVEL, generatePattern } from '../src/activities/pattern';
import { THAI_MAX_LEVEL, generateThai } from '../src/activities/thaiLetters';
import { numberChoices } from '../src/activities/util';
import { mulberry32 } from '../src/core/rng';
import { ENGLISH_EASY_COUNT, ENGLISH_WORDS } from '../src/data/english';
import { THAI_EASY_COUNT, THAI_LETTERS } from '../src/data/thai';
import type { Choice, Question, Rng, Visual } from '../src/types';

const SEEDS = Array.from({ length: 300 }, (_, i) => i + 1);

const choiceKey = (c: Choice) => (c.kind === 'group' ? `group:${c.label}:${c.count}` : `${c.kind}:${c.label}`);

function each(generate: (level: number, rng: Rng) => Question, level: number, check: (q: Question) => void): void {
  for (const seed of SEEDS) check(generate(level, mulberry32(seed)));
}

function visualOf<K extends Visual['kind']>(q: Question, kind: K): Extract<Visual, { kind: K }> {
  expect(q.visual?.kind).toBe(kind);
  return q.visual as Extract<Visual, { kind: K }>;
}

const answerLabel = (q: Question) => q.choices[q.answer].label;

describe.each([
  ['counting', generateCounting, COUNTING_MAX_LEVEL],
  ['thai', generateThai, THAI_MAX_LEVEL],
  ['english', generateEnglish, ENGLISH_MAX_LEVEL],
  ['pattern', generatePattern, PATTERN_MAX_LEVEL],
] as const)('โจทย์ %s', (_name, generate, maxLevel) => {
  it('ทุกระดับมีคำตอบอยู่ในตัวเลือก และตัวเลือกไม่ซ้ำกัน', () => {
    for (let level = 1; level <= maxLevel + 1; level++) {
      each(generate, level, (q) => {
        expect(q.text).not.toBe('');
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.choices.length);
        expect(new Set(q.choices.map(choiceKey)).size).toBe(q.choices.length);
      });
    }
  });

  it('ระดับของลูกมีเสียงอ่านโจทย์และตัวเลือก 3-4 ข้อ ส่วนผู้ปกครองมี 6 ข้อ', () => {
    for (let level = 1; level <= maxLevel; level++) {
      each(generate, level, (q) => {
        expect(q.say.length).toBeGreaterThan(0);
        expect(q.choices.length).toBeGreaterThanOrEqual(3);
        expect(q.choices.length).toBeLessThanOrEqual(4);
      });
    }
    each(generate, maxLevel + 1, (q) => expect(q.choices).toHaveLength(6));
  });
});

describe('นับเลข', () => {
  it('ระดับ 1 นับ 1-5 และระดับ 2 นับ 3-10 คำตอบตรงกับจำนวนภาพ', () => {
    for (const [level, min, max] of [
      [1, 1, 5],
      [2, 3, 10],
    ]) {
      each(generateCounting, level, (q) => {
        const count = visualOf(q, 'groups').groups[0].length;
        expect(count).toBeGreaterThanOrEqual(min);
        expect(count).toBeLessThanOrEqual(max);
        expect(answerLabel(q)).toBe(String(count));
        for (const c of q.choices) {
          expect(Number(c.label)).toBeGreaterThanOrEqual(1);
          expect(Number(c.label)).toBeLessThanOrEqual(max);
        }
      });
    }
  });

  it('ระดับ 3 คำตอบคือกลุ่มที่มากที่สุดหรือน้อยที่สุดตามโจทย์', () => {
    each(generateCounting, 3, (q) => {
      const counts = q.choices.map((c) => (c.kind === 'group' ? c.count : NaN));
      const wanted = q.text.includes('มาก') ? Math.max(...counts) : Math.min(...counts);
      expect(counts[q.answer]).toBe(wanted);
    });
  });

  it('ระดับ 4 คำตอบคือผลบวกของสองกลุ่ม และไม่เกิน 10', () => {
    each(generateCounting, 4, (q) => {
      const [a, b] = visualOf(q, 'groups').groups.map((g) => g.length);
      expect(a + b).toBeLessThanOrEqual(10);
      expect(answerLabel(q)).toBe(String(a + b));
    });
  });

  it('โจทย์ผู้ปกครองคำนวณถูกและอยู่ในช่วง 0-20', () => {
    each(generateCounting, COUNTING_MAX_LEVEL + 1, (q) => {
      const [, a, op, b] = /^(\d+) ([+−]) (\d+)$/.exec(visualOf(q, 'glyph').text) ?? [];
      const result = op === '+' ? Number(a) + Number(b) : Number(a) - Number(b);
      expect(answerLabel(q)).toBe(String(result));
      for (const c of q.choices) {
        expect(Number(c.label)).toBeGreaterThanOrEqual(0);
        expect(Number(c.label)).toBeLessThanOrEqual(20);
      }
    });
  });
});

describe('ภาษาไทย', () => {
  const byLetter = new Map(THAI_LETTERS.map((t) => [t.letter, t]));
  const byEmoji = new Map(THAI_LETTERS.map((t) => [t.emoji, t]));

  it('ข้อมูลตัวอักษรและภาพไม่ซ้ำกัน', () => {
    expect(byLetter.size).toBe(THAI_LETTERS.length);
    expect(byEmoji.size).toBe(THAI_LETTERS.length);
  });

  it('ระดับ 1, 2, 4 ตัวอักษร → ภาพที่คู่กัน', () => {
    const easy = THAI_LETTERS.slice(0, THAI_EASY_COUNT).map((t) => t.letter);
    for (const level of [1, 2, 4]) {
      each(generateThai, level, (q) => {
        const glyph = visualOf(q, 'glyph');
        expect(answerLabel(q)).toBe(byLetter.get(glyph.text)?.emoji);
        if (level === 1) expect(easy).toContain(glyph.text);
        if (level === 4) expect(glyph.caption).toBeUndefined();
      });
    }
  });

  it('ระดับ 3 และผู้ปกครอง ภาพ → ตัวอักษรที่คู่กัน', () => {
    for (const level of [3, THAI_MAX_LEVEL + 1]) {
      each(generateThai, level, (q) => {
        expect(answerLabel(q)).toBe(byEmoji.get(visualOf(q, 'glyph').text)?.letter);
      });
    }
  });
});

describe('ภาษาอังกฤษ', () => {
  const byWord = new Map(ENGLISH_WORDS.map((w) => [w.word, w]));
  const byEmoji = new Map(ENGLISH_WORDS.map((w) => [w.emoji, w]));
  const byLetter = new Map(ENGLISH_WORDS.map((w) => [w.letter, w]));

  it('ข้อมูลตัวอักษรและภาพไม่ซ้ำกัน', () => {
    expect(byLetter.size).toBe(ENGLISH_WORDS.length);
    expect(byEmoji.size).toBe(ENGLISH_WORDS.length);
    for (const w of ENGLISH_WORDS) expect(w.word[0]).toBe(w.letter);
  });

  it('ระดับ 1 คำ → ภาพ โดยใช้เฉพาะคำง่าย', () => {
    const easy = ENGLISH_WORDS.slice(0, ENGLISH_EASY_COUNT).map((w) => w.word);
    each(generateEnglish, 1, (q) => {
      const word = visualOf(q, 'glyph').text;
      expect(easy).toContain(word);
      expect(answerLabel(q)).toBe(byWord.get(word)?.emoji);
    });
  });

  it('ระดับ 2 ตัวอักษร → ภาพที่ขึ้นต้นด้วยตัวนั้น', () => {
    each(generateEnglish, 2, (q) => {
      const letter = visualOf(q, 'glyph').text[0];
      expect(answerLabel(q)).toBe(byLetter.get(letter)?.emoji);
    });
  });

  it('ระดับ 3 ตัวพิมพ์ใหญ่ → ตัวพิมพ์เล็ก', () => {
    each(generateEnglish, 3, (q) => {
      expect(answerLabel(q)).toBe(visualOf(q, 'glyph').text.toLowerCase());
    });
  });

  it('ระดับ 4 ภาพ → ตัวอักษรขึ้นต้น', () => {
    each(generateEnglish, 4, (q) => {
      expect(answerLabel(q)).toBe(byEmoji.get(visualOf(q, 'glyph').text)?.letter);
    });
  });

  it('โจทย์ผู้ปกครอง คำตอบคือคำที่สะกดถูก', () => {
    each(generateEnglish, ENGLISH_MAX_LEVEL + 1, (q) => {
      expect(answerLabel(q)).toBe(byEmoji.get(visualOf(q, 'glyph').text)?.word);
    });
  });

  it('คำสะกดผิดมีครบ ไม่ซ้ำกัน และไม่ตรงกับคำจริง', () => {
    for (const { word } of ENGLISH_WORDS) {
      for (const seed of SEEDS.slice(0, 40)) {
        const wrong = misspellings(word, 5, mulberry32(seed));
        expect(wrong).toHaveLength(5);
        expect(new Set(wrong).size).toBe(5);
        expect(wrong).not.toContain(word);
      }
    }
  });
});

describe('แบบรูป', () => {
  it('ระดับของลูก คำตอบทำให้แบบรูปวนซ้ำต่อไปได้', () => {
    for (let level = 1; level <= PATTERN_MAX_LEVEL; level++) {
      each(generatePattern, level, (q) => {
        const full = [...visualOf(q, 'sequence').items, answerLabel(q)];
        const periods = [2, 3, 4].filter((p) => full.every((item, i) => i < p || item === full[i - p]));
        expect(periods.length).toBeGreaterThan(0);
        // ต้องเห็นของในแบบรูปมากกว่าหนึ่งรอบ ไม่อย่างนั้นเดาคำตอบไม่ได้
        expect(full.length).toBeGreaterThan(periods[0]);
      });
    }
  });

  it('โจทย์ผู้ปกครองเป็นลำดับเลขที่ห่างเท่ากัน และไม่ติดลบ', () => {
    each(generatePattern, PATTERN_MAX_LEVEL + 1, (q) => {
      const full = [...visualOf(q, 'sequence').items, answerLabel(q)].map(Number);
      const step = full[1] - full[0];
      expect(step).not.toBe(0);
      full.forEach((n, i) => {
        expect(n).toBeGreaterThanOrEqual(0);
        if (i > 0) expect(n - full[i - 1]).toBe(step);
      });
    });
  });
});

describe('numberChoices', () => {
  it('เรียงจากน้อยไปมาก อยู่ในช่วง และมีคำตอบ', () => {
    for (const seed of SEEDS) {
      for (const answer of [1, 3, 5]) {
        const { values, answer: index } = numberChoices(answer, 3, 1, 5, mulberry32(seed));
        expect(values).toHaveLength(3);
        expect(values[index]).toBe(answer);
        expect([...values].sort((a, b) => a - b)).toEqual(values);
        expect(Math.min(...values)).toBeGreaterThanOrEqual(1);
        expect(Math.max(...values)).toBeLessThanOrEqual(5);
      }
    }
  });
});

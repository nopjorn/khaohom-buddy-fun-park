import { sample, shuffle } from '../core/rng';
import type { Choice, Lang, Rng, SayPart } from '../types';

export const th = (text: string): SayPart => ({ text, lang: 'th-TH' as Lang });
export const en = (text: string): SayPart => ({ text, lang: 'en-US' as Lang });

export const textChoice = (label: string): Choice => ({ kind: 'text', label });
export const emojiChoice = (label: string): Choice => ({ kind: 'emoji', label });
export const groupChoice = (label: string, count: number): Choice => ({ kind: 'group', label, count });

/** ตัวเลือกตัวเลขที่อยู่ใกล้คำตอบ เรียงจากน้อยไปมาก */
export function numberChoices(
  answer: number,
  count: number,
  min: number,
  max: number,
  rng: Rng,
): { values: number[]; answer: number } {
  const near: number[] = [];
  for (let d = 1; near.length < count + 1 && d <= max - min; d++) {
    if (answer - d >= min) near.push(answer - d);
    if (answer + d <= max) near.push(answer + d);
  }
  const values = [answer, ...sample(rng, near, count - 1)].sort((a, b) => a - b);
  return { values, answer: values.indexOf(answer) };
}

/** สุ่มตัวลวงจาก pool แล้วสลับตำแหน่งรวมกับคำตอบ */
export function withDistractors<T>(
  rng: Rng,
  target: T,
  pool: readonly T[],
  count: number,
): { options: T[]; answer: number } {
  const others = sample(
    rng,
    pool.filter((p) => p !== target),
    count - 1,
  );
  const options = shuffle(rng, [target, ...others]);
  return { options, answer: options.indexOf(target) };
}

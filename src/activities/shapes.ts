import { pick, randInt, sample, shuffle, weightedPick } from '../core/rng';
import { COLORS, SHAPES, shapeEmoji } from '../data/colors';
import type { ItemWeight, Question, Rng } from '../types';
import { emojiChoice, evenWeight, numberChoices, textChoice, th } from './util';

export const SHAPES_MAX_LEVEL = 4;

const PARENT_GRID = 15;

/**
 * ระดับ 1 หาสี, ระดับ 2 หารูปทรง, ระดับ 3 หาทั้งสีและรูปทรง, ระดับ 4 อันไหนไม่เหมือนเพื่อน
 * ระดับที่สูงกว่านั้นเป็นโจทย์นับสีในกองของผู้ปกครอง
 */
export function generateShapes(level: number, rng: Rng, weight: ItemWeight = evenWeight): Question {
  if (level <= 1) {
    const target = weightedPick(rng, COLORS, (c) => weight(`shapes:${c.key}`));
    const others = sample(rng, COLORS.filter((c) => c !== target), 2);
    const options = shuffle(rng, [target, ...others]);
    return {
      text: `${target.name}อยู่ไหน?`,
      say: [th(`${target.name}อยู่ไหนนะ`)],
      choices: options.map((c) => emojiChoice(shapeEmoji('circle', c.key))),
      answer: options.indexOf(target),
      item: `shapes:${target.key}`,
    };
  }

  if (level === 2) {
    const target = weightedPick(rng, SHAPES, (s) => weight(`shapes:${s.key}`));
    // สีไม่ซ้ำกัน เด็กจะได้ดูที่รูปทรงจริง ๆ ไม่ใช่จำสี
    const colors = sample(rng, COLORS, SHAPES.length);
    const options = shuffle(rng, SHAPES.map((s, i) => ({ shape: s, emoji: shapeEmoji(s.key, colors[i].key) })));
    return {
      text: `รูป${target.name}อยู่ไหน?`,
      say: [th(`รูป${target.name}อยู่ไหนนะ`)],
      choices: options.map((o) => emojiChoice(o.emoji)),
      answer: options.findIndex((o) => o.shape === target),
      item: `shapes:${target.key}`,
    };
  }

  if (level === 3) {
    const combos = SHAPES.flatMap((s) => COLORS.map((c) => ({ shape: s, color: c })));
    const target = weightedPick(rng, combos, (o) => weight(`shapes:${o.shape.key}-${o.color.key}`));
    const otherShape = pick(rng, SHAPES.filter((s) => s !== target.shape));
    const otherColor = pick(rng, COLORS.filter((c) => c !== target.color));
    // ตัวลวงที่เหมือนครึ่งหนึ่ง ต้องดูทั้งสีและรูปทรงจึงจะตอบถูก
    const traps = [
      { shape: target.shape, color: otherColor },
      { shape: otherShape, color: target.color },
      {
        shape: pick(rng, SHAPES.filter((s) => s !== target.shape)),
        color: pick(rng, COLORS.filter((c) => c !== target.color && c !== otherColor)),
      },
    ];
    const options = shuffle(rng, [target, ...traps]);
    const label = `${target.shape.name}${target.color.name}`;
    return {
      text: `${label}อยู่ไหน?`,
      say: [th(`${label}อยู่ไหนนะ`)],
      choices: options.map((o) => emojiChoice(shapeEmoji(o.shape.key, o.color.key))),
      answer: options.indexOf(target),
      item: `shapes:${target.shape.key}-${target.color.key}`,
    };
  }

  if (level === 4) {
    const byColor = rng() < 0.5;
    let same: string[];
    let odd: string;
    if (byColor) {
      const [base, other] = sample(rng, COLORS, 2);
      same = SHAPES.map((s) => shapeEmoji(s.key, base.key));
      odd = shapeEmoji(pick(rng, SHAPES).key, other.key);
    } else {
      const [base, other] = sample(rng, SHAPES, 2);
      same = sample(rng, COLORS, 3).map((c) => shapeEmoji(base.key, c.key));
      odd = shapeEmoji(other.key, pick(rng, COLORS).key);
    }
    const options = shuffle(rng, [...same, odd]);
    const text = byColor ? 'อันไหนสีไม่เหมือนเพื่อน?' : 'อันไหนรูปร่างไม่เหมือนเพื่อน?';
    return {
      text,
      say: [th(byColor ? 'อันไหนสีไม่เหมือนเพื่อนนะ' : 'อันไหนรูปร่างไม่เหมือนเพื่อนนะ')],
      choices: options.map(emojiChoice),
      answer: options.indexOf(odd),
      item: 'shapes:odd',
    };
  }

  const target = pick(rng, COLORS);
  const n = randInt(rng, 2, 7);
  const others = COLORS.filter((c) => c !== target);
  const pieces = shuffle(rng, [
    ...Array.from({ length: n }, () => shapeEmoji(pick(rng, SHAPES).key, target.key)),
    ...Array.from({ length: PARENT_GRID - n }, () => shapeEmoji(pick(rng, SHAPES).key, pick(rng, others).key)),
  ]);
  const { values, answer } = numberChoices(n, 6, 0, PARENT_GRID, rng);
  return {
    text: `มี${target.name}กี่อัน?`,
    visual: { kind: 'groups', groups: [pieces] },
    say: [],
    choices: values.map((v) => textChoice(String(v))),
    answer,
  };
}

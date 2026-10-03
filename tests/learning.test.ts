import { describe, expect, it } from 'vitest';
import { ACTIVITIES, ACTIVITY_IDS, describeItem } from '../src/activities';
import { generateCounting } from '../src/activities/counting';
import { generateEnglish } from '../src/activities/english';
import { generateThai } from '../src/activities/thaiLetters';
import { mulberry32, weightedPick } from '../src/core/rng';
import { type Stats, recordResult, totalsFor, weakItems, weightOf } from '../src/engine/mastery';
import {
  TALK_TARGET,
  applyCorrect,
  applyWrong,
  createMatch,
  talkRating,
} from '../src/engine/match';
import { praiseFor } from '../src/engine/praise';
import type { ItemWeight, Side } from '../src/types';

const SEEDS = Array.from({ length: 400 }, (_, i) => i + 1);

describe('สถิติของข้อที่ฝึก', () => {
  it('นับจำนวนครั้งที่เจอและที่ตอบผิด โดยไม่แก้ของเดิม', () => {
    const empty: Stats = {};
    const once = recordResult(empty, 'thai:ก', true);
    const twice = recordResult(once, 'thai:ก', false);
    expect(empty).toEqual({});
    expect(once['thai:ก']).toEqual({ seen: 1, missed: 1 });
    expect(twice['thai:ก']).toEqual({ seen: 2, missed: 1 });
  });

  it('ข้อที่ผิดบ่อยได้น้ำหนักมากกว่า และลดลงเมื่อตอบถูกมากขึ้น', () => {
    expect(weightOf(undefined)).toBe(1);
    expect(weightOf({ seen: 5, missed: 0 })).toBe(1);
    const alwaysWrong = weightOf({ seen: 2, missed: 2 });
    const improving = weightOf({ seen: 8, missed: 2 });
    expect(alwaysWrong).toBeGreaterThan(improving);
    expect(improving).toBeGreaterThan(1);
  });

  it('รายการข้อที่ยังไม่แม่นเรียงจากผิดบ่อยที่สุด และไม่รวมข้อที่แทบไม่ผิด', () => {
    const stats: Stats = {
      'thai:ด': { seen: 4, missed: 3 },
      'thai:ต': { seen: 4, missed: 2 },
      'thai:ก': { seen: 10, missed: 1 },
      'thai:ข': { seen: 5, missed: 0 },
    };
    expect(weakItems(stats).map((item) => item.id)).toEqual(['thai:ด', 'thai:ต']);
    expect(weakItems(stats, 1)).toHaveLength(1);
  });

  it('รวมยอดแยกตามกิจกรรม', () => {
    const stats: Stats = {
      'thai:ด': { seen: 4, missed: 3 },
      'thai:ก': { seen: 6, missed: 1 },
      'english:C': { seen: 2, missed: 2 },
    };
    expect(totalsFor(stats, 'thai:')).toEqual({ seen: 10, missed: 4 });
    expect(totalsFor(stats, 'pattern:')).toEqual({ seen: 0, missed: 0 });
  });
});

describe('การสุ่มแบบถ่วงน้ำหนัก', () => {
  it('ของที่น้ำหนักมากถูกเลือกบ่อยกว่า และน้ำหนักศูนย์ไม่ถูกเลือก', () => {
    const rng = mulberry32(3);
    const counts = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < 3000; i++) {
      counts[weightedPick(rng, ['a', 'b', 'c'] as const, (x) => (x === 'a' ? 4 : x === 'b' ? 1 : 0))] += 1;
    }
    expect(counts.c).toBe(0);
    expect(counts.a).toBeGreaterThan(counts.b * 3);
  });

  it('น้ำหนักเป็นศูนย์ทั้งหมดยังสุ่มได้', () => {
    expect(['a', 'b']).toContain(weightedPick(mulberry32(1), ['a', 'b'], () => 0));
  });
});

describe('ทวนข้อที่ผิดบ่อย', () => {
  const share = (generate: (level: number, rng: () => number, weight?: ItemWeight) => { item?: string }, item: string, weight?: ItemWeight) =>
    SEEDS.filter((seed) => generate(2, mulberry32(seed), weight).item === item).length / SEEDS.length;

  it.each([
    ['ตัวอักษรไทย', generateThai, 'thai:ด'],
    ['ภาษาอังกฤษ', generateEnglish, 'english:Q'],
    ['นับเลข', generateCounting, 'counting:9'],
  ] as const)('%s: ข้อที่น้ำหนักมากถูกสุ่มเจอบ่อยขึ้นชัดเจน', (_name, generate, item) => {
    const heavy: ItemWeight = (id) => (id === item ? 4 : 1);
    expect(share(generate, item, heavy)).toBeGreaterThan(share(generate, item) * 2);
  });

  it('โจทย์ของลูกมี item ที่อธิบายได้ ส่วนโจทย์ของผู้ปกครองไม่มี', () => {
    for (const id of ACTIVITY_IDS) {
      const def = ACTIVITIES[id];
      if (!def.generate) continue;
      for (let level = 1; level <= def.maxLevel; level++) {
        for (const seed of SEEDS.slice(0, 60)) {
          const item = def.generate(level, mulberry32(seed)).item;
          expect(item?.startsWith(`${id}:`)).toBe(true);
          expect(describeItem(item as string).icon).not.toBe('❔');
        }
      }
      expect(def.generate(def.maxLevel + 1, mulberry32(1)).item).toBeUndefined();
    }
  });
});

describe('คำชม', () => {
  const rng = mulberry32(5);

  it('ชมที่ 3 ข้อ แล้วชมอีกทุก 5 ข้อ', () => {
    const praised = Array.from({ length: 20 }, (_, i) => i + 1).filter((n) => praiseFor(n, 'ข้าวหอม', rng) !== null);
    expect(praised).toEqual([3, 5, 10, 15, 20]);
  });

  it('คำชมมีชื่อลูก และคอมโบยาวบอกจำนวนข้อ', () => {
    expect(praiseFor(3, 'ข้าวหอม', rng)).toContain('ข้าวหอม');
    const long = praiseFor(10, 'ข้าวหอม', rng);
    expect(long).toContain('ข้าวหอม');
    expect(long).toContain('10');
  });
});

describe('โหมดคุยกัน', () => {
  it('ตอบถูกฝั่งไหนก็เติมหลอดร่วม ไม่มีไฮไฟว์ และครบเป้าแล้วทีมชนะ', () => {
    let state = createMatch('talk', 0);
    for (let i = 0; i < TALK_TARGET - 1; i++) {
      const side: Side = i % 2 === 0 ? 'parent' : 'child';
      // เวลาห่างกันนิดเดียว ถ้าเป็นโหมดช่วยกันจะได้ไฮไฟว์ แต่โหมดนี้ต้องไม่ได้
      const step = applyCorrect(state, side, i * 10);
      expect(step.effects).toEqual([{ type: 'star', side }]);
      state = step.state;
    }
    expect(state.shared).toBe(TALK_TARGET - 1);
    expect(state.winner).toBeNull();

    const last = applyCorrect(state, 'child', 500);
    expect(last.state.winner).toBe('team');
    expect(last.state.highFives).toBe(0);
    expect(last.effects).toContainEqual({ type: 'finish', winner: 'team' });
  });

  it('ให้ดาวตามจำนวนครั้งที่กดผิด และจบเกมแล้วไม่นับเพิ่ม', () => {
    let state = createMatch('talk', 0);
    expect(talkRating(state)).toBe(3);
    state = applyWrong(state);
    expect(talkRating(state)).toBe(3);
    state = applyWrong(state);
    expect(talkRating(state)).toBe(2);
    for (let i = 0; i < 3; i++) state = applyWrong(state);
    expect(state.wrong).toBe(5);
    expect(talkRating(state)).toBe(1);

    const finished = { ...state, winner: 'team' as const };
    expect(applyWrong(finished)).toBe(finished);
  });
});

import { describe, expect, it } from 'vitest';
import { closeOpen, createDeck, flipCard, newMemory, pairsForLevel } from '../src/activities/memory';
import { mulberry32 } from '../src/core/rng';
import { STICKERS } from '../src/data/items';
import {
  CATCH_UP_EXTRA_MS,
  LEVEL_DOWN_STREAK,
  LEVEL_UP_STREAK,
  newLevelState,
  parentDelayMs,
  recordAnswer,
} from '../src/engine/difficulty';
import {
  COOP_TARGET,
  HIGHFIVE_WINDOW_MS,
  VERSUS_TARGET,
  applyCorrect,
  coopRating,
  createMatch,
  type MatchState,
} from '../src/engine/match';
import { awardSticker } from '../src/engine/stickers';
import type { Side } from '../src/types';

function play(state: MatchState, events: [Side, number][]): MatchState {
  return events.reduce((s, [side, at]) => applyCorrect(s, side, at).state, state);
}

describe('โหมดแข่งกัน', () => {
  it('คนที่ได้ดาวครบก่อนเป็นผู้ชนะ', () => {
    let state = createMatch('versus', 0);
    for (let i = 0; i < VERSUS_TARGET - 1; i++) state = applyCorrect(state, 'child', i).state;
    state = applyCorrect(state, 'parent', 50).state;
    expect(state.winner).toBeNull();

    const { state: done, effects } = applyCorrect(state, 'child', 100);
    expect(done.winner).toBe('child');
    expect(done.finishedAt).toBe(100);
    expect(done.score).toEqual({ child: VERSUS_TARGET, parent: 1 });
    expect(effects).toContainEqual({ type: 'finish', winner: 'child' });
  });

  it('ไม่มีไฮไฟว์ และจบเกมแล้วไม่รับคะแนนเพิ่ม', () => {
    let state = createMatch('versus', 0);
    const first = applyCorrect(state, 'child', 0);
    const second = applyCorrect(first.state, 'parent', 10);
    expect(second.effects).toEqual([{ type: 'star', side: 'parent' }]);

    state = play(
      createMatch('versus', 0),
      Array.from({ length: VERSUS_TARGET }, (_, i): [Side, number] => ['parent', i]),
    );
    const after = applyCorrect(state, 'child', 999);
    expect(after.state).toBe(state);
    expect(after.effects).toEqual([]);
  });
});

describe('โหมดช่วยกัน', () => {
  it('ตอบถูกฝั่งไหนก็เติมหลอดพลังร่วม', () => {
    const gap = HIGHFIVE_WINDOW_MS + 1;
    const state = play(createMatch('coop', 0), [
      ['child', 0],
      ['parent', gap],
      ['child', gap * 2],
    ]);
    expect(state.shared).toBe(3);
    expect(state.highFives).toBe(0);
    expect(state.score).toEqual({ child: 2, parent: 1 });
  });

  it('สองฝั่งตอบถูกภายในช่วงเวลาที่กำหนดได้โบนัสไฮไฟว์', () => {
    const first = applyCorrect(createMatch('coop', 0), 'child', 1000);
    const second = applyCorrect(first.state, 'parent', 1000 + HIGHFIVE_WINDOW_MS);
    expect(second.effects).toContainEqual({ type: 'highfive' });
    expect(second.state.shared).toBe(3);
    expect(second.state.highFives).toBe(1);
  });

  it('ฝั่งเดียวตอบถูกติดกันไม่นับเป็นไฮไฟว์', () => {
    const state = play(createMatch('coop', 0), [
      ['child', 0],
      ['child', 100],
    ]);
    expect(state.highFives).toBe(0);
    expect(state.shared).toBe(2);
  });

  it('ไฮไฟว์หนึ่งครั้งใช้คำตอบของแต่ละฝั่งได้ครั้งเดียว', () => {
    const state = play(createMatch('coop', 0), [
      ['child', 0],
      ['parent', 100],
      ['parent', 200],
    ]);
    expect(state.highFives).toBe(1);
    expect(state.shared).toBe(4);
  });

  it('หลอดเต็มแล้วทีมชนะ และค่าไม่เกินเป้า', () => {
    let state = createMatch('coop', 0);
    const gap = HIGHFIVE_WINDOW_MS + 1;
    for (let i = 0; i < COOP_TARGET - 1; i++) state = applyCorrect(state, 'child', i * gap).state;
    expect(state.winner).toBeNull();

    // ข้อสุดท้ายได้ไฮไฟว์ด้วย ซึ่งจะเกินเป้าถ้าไม่จำกัดไว้
    const last = (COOP_TARGET - 2) * gap + 10;
    const { state: done, effects } = applyCorrect(state, 'parent', last);
    expect(done.winner).toBe('team');
    expect(done.shared).toBe(COOP_TARGET);
    expect(effects).toContainEqual({ type: 'finish', winner: 'team' });
  });

  it('ให้ดาวตามเวลาที่ใช้', () => {
    const base = createMatch('coop', 1000);
    expect(coopRating({ ...base, finishedAt: 1000 + 90_000 })).toBe(3);
    expect(coopRating({ ...base, finishedAt: 1000 + 150_000 })).toBe(2);
    expect(coopRating({ ...base, finishedAt: 1000 + 150_001 })).toBe(1);
  });
});

describe('การปรับระดับ', () => {
  it('ตอบถูกติดกันครบแล้วเลื่อนขึ้น และไม่เกินระดับสูงสุด', () => {
    let state = newLevelState(1);
    for (let i = 0; i < LEVEL_UP_STREAK - 1; i++) state = recordAnswer(state, true, 3);
    expect(state.level).toBe(1);
    state = recordAnswer(state, true, 3);
    expect(state).toEqual(newLevelState(2));

    state = newLevelState(3);
    for (let i = 0; i < LEVEL_UP_STREAK; i++) state = recordAnswer(state, true, 3);
    expect(state.level).toBe(3);
  });

  it('ตอบผิดติดกันครบแล้วเลื่อนลง และไม่ต่ำกว่า 1', () => {
    let state = newLevelState(2);
    for (let i = 0; i < LEVEL_DOWN_STREAK; i++) state = recordAnswer(state, false, 3);
    expect(state).toEqual(newLevelState(1));
    for (let i = 0; i < LEVEL_DOWN_STREAK; i++) state = recordAnswer(state, false, 3);
    expect(state.level).toBe(1);
  });

  it('ตอบผิดคั่นทำให้ต้องเริ่มนับใหม่', () => {
    let state = newLevelState(1);
    state = recordAnswer(state, true, 3);
    state = recordAnswer(state, true, 3);
    state = recordAnswer(state, false, 3);
    state = recordAnswer(state, true, 3);
    state = recordAnswer(state, true, 3);
    expect(state.level).toBe(1);
    state = recordAnswer(state, true, 3);
    expect(state.level).toBe(2);
  });

  it('ระดับที่บันทึกไว้เกินช่วงจะถูกดึงกลับเข้าช่วง', () => {
    expect(recordAnswer(newLevelState(9), true, 4).level).toBe(4);
  });

  it('แต้มต่อมากขึ้นโจทย์ผู้ปกครองยิ่งขึ้นช้า และช้าลงอีกเมื่อนำห่างในโหมดแข่ง', () => {
    const low = parentDelayMs('low', 'versus', 0);
    const normal = parentDelayMs('normal', 'versus', 0);
    const high = parentDelayMs('high', 'versus', 0);
    expect(low).toBeLessThan(normal);
    expect(normal).toBeLessThan(high);
    expect(parentDelayMs('normal', 'versus', 2)).toBe(normal);
    expect(parentDelayMs('normal', 'versus', 3)).toBe(normal + CATCH_UP_EXTRA_MS);
    expect(parentDelayMs('normal', 'coop', 5)).toBe(normal);
  });
});

describe('จับคู่ภาพ', () => {
  it('สำรับมีภาพละสองใบ ตามจำนวนคู่ของระดับ', () => {
    expect([1, 2, 3, 4].map(pairsForLevel)).toEqual([3, 4, 6, 8]);
    for (let seed = 1; seed <= 50; seed++) {
      const deck = createDeck(6, mulberry32(seed));
      const counts = new Map<string, number>();
      for (const card of deck) counts.set(card, (counts.get(card) ?? 0) + 1);
      expect(deck).toHaveLength(12);
      expect(Array.from(counts.values())).toEqual(Array(6).fill(2));
    }
  });

  it('เปิดสองใบที่เหมือนกันคือจับคู่ได้ และครบทุกคู่คือจบ', () => {
    let state = newMemory(['a', 'b', 'a', 'b']);
    let step = flipCard(state, 0);
    expect(step.result).toBe('opened');
    expect(flipCard(step.state, 0).result).toBe('ignored');

    step = flipCard(step.state, 2);
    expect(step.result).toBe('match');
    expect(step.state.open).toEqual([]);
    expect(flipCard(step.state, 0).result).toBe('ignored');

    state = flipCard(step.state, 1).state;
    expect(flipCard(state, 3).result).toBe('complete');
  });

  it('เปิดสองใบที่ต่างกันต้องปิดก่อนจึงเปิดใบอื่นได้', () => {
    let state = flipCard(newMemory(['a', 'b', 'a', 'b']), 0).state;
    const miss = flipCard(state, 1);
    expect(miss.result).toBe('miss');
    expect(flipCard(miss.state, 2).result).toBe('ignored');

    state = closeOpen(miss.state);
    expect(state.matched).toEqual([false, false, false, false]);
    expect(flipCard(state, 2).result).toBe('opened');
  });
});

describe('สติกเกอร์', () => {
  it('ได้ตัวใหม่จนกว่าจะครบ แล้วจึงได้ตัวซ้ำ', () => {
    const rng = mulberry32(7);
    const owned: string[] = [];
    for (let i = 0; i < STICKERS.length; i++) {
      const award = awardSticker(owned, rng);
      expect(award.isNew).toBe(true);
      expect(owned).not.toContain(award.sticker);
      owned.push(award.sticker);
    }
    const extra = awardSticker(owned, rng);
    expect(extra.isNew).toBe(false);
    expect(STICKERS).toContain(extra.sticker);
  });
});

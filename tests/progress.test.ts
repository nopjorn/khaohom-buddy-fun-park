import { describe, expect, it } from 'vitest';
import { decodeBackup, encodeBackup } from '../src/core/backup';
import { mulberry32 } from '../src/core/rng';
import { defaultSave, normalizeSave } from '../src/core/storage';
import { BASE_AVATARS } from '../src/data/avatars';
import { SHAPE_EMOJI, ROW_ITEMS, SIZE_ITEMS } from '../src/data/colors';
import { ENGLISH_WORDS } from '../src/data/english';
import { COUNT_ITEMS, MEMORY_ITEMS, PATTERN_SETS, SPECIAL_STICKERS, STICKERS, STICKER_SETS } from '../src/data/items';
import { THAI_LETTERS } from '../src/data/thai';
import { VOWEL_WORDS } from '../src/data/vowels';
import {
  KEEP_DAYS,
  addPlayTime,
  dayOf,
  emptyDay,
  recentDays,
  recordCombo,
  recordDayAnswer,
  recordGame,
  shiftKey,
  streakDays,
  timeLeftMs,
  weekTotals,
} from '../src/engine/daylog';
import { addProfile, allProfiles, removeProfile, switchProfile } from '../src/engine/profiles';
import { questProgress, questsDone, questsFor } from '../src/engine/quests';
import { finishGame } from '../src/engine/rewards';
import { ALL_AVATARS, completedSets, regularCount, unlockedAvatars } from '../src/engine/stickers';

const TODAY = '2026-10-19';

describe('บันทึกรายวัน', () => {
  it('เลื่อนวันข้ามเดือนและปีได้ถูก', () => {
    expect(shiftKey('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftKey('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('รวมเวลาเล่นและนับข้อที่ตอบแยกตามกิจกรรมโดยไม่แก้ของเดิม', () => {
    const empty = {};
    let days = addPlayTime(empty, TODAY, 60_000);
    days = recordDayAnswer(days, TODAY, 'thai', true);
    days = recordDayAnswer(days, TODAY, 'thai', false);
    expect(empty).toEqual({});
    expect(dayOf(days, TODAY).ms).toBe(60_000);
    expect(dayOf(days, TODAY).answers.thai).toEqual({ seen: 2, missed: 1 });
  });

  it('เก็บคอมโบที่ดีที่สุดของวัน และจำโหมดที่เล่นแล้วไม่ซ้ำ', () => {
    let days = recordCombo({}, TODAY, 4);
    days = recordCombo(days, TODAY, 2);
    days = recordGame(recordGame(days, TODAY, 'talk'), TODAY, 'talk');
    expect(dayOf(days, TODAY).bestCombo).toBe(4);
    expect(dayOf(days, TODAY).games).toBe(2);
    expect(dayOf(days, TODAY).modes).toEqual(['talk']);
  });

  it('ลบวันที่เก่ากว่าที่เก็บไว้ทิ้งเอง', () => {
    const old = shiftKey(TODAY, -(KEEP_DAYS + 5));
    const days = addPlayTime({ [old]: emptyDay() }, TODAY, 1000);
    expect(Object.keys(days)).toEqual([TODAY]);
  });

  it('นับวันเล่นต่อเนื่อง ถ้าวันนี้ยังไม่เล่นนับถึงเมื่อวาน และขาดหนึ่งวันเริ่มใหม่', () => {
    let days = {};
    for (const n of [-1, -2, -3, -5]) days = recordGame(days, shiftKey(TODAY, n), 'coop');
    expect(streakDays(days, TODAY)).toBe(3);
    expect(streakDays(recordGame(days, TODAY, 'coop'), TODAY)).toBe(4);
    expect(streakDays({}, TODAY)).toBe(0);
  });

  it('เวลาที่เหลือ: ไม่จำกัด, เหลือบางส่วน, หมดแล้ว และผู้ปกครองให้เล่นต่อ', () => {
    const days = addPlayTime({}, TODAY, 25 * 60_000);
    expect(timeLeftMs(days, TODAY, 0, '')).toBe(Infinity);
    expect(timeLeftMs(days, TODAY, 30, '')).toBe(5 * 60_000);
    expect(timeLeftMs(days, TODAY, 20, '')).toBe(0);
    expect(timeLeftMs(days, TODAY, 20, TODAY)).toBe(Infinity);
    expect(timeLeftMs(days, TODAY, 20, shiftKey(TODAY, -1))).toBe(0);
  });

  it('สรุป 7 วันเรียงจากเก่าไปใหม่ และแยกสัปดาห์นี้กับสัปดาห์ก่อน', () => {
    let days = recordDayAnswer({}, TODAY, 'counting', false);
    days = recordDayAnswer(days, shiftKey(TODAY, -8), 'counting', true);
    const week = recentDays(days, TODAY, 7);
    expect(week).toHaveLength(7);
    expect(week[6]).toMatchObject({ key: TODAY, seen: 1, missed: 0 });
    expect(weekTotals(days, TODAY, 'counting', 0)).toEqual({ seen: 1, missed: 0 });
    expect(weekTotals(days, TODAY, 'counting', 1)).toEqual({ seen: 1, missed: 1 });
  });
});

describe('ภารกิจประจำวัน', () => {
  it('วันเดียวกันได้ภารกิจชุดเดิมเสมอ มีสามข้อและไม่ซ้ำแบบกัน', () => {
    expect(questsFor(TODAY)).toEqual(questsFor(TODAY));
    for (let i = 0; i < 60; i++) {
      const quests = questsFor(shiftKey(TODAY, i));
      expect(quests).toHaveLength(3);
      expect(new Set(quests.map((q) => q.kind)).size).toBe(3);
      expect(quests[0].kind).toBe('correct');
    }
  });

  it('ความคืบหน้าไม่เกินเป้า และนับครบเมื่อทำได้ตามเป้า', () => {
    const quest = questsFor(TODAY)[0];
    if (quest.kind !== 'correct') throw new Error('ภารกิจแรกต้องเป็นการตอบถูก');
    let days = {};
    for (let i = 0; i < quest.target + 3; i++) days = recordDayAnswer(days, TODAY, quest.activity, false);
    expect(questProgress(quest, dayOf(days, TODAY))).toBe(quest.target);
    expect(questsDone(TODAY, dayOf(days, TODAY))).toBeGreaterThanOrEqual(1);
  });
});

describe('รางวัลเมื่อจบเกม', () => {
  it('ได้สติกเกอร์ปกติ นับเกม และไม่แก้ข้อมูลเดิม', () => {
    const before = defaultSave();
    const result = finishGame(before, 'coop', TODAY, mulberry32(1));
    expect(before.stickers).toEqual([]);
    expect(result.save.plays).toBe(1);
    expect(result.save.stickers).toEqual([result.award.sticker]);
    expect(STICKERS).toContain(result.award.sticker);
    expect(dayOf(result.save.days, TODAY).games).toBe(1);
  });

  it('ทำภารกิจครบได้รางวัลพิเศษครั้งเดียวต่อวัน', () => {
    let save = defaultSave();
    const quests = questsFor(TODAY);
    let days = {};
    for (const q of quests) {
      if (q.kind === 'correct') for (let i = 0; i < q.target; i++) days = recordDayAnswer(days, TODAY, q.activity, false);
      if (q.kind === 'combo') days = recordCombo(days, TODAY, q.target);
      if (q.kind === 'mode') days = recordGame(days, TODAY, q.mode);
    }
    save = { ...save, days: recordGame(days, TODAY, 'coop') };
    const first = finishGame(save, 'coop', TODAY, mulberry32(2));
    expect(first.bonuses.map((b) => b.reason)).toEqual(['quest']);
    expect(SPECIAL_STICKERS).toContain(first.bonuses[0].award.sticker);
    const second = finishGame(first.save, 'coop', TODAY, mulberry32(3));
    expect(second.bonuses).toEqual([]);
  });

  it('เล่นต่อเนื่องครบ 3 วันได้รางวัลพิเศษ', () => {
    const days = recordGame(recordGame({}, shiftKey(TODAY, -1), 'coop'), shiftKey(TODAY, -2), 'coop');
    const result = finishGame({ ...defaultSave(), days }, 'versus', TODAY, mulberry32(4));
    expect(result.bonuses).toContainEqual(expect.objectContaining({ reason: 'streak', streak: 3 }));
  });

  it('บอกชุดสติกเกอร์ที่เพิ่งครบในเกมนี้', () => {
    const set = STICKER_SETS[0];
    const save = { ...defaultSave(), stickers: set.stickers.slice(1) };
    // ให้สติกเกอร์ที่ขาดเป็นตัวเดียวที่เหลือในชุดปกติ
    const others = STICKERS.filter((s) => !set.stickers.includes(s));
    const result = finishGame({ ...save, stickers: [...save.stickers, ...others] }, 'coop', TODAY, mulberry32(5));
    expect(result.award.sticker).toBe(set.stickers[0]);
    expect(result.newSets.map((s) => s.id)).toContain(set.id);
  });
});

describe('สติกเกอร์และภาพประจำตัว', () => {
  it('ภาพประจำตัวทุกภาพไม่ซ้ำกันและไม่ซ้ำกับภาพในโจทย์', () => {
    const questionEmoji = new Set([
      ...COUNT_ITEMS,
      ...MEMORY_ITEMS,
      ...PATTERN_SETS.flat(),
      ...THAI_LETTERS.map((t) => t.emoji),
      ...ENGLISH_WORDS.map((w) => w.emoji),
      ...VOWEL_WORDS.map((w) => w.emoji),
      ...Object.values(SHAPE_EMOJI).flat(),
      ...SIZE_ITEMS,
      ...ROW_ITEMS,
    ]);
    expect(new Set(ALL_AVATARS).size).toBe(ALL_AVATARS.length);
    for (const avatar of ALL_AVATARS) expect(questionEmoji.has(avatar)).toBe(false);
  });

  it('สะสมครบชุดปลดล็อกภาพประจำตัวของชุดนั้น', () => {
    expect(unlockedAvatars([])).toEqual(BASE_AVATARS);
    const set = STICKER_SETS[1];
    expect(completedSets(set.stickers).map((s) => s.id)).toEqual([set.id]);
    expect(unlockedAvatars(set.stickers)).toEqual([...BASE_AVATARS, ...set.unlocks]);
  });

  it('สติกเกอร์ปกติกับรางวัลพิเศษไม่ปนกัน และนับเฉพาะสติกเกอร์ปกติ', () => {
    for (const s of SPECIAL_STICKERS) expect(STICKERS).not.toContain(s);
    expect(new Set(STICKERS).size).toBe(STICKERS.length);
    expect(regularCount([STICKERS[0], SPECIAL_STICKERS[0]])).toBe(1);
  });
});

describe('ลูกหลายคน', () => {
  it('เพิ่มลูกแล้วสลับไปมา ข้อมูลของแต่ละคนไม่ปนกัน', () => {
    let save = { ...defaultSave(), stickers: ['🦄'], plays: 3 };
    save = addProfile(save, 'พี่');
    expect(allProfiles(save).map((p) => p.childName)).toEqual(['หนู', 'พี่']);
    const sibling = allProfiles(save)[1];
    expect(sibling.childAvatar).not.toBe(save.settings.childAvatar);

    save = switchProfile(save, sibling.id);
    expect(save.settings.childName).toBe('พี่');
    expect(save.stickers).toEqual([]);
    expect(save.profileId).toBe(sibling.id);

    save = switchProfile(save, 1);
    expect(save.settings.childName).toBe('หนู');
    expect(save.stickers).toEqual(['🦄']);
    expect(save.plays).toBe(3);
    expect(save.others.map((p) => p.childName)).toEqual(['พี่']);
  });

  it('ลบได้เฉพาะลูกที่ไม่ได้กำลังเล่น', () => {
    let save = addProfile(defaultSave(), 'พี่');
    save = removeProfile(save, save.others[0].id);
    expect(allProfiles(save)).toHaveLength(1);
    expect(removeProfile(save, save.profileId)).toEqual(save);
  });

  it('การตั้งค่าของผู้ปกครองใช้ร่วมกันทุกคน', () => {
    let save = addProfile({ ...defaultSave(), settings: { ...defaultSave().settings, dailyLimit: 30 } }, 'พี่');
    save = switchProfile(save, save.others[0].id);
    expect(save.settings.dailyLimit).toBe(30);
  });
});

describe('ข้อมูลในเครื่องและการสำรอง', () => {
  it('ข้อมูลจากรุ่นเก่าได้ค่าใหม่ครบ', () => {
    const old = normalizeSave({ settings: { childName: 'น้อง' }, levels: { thai: 3 }, stickers: ['🦄'], plays: 2, stats: {} });
    expect(old.settings.childName).toBe('น้อง');
    expect(old.settings.childAvatar).toBe('🐣');
    expect(old.settings.dailyLimit).toBe(0);
    expect(old.levels.thai).toBe(3);
    expect(old.levels.money).toBe(1);
    expect(old.days).toEqual({});
    expect(old.others).toEqual([]);
  });

  it('ข้อมูลผิดรูปแบบได้ค่าเริ่มต้นแทน ไม่ทำให้เกมพัง', () => {
    expect(normalizeSave('garbage')).toEqual(defaultSave());
    const bad = normalizeSave({ settings: null, stickers: 'x', plays: 'many', days: { [TODAY]: 5 } });
    expect(bad.stickers).toEqual([]);
    expect(bad.plays).toBe(0);
    expect(bad.days).toEqual({});
  });

  it('รหัสสำรองแปลงกลับได้ข้อมูลเดิม รวมชื่อภาษาไทยและลูกคนอื่น', () => {
    const save = addProfile({ ...defaultSave(), stickers: ['🦄', '🥇'], days: addPlayTime({}, TODAY, 5000) }, 'พี่ชาย');
    const code = encodeBackup(save);
    expect(code.startsWith('KBP1:')).toBe(true);
    expect(decodeBackup(code)).toEqual(save);
    expect(decodeBackup(`  ${code.slice(0, 20)}\n${code.slice(20)}  `)).toEqual(save);
  });

  it('อ่านไฟล์ JSON ที่บันทึกไว้ได้ และปฏิเสธข้อความอื่น', () => {
    const save = defaultSave();
    expect(decodeBackup(JSON.stringify(save))).toEqual(save);
    expect(decodeBackup('hello')).toBeNull();
    expect(decodeBackup('KBP1:!!!')).toBeNull();
    expect(decodeBackup('{"a":1}')).toBeNull();
  });
});

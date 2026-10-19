import { DEFAULT_CHILD_AVATAR, DEFAULT_PARENT_AVATAR } from '../data/avatars';
import type { Stats } from '../engine/mastery';
import type { ActivityId, Mode, Settings } from '../types';

const KEY = 'buddy-park-v1';

/** สิ่งที่ลูกทำในหนึ่งวัน ใช้จำกัดเวลาเล่น ภารกิจประจำวัน ปฏิทิน และกราฟรายสัปดาห์ */
export interface DayLog {
  /** เวลาเล่นจริง ไม่นับตอนพักเกม */
  ms: number;
  games: number;
  /** ข้อที่ลูกตอบถูกแยกตามกิจกรรม missed คือข้อที่ผิดก่อนจะถูก */
  answers: Partial<Record<ActivityId, { seen: number; missed: number }>>;
  bestCombo: number;
  modes: Mode[];
  /** รางวัลพิเศษที่ได้ไปแล้วในวันนั้น กันไม่ให้ได้ซ้ำ */
  rewards: string[];
}

export type Days = Record<string, DayLog>;

/** ข้อมูลของลูกหนึ่งคน ลูกที่กำลังเล่นอยู่เก็บไว้ที่ชั้นบนของ SaveData คนอื่นเก็บใน others */
export interface ChildProfile {
  id: number;
  childName: string;
  childAvatar: string;
  levels: Record<ActivityId, number>;
  stickers: string[];
  plays: number;
  stats: Stats;
  days: Days;
}

export interface SaveData {
  settings: Settings;
  /** ระดับล่าสุดของลูกในแต่ละกิจกรรม */
  levels: Record<ActivityId, number>;
  stickers: string[];
  plays: number;
  /** สถิติการตอบของลูกแยกตามสิ่งที่ฝึก ใช้ทวนข้อที่ผิดบ่อยและสรุปให้ผู้ปกครอง */
  stats: Stats;
  /** รุ่นล่าสุดที่เครื่องนี้บอกผู้เล่นแล้วว่ามีอะไรใหม่ ว่างคือยังไม่เคยจำ */
  seenVersion: string;
  days: Days;
  /** id ของลูกที่กำลังเล่น */
  profileId: number;
  /** ลูกคนอื่นในเครื่องนี้ */
  others: ChildProfile[];
  /** วันที่ (YYYY-MM-DD) ที่ผู้ปกครองให้เล่นต่อเกินเวลาที่ตั้งไว้ */
  extraTimeDay: string;
}

export function defaultLevels(): Record<ActivityId, number> {
  return { counting: 1, money: 1, thai: 1, vowels: 1, english: 1, shapes: 1, compare: 1, pattern: 1, memory: 1 };
}

export function defaultSave(): SaveData {
  return {
    settings: {
      childName: 'หนู',
      parentName: 'พ่อแม่',
      handicap: 'normal',
      sound: true,
      speech: true,
      seating: 'side',
      swapped: false,
      childAvatar: DEFAULT_CHILD_AVATAR,
      parentAvatar: DEFAULT_PARENT_AVATAR,
      dailyLimit: 0,
    },
    levels: defaultLevels(),
    stickers: [],
    plays: 0,
    stats: {},
    seenVersion: '',
    days: {},
    profileId: 1,
    others: [],
    extraTimeDay: '',
  };
}

type Loose = Record<string, unknown>;

const isObject = (v: unknown): v is Loose => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const str = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback);
const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

function normalizeDays(v: unknown): Days {
  if (!isObject(v)) return {};
  const out: Days = {};
  for (const [key, raw] of Object.entries(v)) {
    if (!isObject(raw)) continue;
    out[key] = {
      ms: num(raw.ms, 0),
      games: num(raw.games, 0),
      answers: isObject(raw.answers) ? (raw.answers as DayLog['answers']) : {},
      bestCombo: num(raw.bestCombo, 0),
      modes: strings(raw.modes) as Mode[],
      rewards: strings(raw.rewards),
    };
  }
  return out;
}

function normalizeProfile(v: Loose, base: SaveData): ChildProfile {
  return {
    id: num(v.id, 0),
    childName: str(v.childName, base.settings.childName),
    childAvatar: str(v.childAvatar, base.settings.childAvatar),
    levels: { ...base.levels, ...(isObject(v.levels) ? v.levels : {}) },
    stickers: strings(v.stickers),
    plays: num(v.plays, 0),
    stats: isObject(v.stats) ? (v.stats as Stats) : {},
    days: normalizeDays(v.days),
  };
}

/**
 * เติมค่าที่ขาดด้วยค่าเริ่มต้น ใช้กับข้อมูลจากรุ่นเก่าและข้อมูลสำรองที่นำกลับมา
 * ข้อมูลที่ผิดรูปแบบจะถูกแทนด้วยค่าเริ่มต้น ไม่ทำให้เกมเปิดไม่ขึ้น
 */
export function normalizeSave(raw: unknown): SaveData {
  const base = defaultSave();
  if (!isObject(raw)) return base;
  const others = Array.isArray(raw.others) ? raw.others.filter(isObject).map((p) => normalizeProfile(p, base)) : [];
  return {
    settings: { ...base.settings, ...(isObject(raw.settings) ? raw.settings : {}) },
    levels: { ...base.levels, ...(isObject(raw.levels) ? raw.levels : {}) },
    stickers: strings(raw.stickers),
    plays: num(raw.plays, 0),
    stats: isObject(raw.stats) ? (raw.stats as Stats) : {},
    seenVersion: str(raw.seenVersion, ''),
    days: normalizeDays(raw.days),
    profileId: num(raw.profileId, 1),
    others,
    extraTimeDay: str(raw.extraTimeDay, ''),
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? normalizeSave(JSON.parse(raw)) : defaultSave();
  } catch {
    return defaultSave();
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // โหมดส่วนตัวของ Safari อาจเขียน localStorage ไม่ได้ เกมยังเล่นต่อได้โดยไม่บันทึก
  }
}

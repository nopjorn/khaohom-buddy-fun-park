import type { Handicap, Mode } from '../types';

export const LEVEL_UP_STREAK = 3;
export const LEVEL_DOWN_STREAK = 2;
/** ผู้ปกครองนำตั้งแต่กี่ดาวจึงเริ่มถ่วงเวลาเพิ่ม */
export const CATCH_UP_LEAD = 3;
export const CATCH_UP_EXTRA_MS = 2000;

const BASE_DELAY_MS: Record<Handicap, number> = { low: 500, normal: 1500, high: 3000 };

export interface LevelState {
  level: number;
  /** จำนวนข้อที่ตอบถูกติดกัน */
  ups: number;
  /** จำนวนครั้งที่ตอบผิดติดกัน */
  downs: number;
}

export function newLevelState(level = 1): LevelState {
  return { level, ups: 0, downs: 0 };
}

export function recordAnswer(state: LevelState, correct: boolean, maxLevel: number): LevelState {
  const level = Math.min(Math.max(state.level, 1), maxLevel);
  if (correct) {
    const ups = state.ups + 1;
    if (ups >= LEVEL_UP_STREAK) return newLevelState(Math.min(level + 1, maxLevel));
    return { level, ups, downs: 0 };
  }
  const downs = state.downs + 1;
  if (downs >= LEVEL_DOWN_STREAK) return newLevelState(Math.max(level - 1, 1));
  return { level, ups: 0, downs };
}

/**
 * เวลาที่โจทย์ฝั่งผู้ปกครองขึ้นช้ากว่าฝั่งลูก
 * parentLead คือจำนวนดาวที่ผู้ปกครองนำลูกอยู่ ใช้เฉพาะโหมดแข่งกัน
 */
export function parentDelayMs(handicap: Handicap, mode: Mode, parentLead: number): number {
  const base = BASE_DELAY_MS[handicap];
  if (mode === 'versus' && parentLead >= CATCH_UP_LEAD) return base + CATCH_UP_EXTRA_MS;
  return base;
}

import type { DayLog, Days } from '../core/storage';
import type { ActivityId, Mode } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;
/** เก็บย้อนหลังพอสำหรับเทียบสองสัปดาห์และปฏิทิน ข้อมูลในเครื่องจะได้ไม่โตไม่สิ้นสุด */
export const KEEP_DAYS = 60;

/** วันที่ตามเวลาของเครื่อง รูปแบบ YYYY-MM-DD */
export function dateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** เลื่อนวันที่ไป n วัน คิดแบบ UTC เพื่อไม่ให้เวลาออมแสงทำให้วันเพี้ยน */
export function shiftKey(key: string, n: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  return new Date(d.getTime() + n * DAY_MS).toISOString().slice(0, 10);
}

export function emptyDay(): DayLog {
  return { ms: 0, games: 0, answers: {}, bestCombo: 0, modes: [], rewards: [] };
}

export function dayOf(days: Days, key: string): DayLog {
  return days[key] ?? emptyDay();
}

function update(days: Days, key: string, fn: (day: DayLog) => DayLog): Days {
  const next: Days = { ...days, [key]: fn(dayOf(days, key)) };
  const oldest = shiftKey(key, -KEEP_DAYS);
  for (const k of Object.keys(next)) if (k < oldest) delete next[k];
  return next;
}

export function addPlayTime(days: Days, key: string, ms: number): Days {
  if (ms <= 0) return days;
  return update(days, key, (d) => ({ ...d, ms: d.ms + ms }));
}

export function recordDayAnswer(days: Days, key: string, activity: ActivityId, missed: boolean): Days {
  return update(days, key, (d) => {
    const before = d.answers[activity] ?? { seen: 0, missed: 0 };
    return {
      ...d,
      answers: { ...d.answers, [activity]: { seen: before.seen + 1, missed: before.missed + (missed ? 1 : 0) } },
    };
  });
}

export function recordCombo(days: Days, key: string, combo: number): Days {
  if (combo <= dayOf(days, key).bestCombo) return days;
  return update(days, key, (d) => ({ ...d, bestCombo: combo }));
}

export function recordGame(days: Days, key: string, mode: Mode): Days {
  return update(days, key, (d) => ({
    ...d,
    games: d.games + 1,
    modes: d.modes.includes(mode) ? d.modes : [...d.modes, mode],
  }));
}

export function addReward(days: Days, key: string, reward: string): Days {
  return update(days, key, (d) => ({ ...d, rewards: [...d.rewards, reward] }));
}

/**
 * จำนวนวันที่เล่นจบอย่างน้อยหนึ่งเกมติดต่อกันจนถึงวันนี้
 * ถ้าวันนี้ยังไม่ได้เล่น นับถึงเมื่อวาน เพื่อไม่ให้ตัวเลขหายไปตั้งแต่เช้า
 */
export function streakDays(days: Days, today: string): number {
  let key = dayOf(days, today).games > 0 ? today : shiftKey(today, -1);
  let count = 0;
  while (dayOf(days, key).games > 0) {
    count += 1;
    key = shiftKey(key, -1);
  }
  return count;
}

/** เวลาที่ยังเล่นได้วันนี้เป็นมิลลิวินาที Infinity คือไม่จำกัด */
export function timeLeftMs(days: Days, today: string, limitMinutes: number, extraTimeDay: string): number {
  if (limitMinutes <= 0 || extraTimeDay === today) return Infinity;
  return Math.max(0, limitMinutes * 60_000 - dayOf(days, today).ms);
}

export interface DaySummary {
  key: string;
  seen: number;
  missed: number;
  ms: number;
  games: number;
}

/** สรุป n วันล่าสุด เรียงจากเก่าไปใหม่ วันที่ไม่ได้เล่นเป็นศูนย์ */
export function recentDays(days: Days, today: string, n: number): DaySummary[] {
  return Array.from({ length: n }, (_, i) => {
    const key = shiftKey(today, i - n + 1);
    const day = dayOf(days, key);
    let seen = 0;
    let missed = 0;
    for (const a of Object.values(day.answers)) {
      seen += a?.seen ?? 0;
      missed += a?.missed ?? 0;
    }
    return { key, seen, missed, ms: day.ms, games: day.games };
  });
}

/** ยอดของกิจกรรมหนึ่งในช่วง 7 วัน offset 0 คือ 7 วันล่าสุด offset 1 คือ 7 วันก่อนหน้านั้น */
export function weekTotals(days: Days, today: string, activity: ActivityId, offset: number): { seen: number; missed: number } {
  let seen = 0;
  let missed = 0;
  for (let i = 0; i < 7; i++) {
    const a = dayOf(days, shiftKey(today, -(offset * 7 + i))).answers[activity];
    seen += a?.seen ?? 0;
    missed += a?.missed ?? 0;
  }
  return { seen, missed };
}

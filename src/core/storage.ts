import type { ActivityId, Settings } from '../types';

const KEY = 'buddy-park-v1';

export interface SaveData {
  settings: Settings;
  /** ระดับล่าสุดของลูกในแต่ละกิจกรรม */
  levels: Record<ActivityId, number>;
  stickers: string[];
  plays: number;
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
    },
    levels: { counting: 1, thai: 1, english: 1, pattern: 1, memory: 1 },
    stickers: [],
    plays: 0,
  };
}

export function loadSave(): SaveData {
  const base = defaultSave();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const data = JSON.parse(raw) as Partial<SaveData>;
    return {
      settings: { ...base.settings, ...data.settings },
      levels: { ...base.levels, ...data.levels },
      stickers: Array.isArray(data.stickers) ? data.stickers : [],
      plays: typeof data.plays === 'number' ? data.plays : 0,
    };
  } catch {
    return base;
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // โหมดส่วนตัวของ Safari อาจเขียน localStorage ไม่ได้ เกมยังเล่นต่อได้โดยไม่บันทึก
  }
}

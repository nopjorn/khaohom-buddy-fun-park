import type { SaveData } from './core/storage';
import type { MatchState } from './engine/match';
import type { StickerAward } from './engine/stickers';
import type { Mode, ZoneId } from './types';

export type Route =
  | { name: 'home' }
  | { name: 'zone' }
  | { name: 'mode'; zone: ZoneId }
  | { name: 'play'; zone: ZoneId; mode: Mode }
  | { name: 'result'; zone: ZoneId; mode: Mode; match: MatchState; award: StickerAward }
  | { name: 'stickers' }
  | { name: 'settings' };

export interface App {
  save: SaveData;
  /** บันทึกข้อมูลลงเครื่อง และนำการตั้งค่าเสียงไปใช้ */
  persist(): void;
  go(route: Route): void;
}

export interface ScreenView {
  el: HTMLElement;
  destroy?(): void;
}

// ใช้สัตว์ที่ไม่ปรากฏในโจทย์ จะได้ไม่สับสนกับภาพคำตอบ
export const CHILD_AVATAR = '🐣';
export const PARENT_AVATAR = '🐻';

import type { SaveData } from './core/storage';
import type { StickerSet } from './data/items';
import type { MatchState } from './engine/match';
import type { Bonus } from './engine/rewards';
import type { StickerAward } from './engine/stickers';
import type { Mode, ZoneId } from './types';

export type Route =
  | { name: 'home' }
  | { name: 'zone' }
  | { name: 'mode'; zone: ZoneId }
  | { name: 'play'; zone: ZoneId; mode: Mode }
  | {
      name: 'result';
      zone: ZoneId;
      mode: Mode;
      match: MatchState;
      award: StickerAward;
      bonuses: Bonus[];
      newSets: StickerSet[];
    }
  | { name: 'stickers' }
  | { name: 'settings' }
  | { name: 'report' }
  | { name: 'changelog' }
  | { name: 'profiles' }
  | { name: 'quests' }
  | { name: 'rest' }
  | { name: 'backup' };

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

import { pick } from '../core/rng';
import { SPECIAL_STICKERS, STICKERS, STICKER_SETS, type StickerSet } from '../data/items';
import { BASE_AVATARS } from '../data/avatars';
import type { Rng } from '../types';

export interface StickerAward {
  sticker: string;
  /** false เมื่อสะสมครบแล้วและได้ตัวซ้ำ */
  isNew: boolean;
}

function awardFrom(pool: readonly string[], owned: readonly string[], rng: Rng): StickerAward {
  const missing = pool.filter((s) => !owned.includes(s));
  if (missing.length === 0) return { sticker: pick(rng, pool), isNew: false };
  return { sticker: pick(rng, missing), isNew: true };
}

export function awardSticker(owned: readonly string[], rng: Rng): StickerAward {
  return awardFrom(STICKERS, owned, rng);
}

/** รางวัลพิเศษจากภารกิจและการเล่นต่อเนื่อง ไม่ปนกับสติกเกอร์ปกติ */
export function awardSpecial(owned: readonly string[], rng: Rng): StickerAward {
  return awardFrom(SPECIAL_STICKERS, owned, rng);
}

export function completedSets(owned: readonly string[]): StickerSet[] {
  return STICKER_SETS.filter((set) => set.stickers.every((s) => owned.includes(s)));
}

/** ภาพประจำตัวที่เลือกได้ ภาพพื้นฐานบวกภาพที่ปลดล็อกจากการสะสมครบชุด */
export function unlockedAvatars(owned: readonly string[]): string[] {
  return [...BASE_AVATARS, ...completedSets(owned).flatMap((set) => set.unlocks)];
}

export const ALL_AVATARS = [...BASE_AVATARS, ...STICKER_SETS.flatMap((set) => set.unlocks)];

/** จำนวนสติกเกอร์ปกติที่มี (ไม่นับรางวัลพิเศษ) */
export function regularCount(owned: readonly string[]): number {
  return STICKERS.filter((s) => owned.includes(s)).length;
}

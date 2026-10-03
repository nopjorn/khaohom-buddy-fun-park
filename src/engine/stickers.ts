import { pick } from '../core/rng';
import { STICKERS } from '../data/items';
import type { Rng } from '../types';

export interface StickerAward {
  sticker: string;
  /** false เมื่อสะสมครบแล้วและได้ตัวซ้ำ */
  isNew: boolean;
}

export function awardSticker(owned: readonly string[], rng: Rng): StickerAward {
  const missing = STICKERS.filter((s) => !owned.includes(s));
  if (missing.length === 0) return { sticker: pick(rng, STICKERS), isNew: false };
  return { sticker: pick(rng, missing), isNew: true };
}

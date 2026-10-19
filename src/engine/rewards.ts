import type { SaveData } from '../core/storage';
import type { StickerSet } from '../data/items';
import type { Mode, Rng } from '../types';
import { addReward, dayOf, recordGame, streakDays } from './daylog';
import { QUESTS_PER_DAY, questsDone } from './quests';
import { type StickerAward, awardSpecial, awardSticker, completedSets } from './stickers';

/** จำนวนวันเล่นต่อเนื่องที่ได้รางวัลพิเศษ */
export const STREAK_MILESTONES = [3, 7, 14, 30];

export interface Bonus {
  reason: 'quest' | 'streak';
  award: StickerAward;
  /** จำนวนวันต่อเนื่อง เฉพาะรางวัลการเล่นต่อเนื่อง */
  streak?: number;
}

export interface GameRewards {
  save: SaveData;
  award: StickerAward;
  bonuses: Bonus[];
  /** ชุดสติกเกอร์ที่เพิ่งสะสมครบในเกมนี้ */
  newSets: StickerSet[];
}

/** ให้รางวัลเมื่อเล่นจบหนึ่งเกม: สติกเกอร์ปกติ และรางวัลพิเศษของภารกิจและการเล่นต่อเนื่องที่ยังไม่ได้วันนี้ */
export function finishGame(before: SaveData, mode: Mode, today: string, rng: Rng): GameRewards {
  const setsBefore = completedSets(before.stickers).map((s) => s.id);
  let stickers = before.stickers;
  let days = recordGame(before.days, today, mode);
  const bonuses: Bonus[] = [];

  const award = awardSticker(stickers, rng);
  if (award.isNew) stickers = [...stickers, award.sticker];

  const give = (reason: Bonus['reason'], streak?: number) => {
    const special = awardSpecial(stickers, rng);
    if (special.isNew) stickers = [...stickers, special.sticker];
    days = addReward(days, today, reason);
    bonuses.push({ reason, award: special, streak });
  };

  const day = dayOf(days, today);
  if (!day.rewards.includes('quest') && questsDone(today, day) >= QUESTS_PER_DAY) give('quest');
  const streak = streakDays(days, today);
  if (!day.rewards.includes('streak') && STREAK_MILESTONES.includes(streak)) give('streak', streak);

  return {
    save: { ...before, stickers, days, plays: before.plays + 1 },
    award,
    bonuses,
    newSets: completedSets(stickers).filter((s) => !setsBefore.includes(s.id)),
  };
}

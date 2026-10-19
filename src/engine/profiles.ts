import { type ChildProfile, type SaveData, defaultLevels } from '../core/storage';
import { BASE_AVATARS } from '../data/avatars';

export const MAX_PROFILES = 6;

/** ข้อมูลของลูกที่กำลังเล่นอยู่ ในรูปแบบเดียวกับลูกคนอื่น */
export function activeProfile(save: SaveData): ChildProfile {
  return {
    id: save.profileId,
    childName: save.settings.childName,
    childAvatar: save.settings.childAvatar,
    levels: save.levels,
    stickers: save.stickers,
    plays: save.plays,
    stats: save.stats,
    days: save.days,
  };
}

/** ลูกทุกคน เรียงตามลำดับที่เพิ่ม */
export function allProfiles(save: SaveData): ChildProfile[] {
  return [activeProfile(save), ...save.others].sort((a, b) => a.id - b.id);
}

/** สลับไปเล่นเป็นลูกอีกคน ข้อมูลของคนเดิมย้ายไปเก็บใน others */
export function switchProfile(save: SaveData, id: number): SaveData {
  const next = save.others.find((p) => p.id === id);
  if (!next || id === save.profileId) return save;
  return {
    ...save,
    settings: { ...save.settings, childName: next.childName, childAvatar: next.childAvatar },
    levels: next.levels,
    stickers: next.stickers,
    plays: next.plays,
    stats: next.stats,
    days: next.days,
    profileId: next.id,
    others: [...save.others.filter((p) => p.id !== id), activeProfile(save)].sort((a, b) => a.id - b.id),
  };
}

/** เพิ่มลูกอีกคน เริ่มจากระดับแรกและยังไม่มีสติกเกอร์ */
export function addProfile(save: SaveData, childName: string): SaveData {
  const profiles = allProfiles(save);
  if (profiles.length >= MAX_PROFILES) return save;
  const id = Math.max(...profiles.map((p) => p.id)) + 1;
  const used = profiles.map((p) => p.childAvatar);
  const avatar = BASE_AVATARS.find((a) => !used.includes(a) && a !== save.settings.parentAvatar) ?? BASE_AVATARS[0];
  const profile: ChildProfile = {
    id,
    childName,
    childAvatar: avatar,
    levels: defaultLevels(),
    stickers: [],
    plays: 0,
    stats: {},
    days: {},
  };
  return { ...save, others: [...save.others, profile] };
}

/** ลบลูกที่ไม่ได้กำลังเล่นอยู่ (ลูกที่กำลังเล่นต้องสลับไปคนอื่นก่อน) */
export function removeProfile(save: SaveData, id: number): SaveData {
  return { ...save, others: save.others.filter((p) => p.id !== id) };
}

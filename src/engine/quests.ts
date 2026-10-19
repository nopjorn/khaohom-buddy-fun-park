import type { DayLog } from '../core/storage';
import { mulberry32, pick, sample } from '../core/rng';
import type { ActivityId, Mode } from '../types';

export type Quest =
  | { kind: 'correct'; activity: ActivityId; target: number }
  | { kind: 'games'; target: number }
  | { kind: 'combo'; target: number }
  | { kind: 'mode'; mode: Mode; target: 1 };

/** กิจกรรมที่มีข้อถูกผิดให้นับ (เกมจับคู่ภาพไม่มี) */
export const QUEST_ACTIVITIES: ActivityId[] = ['counting', 'money', 'thai', 'vowels', 'english', 'shapes', 'compare', 'pattern'];
export const QUESTS_PER_DAY = 3;

function seedOf(key: string): number {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) hash = Math.imul(hash ^ key.charCodeAt(i), 16777619);
  return hash >>> 0;
}

/** ภารกิจของวันนั้น ได้ชุดเดิมเสมอสำหรับวันเดียวกัน ไม่ต้องเก็บลงเครื่อง */
export function questsFor(key: string): Quest[] {
  const rng = mulberry32(seedOf(key));
  const extras: Quest[] = [
    { kind: 'games', target: 2 },
    { kind: 'combo', target: 5 },
    { kind: 'mode', mode: pick(rng, ['coop', 'talk', 'versus'] as const), target: 1 },
  ];
  return [
    { kind: 'correct', activity: pick(rng, QUEST_ACTIVITIES), target: pick(rng, [8, 10]) },
    ...sample(rng, extras, QUESTS_PER_DAY - 1),
  ];
}

export function questProgress(quest: Quest, day: DayLog): number {
  const value = (() => {
    switch (quest.kind) {
      case 'correct':
        return day.answers[quest.activity]?.seen ?? 0;
      case 'games':
        return day.games;
      case 'combo':
        return day.bestCombo;
      case 'mode':
        return day.modes.includes(quest.mode) ? 1 : 0;
    }
  })();
  return Math.min(value, quest.target);
}

export function questsDone(key: string, day: DayLog): number {
  return questsFor(key).filter((q) => questProgress(q, day) >= q.target).length;
}

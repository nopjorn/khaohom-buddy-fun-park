/** สถิติของสิ่งที่ลูกฝึกหนึ่งอย่าง เช่น ตัวอักษร ก */
export interface ItemStat {
  /** จำนวนครั้งที่เจอโจทย์นี้ */
  seen: number;
  /** จำนวนครั้งที่ตอบผิดก่อนจะตอบถูก นับไม่เกินหนึ่งต่อโจทย์ */
  missed: number;
}

export type Stats = Record<string, ItemStat>;

/** ข้อที่ผิดทุกครั้งจะถูกสุ่มบ่อยกว่าข้อที่ไม่เคยผิดกี่เท่า (1 + ค่านี้) */
const MAX_EXTRA_WEIGHT = 3;
/** ต้องผิดอย่างน้อยสัดส่วนนี้จึงนับว่ายังไม่แม่น */
const WEAK_RATE = 0.25;

export function recordResult(stats: Stats, id: string, missed: boolean): Stats {
  const before = stats[id] ?? { seen: 0, missed: 0 };
  return { ...stats, [id]: { seen: before.seen + 1, missed: before.missed + (missed ? 1 : 0) } };
}

/**
 * น้ำหนักในการสุ่ม ข้อที่ไม่เคยผิดได้ 1 ข้อที่ผิดบ่อยได้มากขึ้นตามสัดส่วนที่ผิด
 * เมื่อลูกตอบถูกมากขึ้น สัดส่วนจะลดลงและน้ำหนักจะกลับมาใกล้ 1 เอง
 */
export function weightOf(stat: ItemStat | undefined): number {
  if (!stat || stat.seen === 0) return 1;
  return 1 + MAX_EXTRA_WEIGHT * (stat.missed / stat.seen);
}

export interface WeakItem extends ItemStat {
  id: string;
}

/** ข้อที่ลูกยังไม่แม่น เรียงจากผิดบ่อยที่สุด */
export function weakItems(stats: Stats, limit = 12): WeakItem[] {
  return Object.entries(stats)
    .map(([id, stat]) => ({ id, ...stat }))
    .filter((item) => item.missed > 0 && item.missed / item.seen >= WEAK_RATE)
    .sort((a, b) => b.missed / b.seen - a.missed / a.seen || b.missed - a.missed)
    .slice(0, limit);
}

/** ยอดรวมของทุกข้อที่ id ขึ้นต้นด้วย prefix เช่น "thai:" */
export function totalsFor(stats: Stats, prefix: string): ItemStat {
  let seen = 0;
  let missed = 0;
  for (const [id, stat] of Object.entries(stats)) {
    if (!id.startsWith(prefix)) continue;
    seen += stat.seen;
    missed += stat.missed;
  }
  return { seen, missed };
}

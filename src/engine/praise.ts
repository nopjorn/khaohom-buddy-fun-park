import { pick } from '../core/rng';
import type { Rng } from '../types';

/** ตอบถูกติดกันตั้งแต่กี่ข้อจึงเริ่มแสดงตัวนับคอมโบ */
export const COMBO_MIN = 2;

/** ชมที่ 3 ข้อ แล้วชมอีกทุก 5 ข้อ ถ้าชมทุกข้อจะน่ารำคาญและเสียงจะทับโจทย์ถัดไป */
function isPraiseMoment(streak: number): boolean {
  return streak === 3 || (streak >= 5 && streak % 5 === 0);
}

/** คำชมที่เรียกชื่อลูก เมื่อตอบถูกติดกันถึงจังหวะ คืน null ถ้ายังไม่ถึง */
export function praiseFor(streak: number, name: string, rng: Rng): string | null {
  if (!isPraiseMoment(streak)) return null;
  if (streak < 5) return pick(rng, [`เก่งมาก ${name}`, `เยี่ยมเลย ${name}`, `${name} เก่งจัง`]);
  return pick(rng, [`สุดยอด ${name} ถูก ${streak} ข้อติดเลย`, `ว้าว ${name} ถูก ${streak} ข้อติดกันแล้ว`]);
}

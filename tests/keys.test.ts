import { describe, expect, it } from 'vitest';
import { halfOfKey, keyFor, keyLabel } from '../src/core/keys';
import type { KeyHalf } from '../src/types';

const grid = (half: KeyHalf, count: number, cols: number) => {
  const rows = Math.ceil(count / cols);
  return Array.from({ length: count }, (_, i) => keyFor(half, i, cols, rows));
};
const labels = (codes: (string | null)[]) => codes.map((c) => (c ? keyLabel(c) : null)).join(' ');

describe('ผังปุ่มคีย์บอร์ด', () => {
  it('ตัวเลือกแถวเดียวใช้แถวกลางของแต่ละครึ่ง', () => {
    expect(labels(grid('left', 3, 3))).toBe('A S D');
    expect(labels(grid('right', 3, 3))).toBe('J K L');
  });

  it('ตารางหลายแถวเรียงปุ่มตามตำแหน่งบนจอ', () => {
    expect(labels(grid('left', 4, 2))).toBe('Q W A S');
    expect(labels(grid('left', 3, 1))).toBe('Q A Z');
    expect(labels(grid('right', 6, 3))).toBe('U I O J K L');
    expect(labels(grid('right', 6, 2))).toBe('U I J K M ,');
  });

  it('กระดานจับคู่ภาพใช้ได้ถึง 4 x 4 โดยเริ่มจากแถวตัวเลข', () => {
    expect(labels(grid('left', 12, 4))).toBe('Q W E R A S D F Z X C V');
    expect(labels(grid('left', 16, 4))).toBe('1 2 3 4 Q W E R A S D F Z X C V');
    expect(labels(grid('right', 16, 4))).toBe('7 8 9 0 U I O P J K L ; M , . /');
  });

  it('ตารางที่ใหญ่เกินผังแป้นไม่มีปุ่ม', () => {
    expect(grid('right', 16, 8)).toEqual(Array(16).fill(null));
    expect(keyFor('left', 0, 1, 5)).toBeNull();
  });

  it('ปุ่มของสองครึ่งไม่ซ้ำกัน และบอกได้ว่าอยู่ครึ่งไหน', () => {
    const left = grid('left', 16, 4) as string[];
    const right = grid('right', 16, 4) as string[];
    expect(new Set([...left, ...right]).size).toBe(32);
    for (const code of left) expect(halfOfKey(code)).toBe('left');
    for (const code of right) expect(halfOfKey(code)).toBe('right');
    for (const code of ['Space', 'Enter', 'Escape', 'KeyT', 'KeyY']) expect(halfOfKey(code)).toBeNull();
  });
});

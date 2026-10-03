import { keycap } from '../core/dom';
import { keyFor, keyLabel } from '../core/keys';
import type { KeyHalf } from '../types';

/**
 * ผูกปุ่มคีย์บอร์ดให้ช่องในตารางที่มี cols คอลัมน์ และติดป้ายชื่อปุ่มไว้ที่มุมของแต่ละช่อง
 * เรียกซ้ำได้เมื่อผู้เล่นสลับฝั่ง ป้ายเดิมจะถูกแทนที่
 * คืนแผนที่จากรหัสปุ่มไปยังลำดับของช่อง
 */
export function bindKeys(half: KeyHalf, cells: HTMLElement[], cols: number): Map<string, number> {
  const rows = Math.ceil(cells.length / cols);
  const keys = new Map<string, number>();
  cells.forEach((cell, i) => {
    cell.querySelector(':scope > .keycap')?.remove();
    const code = keyFor(half, i, cols, rows);
    if (!code) return;
    keys.set(code, i);
    cell.append(keycap(keyLabel(code)));
  });
  return keys;
}

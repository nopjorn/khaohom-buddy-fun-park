import type { KeyHalf } from '../types';

/**
 * ผังแป้นของแต่ละครึ่งคีย์บอร์ด เรียงตามตำแหน่งจริง ผู้เล่นที่แผงอยู่ฝั่งซ้ายของจอใช้ครึ่งซ้าย
 * ใช้ event.code จึงไม่ขึ้นกับว่าคีย์บอร์ดกำลังพิมพ์ภาษาไทยหรืออังกฤษ
 */
const KEY_ROWS: Record<KeyHalf, string[][]> = {
  left: [
    ['Digit1', 'Digit2', 'Digit3', 'Digit4'],
    ['KeyQ', 'KeyW', 'KeyE', 'KeyR'],
    ['KeyA', 'KeyS', 'KeyD', 'KeyF'],
    ['KeyZ', 'KeyX', 'KeyC', 'KeyV'],
  ],
  right: [
    ['Digit7', 'Digit8', 'Digit9', 'Digit0'],
    ['KeyU', 'KeyI', 'KeyO', 'KeyP'],
    ['KeyJ', 'KeyK', 'KeyL', 'Semicolon'],
    ['KeyM', 'Comma', 'Period', 'Slash'],
  ],
};

const SYMBOLS: Record<string, string> = { Semicolon: ';', Comma: ',', Period: '.', Slash: '/' };

/** ตัวอักษรที่พิมพ์อยู่บนแป้น ใช้แสดงบนจอ */
export function keyLabel(code: string): string {
  return SYMBOLS[code] ?? code.replace(/^(Key|Digit)/, '');
}

export function halfOfKey(code: string): KeyHalf | null {
  if (KEY_ROWS.left.some((row) => row.includes(code))) return 'left';
  if (KEY_ROWS.right.some((row) => row.includes(code))) return 'right';
  return null;
}

/**
 * ปุ่มของช่องที่ index ในตาราง cols x rows โดยตำแหน่งปุ่มบนคีย์บอร์ดตรงกับตำแหน่งช่องบนจอ
 * คืน null เมื่อตารางใหญ่เกินผังแป้น ช่องนั้นจะกดได้ด้วยเมาส์หรือนิ้วเท่านั้น
 */
export function keyFor(half: KeyHalf, index: number, cols: number, rows: number): string | null {
  const layout = KEY_ROWS[half];
  if (cols > layout[0].length || rows > layout.length) return null;
  // ตารางแถวเดียวใช้แถวกลาง (A S D) ซึ่งหาง่ายที่สุด ตาราง 4 แถวต้องเริ่มจากแถวตัวเลข
  const firstRow = rows === 1 ? 2 : rows === 4 ? 0 : 1;
  return layout[firstRow + Math.floor(index / cols)]?.[index % cols] ?? null;
}

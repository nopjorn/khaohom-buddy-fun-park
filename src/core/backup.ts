import { type SaveData, normalizeSave } from './storage';

/** รหัสสำรองขึ้นต้นด้วยตัวนี้ เพื่อแยกออกจากข้อความอื่นที่วางผิด */
const PREFIX = 'KBP1:';

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(code: string): string {
  const binary = atob(code);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** รหัสสำรองแบบข้อความ คัดลอกไปวางในโน้ตหรือส่งให้ตัวเองได้ */
export function encodeBackup(save: SaveData): string {
  return PREFIX + toBase64(JSON.stringify(save));
}

/** อ่านได้ทั้งรหัสสำรองและไฟล์ JSON ที่ดาวน์โหลดไว้ คืน null ถ้าไม่ใช่ข้อมูลของเกมนี้ */
export function decodeBackup(text: string): SaveData | null {
  const trimmed = text.trim();
  try {
    const json = trimmed.startsWith(PREFIX) ? fromBase64(trimmed.slice(PREFIX.length).replace(/\s+/g, '')) : trimmed;
    const data: unknown = JSON.parse(json);
    if (typeof data !== 'object' || data === null || !('settings' in data) || !('levels' in data)) return null;
    return normalizeSave(data);
  } catch {
    return null;
  }
}

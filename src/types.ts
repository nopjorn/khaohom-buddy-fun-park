export type Side = 'child' | 'parent';
export type Mode = 'coop' | 'versus';
export type ZoneId = 'numbers' | 'thai' | 'english' | 'brain' | 'mix';
export type ActivityId = 'counting' | 'thai' | 'english' | 'pattern' | 'memory';
export type Handicap = 'low' | 'normal' | 'high';
export type Seating = 'side' | 'facing';
export type Lang = 'th-TH' | 'en-US';
/** ครึ่งของคีย์บอร์ดที่ผู้เล่นใช้ ขึ้นกับว่าแผงของตัวเองอยู่ฝั่งไหนของจอ */
export type KeyHalf = 'left' | 'right';

/** ตัวสุ่มที่คืนค่าในช่วง [0, 1) */
export type Rng = () => number;

export interface SayPart {
  text: string;
  lang: Lang;
}

export type Visual =
  | { kind: 'groups'; groups: string[][]; joiner?: string }
  | { kind: 'glyph'; text: string; caption?: string }
  | { kind: 'sequence'; items: string[] };

export type Choice =
  | { kind: 'emoji'; label: string }
  | { kind: 'text'; label: string }
  | { kind: 'group'; label: string; count: number };

export interface Question {
  text: string;
  visual?: Visual;
  say: SayPart[];
  choices: Choice[];
  /** ตำแหน่งของคำตอบที่ถูกใน choices */
  answer: number;
}

export interface ActivityHost {
  side: Side;
  keyHalf: KeyHalf;
  onCorrect(): void;
  onWrong(): void;
  /** จบรอบแล้ว ขอโจทย์ถัดไป */
  onDone(): void;
  speak(parts: SayPart[]): void;
}

export interface Activity {
  /** ใช้กันไม่ให้ได้โจทย์เดิมซ้ำติดกัน */
  key: string;
  mount(el: HTMLElement, host: ActivityHost): void;
  /** ทำให้คำตอบที่ถูกขยับเป็นคำใบ้ */
  hint(): void;
  /** อ่านโจทย์ซ้ำ */
  repeat(): void;
  /** รับปุ่มคีย์บอร์ด (event.code) ที่เป็นของฝั่งนี้ */
  pressKey(code: string): void;
  /** เปลี่ยนครึ่งคีย์บอร์ดที่ใช้ เมื่อผู้เล่นสลับฝั่งกลางเกม */
  rebindKeys(half: KeyHalf): void;
  destroy(): void;
}

export interface ActivityDef {
  id: ActivityId;
  /** ระดับของลูกคือ 1..maxLevel ส่วน maxLevel + 1 เป็นระดับของผู้ปกครอง */
  maxLevel: number;
  create(level: number, rng: Rng): Activity;
}

export interface Settings {
  childName: string;
  parentName: string;
  handicap: Handicap;
  sound: boolean;
  speech: boolean;
  seating: Seating;
  /** true เมื่อสลับให้ลูกไปอยู่ฝั่งขวา (หรือด้านบนในท่านั่งตรงข้าม) */
  swapped: boolean;
}

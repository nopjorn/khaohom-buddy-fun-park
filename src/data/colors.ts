export interface Named {
  key: string;
  name: string;
}

/** ลำดับสีตรงกับลำดับ emoji ใน SHAPE_EMOJI */
export const COLORS: Named[] = [
  { key: 'red', name: 'สีแดง' },
  { key: 'blue', name: 'สีน้ำเงิน' },
  { key: 'yellow', name: 'สีเหลือง' },
  { key: 'green', name: 'สีเขียว' },
  { key: 'purple', name: 'สีม่วง' },
  { key: 'orange', name: 'สีส้ม' },
];

export const SHAPES: Named[] = [
  { key: 'circle', name: 'วงกลม' },
  { key: 'square', name: 'สี่เหลี่ยม' },
  { key: 'heart', name: 'หัวใจ' },
];

// ใช้เฉพาะรูปทรงที่มีครบทุกสีบน iOS สามเหลี่ยมกับข้าวหลามตัดมีไม่กี่สีจึงไม่ใช้
export const SHAPE_EMOJI: Record<string, string[]> = {
  circle: ['🔴', '🔵', '🟡', '🟢', '🟣', '🟠'],
  square: ['🟥', '🟦', '🟨', '🟩', '🟪', '🟧'],
  heart: ['❤️', '💙', '💛', '💚', '💜', '🧡'],
};

export function shapeEmoji(shape: string, color: string): string {
  return SHAPE_EMOJI[shape][COLORS.findIndex((c) => c.key === color)];
}

/** ของที่ใช้เทียบขนาด ต้องดูออกแม้ย่อให้เล็ก */
export const SIZE_ITEMS = ['🐘', '🐶', '🍎', '🚗', '🎈', '🐟', '🌳', '🐢'];
/** ของที่ใช้ถามตำแหน่งซ้ายขวา */
export const ROW_ITEMS = ['🐶', '🐱', '🐰', '🐸', '🐷', '🐵', '🍎', '🍌', '🚗', '⚽', '🌸', '🎈'];

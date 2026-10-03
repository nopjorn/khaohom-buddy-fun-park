import { sfx } from '../core/audio';
import { h, onTap } from '../core/dom';

type Content = Node | string;

export function button(className: string, content: Content | Content[], handler: () => void): HTMLButtonElement {
  const parts = Array.isArray(content) ? content : [content];
  const btn = h('button', { class: className, type: 'button' }, ...parts);
  onTap(btn, () => {
    sfx.tap();
    handler();
  });
  return btn;
}

export function topBar(title: string, onBack: () => void): HTMLElement {
  const back = button('btn btn-round', '←', onBack);
  back.setAttribute('aria-label', 'ย้อนกลับ');
  return h('div', { class: 'topbar' }, back, h('h2', { class: 'topbar-title' }, title));
}

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

/** ปุ่มเลือกหนึ่งค่าจากหลายตัวเลือก */
export function segmented<T extends string>(
  options: SegmentOption<T>[],
  current: T,
  onChange: (value: T) => void,
): HTMLElement {
  const buttons = options.map((option) => {
    const btn = button('seg-btn', option.label, () => {
      buttons.forEach((b) => b.classList.toggle('on', b === btn));
      onChange(option.value);
    });
    btn.classList.toggle('on', option.value === current);
    return btn;
  });
  return h('div', { class: 'segmented' }, ...buttons);
}

/** โปรยของตกแต่งตอนฉลอง */
export function confetti(pieces = ['🎉', '⭐', '🎈', '✨', '🌟', '🎊'], count = 28): HTMLElement {
  const wrap = h('div', { class: 'confetti' });
  for (let i = 0; i < count; i++) {
    const piece = h('span', null, pieces[i % pieces.length]);
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.animationDuration = `${2.4 + Math.random() * 2.4}s`;
    piece.style.animationDelay = `${Math.random() * 1.5}s`;
    piece.style.fontSize = `${1.6 + Math.random() * 1.8}rem`;
    wrap.append(piece);
  }
  return wrap;
}

import { zoneById } from '../activities';
import type { App, ScreenView } from '../app';
import { h } from '../core/dom';
import { COOP_TARGET, VERSUS_TARGET } from '../engine/match';
import type { Mode, ZoneId } from '../types';
import { button, topBar } from './ui';

const MODES: { id: Mode; icon: string; name: string; hint: string; color: string }[] = [
  {
    id: 'coop',
    icon: '🤝',
    name: 'ช่วยกัน',
    hint: `เติมพลังจรวดให้ครบ ${COOP_TARGET} ช่อง`,
    color: '#2dc653',
  },
  {
    id: 'talk',
    icon: '💬',
    name: 'คุยกัน',
    hint: 'คนหนึ่งเห็นโจทย์ อีกคนกดคำตอบ',
    color: '#9b5de5',
  },
  {
    id: 'versus',
    icon: '🏁',
    name: 'แข่งกัน',
    hint: `ใครเก็บได้ ${VERSUS_TARGET} ดาวก่อนชนะ`,
    color: '#ff9f1c',
  },
];

export function modeScreen(app: App, zone: ZoneId): ScreenView {
  const zoneDef = zoneById(zone);
  const cards = MODES.map((mode) => {
    const card = button(
      'card card-big',
      [
        h('span', { class: 'card-icon' }, mode.icon),
        h('span', { class: 'card-name' }, mode.name),
        h('span', { class: 'card-hint' }, mode.hint),
      ],
      () => app.go({ name: 'play', zone, mode: mode.id }),
    );
    card.style.setProperty('--accent', mode.color);
    return card;
  });

  const el = h(
    'div',
    { class: 'screen' },
    topBar(`${zoneDef.icon} ${zoneDef.name}`, () => app.go({ name: 'zone' })),
    h('div', { class: 'screen-main' }, h('div', { class: 'cards cards-modes' }, ...cards)),
  );
  return { el };
}

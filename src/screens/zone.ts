import { ZONES } from '../activities';
import type { App, ScreenView } from '../app';
import { h } from '../core/dom';
import type { ZoneId } from '../types';
import { button, topBar } from './ui';

const ZONE_COLORS: Record<ZoneId, string> = {
  numbers: '#ff9f1c',
  thai: '#ff5d8f',
  english: '#4d8dff',
  brain: '#9b5de5',
  mix: '#2dc653',
};

export function zoneScreen(app: App): ScreenView {
  const cards = ZONES.map((zone) => {
    const card = button(
      'card',
      [
        h('span', { class: 'card-icon' }, zone.icon),
        h('span', { class: 'card-name' }, zone.name),
        h('span', { class: 'card-hint' }, zone.hint),
      ],
      () => app.go({ name: 'mode', zone: zone.id }),
    );
    card.style.setProperty('--accent', ZONE_COLORS[zone.id]);
    return card;
  });

  const el = h(
    'div',
    { class: 'screen' },
    topBar('วันนี้เล่นอะไรดี?', () => app.go({ name: 'home' })),
    h('div', { class: 'screen-main' }, h('div', { class: 'cards cards-zones' }, ...cards)),
  );
  return { el };
}

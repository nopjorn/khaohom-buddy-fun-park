import type { App, ScreenView } from '../app';
import { h } from '../core/dom';
import { STICKERS } from '../data/items';
import { topBar } from './ui';

export function stickersScreen(app: App): ScreenView {
  const owned = new Set(app.save.stickers);
  const cells = STICKERS.map((sticker) =>
    owned.has(sticker)
      ? h('div', { class: 'sticker' }, sticker)
      : h('div', { class: 'sticker locked' }, '❔'),
  );

  const el = h(
    'div',
    { class: 'screen scrollable' },
    topBar(`📒 สมุดสติกเกอร์ ${owned.size}/${STICKERS.length}`, () => app.go({ name: 'home' })),
    h('p', { class: 'subtitle' }, 'เล่นจบหนึ่งเกม ได้สติกเกอร์หนึ่งดวง'),
    h('div', { class: 'sticker-grid' }, ...cells),
  );
  return { el };
}

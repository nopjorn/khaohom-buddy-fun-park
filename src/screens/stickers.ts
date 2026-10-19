import type { App, ScreenView } from '../app';
import { h } from '../core/dom';
import { SPECIAL_STICKERS, STICKERS, STICKER_SETS } from '../data/items';
import { regularCount } from '../engine/stickers';
import { topBar } from './ui';

export function stickersScreen(app: App): ScreenView {
  const owned = new Set(app.save.stickers);
  const cell = (sticker: string) =>
    owned.has(sticker) ? h('div', { class: 'sticker' }, sticker) : h('div', { class: 'sticker locked' }, '❔');

  const sets = STICKER_SETS.map((set) => {
    const count = set.stickers.filter((s) => owned.has(s)).length;
    const complete = count === set.stickers.length;
    return h(
      'div',
      { class: complete ? 'sticker-set complete' : 'sticker-set' },
      h(
        'div',
        { class: 'sticker-set-head' },
        `${set.icon} ชุด${set.name} ${count}/${set.stickers.length}`,
        h('span', { class: 'sticker-set-unlock' }, complete ? `🏆 ปลดล็อก ${set.unlocks.join(' ')}` : `ครบชุดได้ ${set.unlocks.map(() => '🔒').join(' ')}`),
      ),
      h('div', { class: 'sticker-grid' }, ...set.stickers.map(cell)),
    );
  });

  const specials = SPECIAL_STICKERS.filter((s) => owned.has(s));

  const el = h(
    'div',
    { class: 'screen scrollable' },
    topBar(`📒 สมุดสติกเกอร์ ${regularCount(app.save.stickers)}/${STICKERS.length}`, () => app.go({ name: 'home' })),
    h('p', { class: 'subtitle' }, 'เล่นจบหนึ่งเกม ได้สติกเกอร์หนึ่งดวง สะสมครบชุดปลดล็อกภาพประจำตัวใหม่'),
    ...sets,
    h(
      'div',
      { class: 'sticker-set special' },
      h('div', { class: 'sticker-set-head' }, `🎁 รางวัลพิเศษ ${specials.length}/${SPECIAL_STICKERS.length}`),
      specials.length > 0
        ? h('div', { class: 'sticker-grid' }, ...specials.map(cell))
        : h('div', { class: 'field-note' }, 'ทำภารกิจวันนี้ครบ หรือเล่นต่อเนื่อง 3 วัน จะได้รางวัลพิเศษ'),
    ),
  );
  return { el };
}

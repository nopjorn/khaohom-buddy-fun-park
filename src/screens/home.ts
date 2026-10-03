import type { App, ScreenView } from '../app';
import { h, onHold } from '../core/dom';
import { versionLabel } from '../core/version';
import { STICKERS } from '../data/items';
import { button } from './ui';

const SETTINGS_HOLD_MS = 2000;

export function homeScreen(app: App): ScreenView {
  const play = button('btn btn-go btn-xl', '▶ เล่นเลย', () => app.go({ name: 'zone' }));
  const stickers = button('btn', `📒 สติกเกอร์ ${app.save.stickers.length}/${STICKERS.length}`, () =>
    app.go({ name: 'stickers' }),
  );

  // กดค้างเพื่อกันเด็กกดเข้าหน้าตั้งค่าโดยไม่ตั้งใจ
  const settings = h(
    'button',
    { class: 'btn btn-hold', type: 'button' },
    '⚙️ ผู้ปกครอง',
    h('small', null, 'กดค้างไว้'),
  );
  onHold(settings, SETTINGS_HOLD_MS, () => app.go({ name: 'settings' }));

  const el = h(
    'div',
    { class: 'screen home' },
    h(
      'div',
      { class: 'screen-main' },
      h('div', { class: 'home-art' }, '🎡'),
      h('h1', { class: 'title' }, 'สวนสนุกคู่หู'),
      h('p', { class: 'subtitle' }, 'เกมสองคน เล่นพร้อมกันทั้งลูกและพ่อแม่'),
      play,
      h('div', { class: 'home-row' }, stickers, settings),
      // ให้เห็นว่าเกมที่เปิดอยู่เป็นรุ่นล่าสุดหลัง deploy หรือยัง
      h('div', { class: 'version' }, versionLabel()),
    ),
  );
  return { el };
}

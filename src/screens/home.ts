import type { App, ScreenView } from '../app';
import { h, onHold } from '../core/dom';
import { isUpdateReady, onUpdateReady, reloadToUpdate } from '../core/update';
import { APP_VERSION, versionLabel } from '../core/version';
import { CHANGELOG, unseenChanges } from '../data/changelog';
import { STICKERS } from '../data/items';
import { button } from './ui';

const SETTINGS_HOLD_MS = 2000;

// แสดงเฉพาะหน้าแรก เพราะการโหลดหน้าใหม่กลางเกมจะทำให้เกมที่เล่นอยู่หายไป
function updateBar(): HTMLElement {
  return h(
    'div',
    { class: 'update-bar' },
    '✨ มีรุ่นใหม่แล้ว',
    button('btn btn-go', '🔄 โหลดเลย', reloadToUpdate),
  );
}

function whatsNew(app: App, version: string): HTMLElement {
  const close = () => popup.remove();
  const popup = h(
    'div',
    { class: 'overlay' },
    h(
      'div',
      { class: 'whats-new' },
      h('div', { class: 'overlay-title' }, '🎉 อัปเดตแล้ว'),
      h('p', { class: 'subtitle' }, `ตอนนี้เป็นรุ่น v${version}`),
      h(
        'div',
        { class: 'whats-new-row' },
        button('btn btn-go', '📜 ดูว่ามีอะไรใหม่', () => app.go({ name: 'changelog' })),
        button('btn', 'ปิด', close),
      ),
    ),
  );
  return popup;
}

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

  // ให้เห็นว่าเกมที่เปิดอยู่เป็นรุ่นล่าสุดหลัง deploy หรือยัง แตะเพื่อดูว่าแต่ละรุ่นมีอะไรใหม่
  const version = button('version version-link', versionLabel(), () => app.go({ name: 'changelog' }));

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
      version,
    ),
  );

  const showUpdate = () => {
    if (!el.querySelector('.update-bar')) el.append(updateBar());
  };
  if (isUpdateReady()) showUpdate();
  const unsubscribe = onUpdateReady(showUpdate);

  const { save } = app;
  const fresh = save.plays === 0 && save.stickers.length === 0;
  if (save.seenVersion !== APP_VERSION) {
    if (unseenChanges(CHANGELOG, APP_VERSION, save.seenVersion, fresh).length > 0) {
      el.append(whatsNew(app, APP_VERSION));
    }
    save.seenVersion = APP_VERSION;
    app.persist();
  }

  return { el, destroy: unsubscribe };
}

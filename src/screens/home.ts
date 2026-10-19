import type { App, ScreenView } from '../app';
import { h, onHold } from '../core/dom';
import { isUpdateReady, onUpdateReady, reloadToUpdate } from '../core/update';
import { APP_VERSION, versionLabel } from '../core/version';
import { CHANGELOG, unseenChanges } from '../data/changelog';
import { STICKERS } from '../data/items';
import { dateKey, dayOf, streakDays, timeLeftMs } from '../engine/daylog';
import { allProfiles } from '../engine/profiles';
import { QUESTS_PER_DAY, questsDone } from '../engine/quests';
import { regularCount } from '../engine/stickers';
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
  const { save } = app;
  const today = dateKey(new Date());
  const play = button('btn btn-go btn-xl', '▶ เล่นเลย', () => app.go({ name: 'zone' }));
  const stickers = button('btn', `📒 สติกเกอร์ ${regularCount(save.stickers)}/${STICKERS.length}`, () =>
    app.go({ name: 'stickers' }),
  );
  const streak = streakDays(save.days, today);
  const quests = button(
    'btn',
    [
      `⭐ ภารกิจ ${questsDone(today, dayOf(save.days, today))}/${QUESTS_PER_DAY}`,
      h('small', null, streak > 0 ? `🔥 เล่นต่อเนื่อง ${streak} วัน` : 'ภารกิจวันนี้'),
    ],
    () => app.go({ name: 'quests' }),
  );

  // มีลูกหลายคนจึงเปลี่ยนคนเล่นได้ ถ้ามีคนเดียวแสดงภาพประจำตัวไว้เฉย ๆ
  const many = allProfiles(save).length > 1;
  const player = button(
    many ? 'player-chip' : 'player-chip single',
    [
      h('span', { class: 'player-avatar' }, save.settings.childAvatar),
      h('span', null, save.settings.childName),
      many ? h('small', null, '🔄 เปลี่ยนคน') : null,
    ].filter((x): x is HTMLElement => x !== null),
    () => {
      if (many) app.go({ name: 'profiles' });
    },
  );

  const left = timeLeftMs(save.days, today, save.settings.dailyLimit, save.extraTimeDay);
  const timeNote =
    left === Infinity
      ? null
      : h('div', { class: 'time-note' }, left > 0 ? `⏰ วันนี้เล่นได้อีก ${Math.ceil(left / 60_000)} นาที` : '😴 วันนี้เล่นครบเวลาแล้ว');

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
    player,
    h(
      'div',
      { class: 'screen-main' },
      h('div', { class: 'home-art' }, '🎡'),
      h('h1', { class: 'title' }, 'สวนสนุกคู่หู'),
      h('p', { class: 'subtitle' }, 'เกมสองคน เล่นพร้อมกันทั้งลูกและพ่อแม่'),
      play,
      timeNote,
      h('div', { class: 'home-row' }, stickers, quests, settings),
      version,
    ),
  );

  const showUpdate = () => {
    if (!el.querySelector('.update-bar')) el.append(updateBar());
  };
  if (isUpdateReady()) showUpdate();
  const unsubscribe = onUpdateReady(showUpdate);

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

import type { App, ScreenView } from '../app';
import { h, onHold } from '../core/dom';
import { speak } from '../core/speech';
import { dateKey } from '../engine/daylog';
import { button } from './ui';

const EXTRA_HOLD_MS = 2000;

/** หน้าพักเมื่อเล่นครบเวลาที่ผู้ปกครองตั้งไว้ในวันนั้น */
export function restScreen(app: App): ScreenView {
  const { settings } = app.save;

  // กดค้างเพื่อกันลูกกดให้ตัวเองเล่นต่อ
  const extra = h(
    'button',
    { class: 'btn btn-hold', type: 'button' },
    '⏰ ให้เล่นต่อวันนี้',
    h('small', null, 'ผู้ปกครองกดค้างไว้'),
  );
  onHold(extra, EXTRA_HOLD_MS, () => {
    app.save.extraTimeDay = dateKey(new Date());
    app.persist();
    app.go({ name: 'zone' });
  });

  const el = h(
    'div',
    { class: 'screen' },
    h(
      'div',
      { class: 'screen-main' },
      h('div', { class: 'home-art' }, '😴'),
      h('h1', { class: 'title' }, 'พักสายตากันนะ'),
      h('p', { class: 'subtitle' }, `วันนี้${settings.childName}เล่นครบ ${settings.dailyLimit} นาทีแล้ว พรุ่งนี้มาเล่นกันใหม่นะ`),
      button('btn btn-go btn-xl', '🏠 กลับหน้าแรก', () => app.go({ name: 'home' })),
      extra,
    ),
  );
  speak([{ text: `วันนี้เล่นครบเวลาแล้ว พักสายตากันนะ ${settings.childName}`, lang: 'th-TH' }]);
  return { el };
}

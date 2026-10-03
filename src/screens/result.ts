import { type App, CHILD_AVATAR, PARENT_AVATAR, type Route, type ScreenView } from '../app';
import { h } from '../core/dom';
import { speak } from '../core/speech';
import { coopRating, talkRating } from '../engine/match';
import { button, confetti } from './ui';

type ResultRoute = Extract<Route, { name: 'result' }>;

export function resultScreen(app: App, route: ResultRoute): ScreenView {
  const { zone, mode, match, award } = route;
  const { childName, parentName } = app.save.settings;

  let title: string;
  let detail: HTMLElement;
  let cheer: string;

  if (mode === 'coop') {
    title = '🚀 จรวดออกเดินทางแล้ว!';
    cheer = 'จรวดออกเดินทางแล้ว เก่งมากเลย';
    detail = h(
      'div',
      { class: 'result-detail' },
      h('div', { class: 'result-stars' }, '⭐'.repeat(coopRating(match))),
      h('div', { class: 'result-note' }, `🙌 ไฮไฟว์ ${match.highFives} ครั้ง`),
    );
  } else if (mode === 'talk') {
    title = '🚀 จรวดออกเดินทางแล้ว!';
    cheer = 'จรวดออกเดินทางแล้ว คุยกันเก่งมากเลย';
    detail = h(
      'div',
      { class: 'result-detail' },
      h('div', { class: 'result-stars' }, '⭐'.repeat(talkRating(match))),
      h('div', { class: 'result-note' }, match.wrong === 0 ? '💬 ไม่ผิดเลยสักข้อ!' : `💬 กดผิด ${match.wrong} ครั้ง`),
    );
  } else {
    const winnerName = match.winner === 'child' ? childName : parentName;
    title = `🏆 ${winnerName} ชนะ!`;
    cheer = `${winnerName} ชนะ เก่งมากทั้งคู่เลย`;
    detail = h('div', { class: 'result-note' }, 'เก่งมากทั้งคู่เลย 👏');
  }

  const scoreUnit = mode === 'versus' ? 'ดาว' : 'ข้อ';
  const scores = h(
    'div',
    { class: 'result-scores' },
    h('div', { class: 'score-card score-child' }, `${CHILD_AVATAR} ${childName}`, h('b', null, `${match.score.child} ${scoreUnit}`)),
    h('div', { class: 'score-card score-parent' }, `${PARENT_AVATAR} ${parentName}`, h('b', null, `${match.score.parent} ${scoreUnit}`)),
  );

  const sticker = h(
    'div',
    { class: 'sticker-award' },
    h('span', { class: 'sticker-award-icon' }, award.sticker),
    h('span', null, award.isNew ? 'ได้สติกเกอร์ใหม่!' : 'สะสมสติกเกอร์ครบแล้ว!'),
  );

  const el = h(
    'div',
    { class: 'screen result' },
    confetti(),
    h(
      'div',
      { class: 'screen-main' },
      h('h1', { class: 'title' }, title),
      detail,
      scores,
      sticker,
      h(
        'div',
        { class: 'home-row' },
        button('btn btn-go', '🔁 เล่นอีกครั้ง', () => app.go({ name: 'play', zone, mode })),
        button('btn', '🗺️ เลือกเกมใหม่', () => app.go({ name: 'zone' })),
        button('btn', '🏠 หน้าแรก', () => app.go({ name: 'home' })),
      ),
    ),
  );

  speak([{ text: cheer, lang: 'th-TH' }]);
  return { el };
}

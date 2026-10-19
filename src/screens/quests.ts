import { ACTIVITY_NAMES } from '../activities';
import type { App, ScreenView } from '../app';
import { h } from '../core/dom';
import { dateKey, dayOf, recentDays, streakDays } from '../engine/daylog';
import { type Quest, questProgress, questsFor } from '../engine/quests';
import { STREAK_MILESTONES } from '../engine/rewards';
import type { Mode } from '../types';
import { topBar } from './ui';

const CALENDAR_DAYS = 14;
const MODE_NAMES: Record<Mode, string> = { coop: '🤝 ช่วยกัน', talk: '💬 คุยกัน', versus: '🏁 แข่งกัน' };
const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

export function questLabel(quest: Quest): string {
  switch (quest.kind) {
    case 'correct':
      return `ตอบ ${ACTIVITY_NAMES[quest.activity]} ถูก ${quest.target} ข้อ`;
    case 'games':
      return `เล่นจบ ${quest.target} เกม`;
    case 'combo':
      return `ตอบถูกติดกัน ${quest.target} ข้อ 🔥`;
    case 'mode':
      return `เล่นโหมด ${MODE_NAMES[quest.mode]} 1 เกม`;
  }
}

/** ภารกิจประจำวันและปฏิทินการเล่นต่อเนื่องของลูกที่กำลังเล่น */
export function questsScreen(app: App): ScreenView {
  const today = dateKey(new Date());
  const day = dayOf(app.save.days, today);

  const quests = questsFor(today).map((quest) => {
    const progress = questProgress(quest, day);
    const done = progress >= quest.target;
    const bar = h('div', { class: 'quest-bar' }, h('div', { class: 'quest-fill' }));
    (bar.firstChild as HTMLElement).style.width = `${(progress / quest.target) * 100}%`;
    return h(
      'div',
      { class: done ? 'quest done' : 'quest' },
      h('span', { class: 'quest-icon' }, done ? '✅' : '⭐'),
      h('span', { class: 'quest-label' }, questLabel(quest)),
      h('span', { class: 'quest-count' }, `${progress}/${quest.target}`),
      bar,
    );
  });

  const streak = streakDays(app.save.days, today);
  const next = STREAK_MILESTONES.find((m) => m > streak);
  const calendar = recentDays(app.save.days, today, CALENDAR_DAYS).map((d) => {
    const weekday = WEEKDAYS[new Date(`${d.key}T00:00:00`).getDay()];
    return h(
      'div',
      { class: d.games > 0 ? 'cal-day played' : 'cal-day' },
      h('span', { class: 'cal-weekday' }, weekday),
      h('span', { class: 'cal-mark' }, d.games > 0 ? '⭐' : d.key === today ? '❔' : '·'),
      h('span', { class: 'cal-date' }, String(Number(d.key.slice(8)))),
    );
  });

  const el = h(
    'div',
    { class: 'screen scrollable' },
    topBar('⭐ ภารกิจวันนี้', () => app.go({ name: 'home' })),
    h(
      'div',
      { class: 'settings-list' },
      h(
        'div',
        { class: 'field' },
        h('div', { class: 'field-label' }, 'ทำครบ 3 ข้อ ได้สติกเกอร์พิเศษ 🎁'),
        ...quests,
        day.rewards.includes('quest') ? h('div', { class: 'field-note' }, '🎉 วันนี้ได้รางวัลภารกิจแล้ว พรุ่งนี้มีภารกิจใหม่นะ') : null,
      ),
      h(
        'div',
        { class: 'field' },
        h('div', { class: 'field-label' }, `🔥 เล่นต่อเนื่อง ${streak} วัน`),
        h('div', { class: 'calendar' }, ...calendar),
        h(
          'div',
          { class: 'field-note' },
          next
            ? `เล่นจบอย่างน้อยวันละเกม ครบ ${next} วันได้สติกเกอร์พิเศษ (อีก ${next - streak} วัน)`
            : 'เก่งมาก! เล่นต่อเนื่องครบทุกรางวัลแล้ว',
        ),
      ),
    ),
  );
  return { el };
}

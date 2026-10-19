import { ACTIVITIES, ACTIVITY_NAMES, describeItem } from '../activities';
import type { App, ScreenView } from '../app';
import { h } from '../core/dom';
import { dateKey, recentDays, weekTotals } from '../engine/daylog';
import { totalsFor, weakItems } from '../engine/mastery';
import type { ActivityId } from '../types';
import { topBar } from './ui';

/** กิจกรรมที่เก็บสถิติรายข้อ (เกมจับคู่ภาพไม่มีข้อถูกผิด) */
const TRACKED: ActivityId[] = ['counting', 'money', 'thai', 'vowels', 'english', 'shapes', 'compare', 'pattern'];

const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
/** ต้องตอบอย่างน้อยเท่านี้ในแต่ละสัปดาห์ จึงเทียบกันได้โดยไม่แกว่งเพราะข้อน้อย */
const MIN_WEEK_ANSWERS = 5;

const percent = (t: { seen: number; missed: number }) => Math.round(((t.seen - t.missed) / t.seen) * 100);

/** กราฟแท่งจำนวนข้อที่ตอบใน 7 วันล่าสุด ส่วนสีเข้มคือข้อที่ถูกตั้งแต่ครั้งแรก */
function weekChart(app: App, today: string): HTMLElement {
  const week = recentDays(app.save.days, today, 7);
  const most = Math.max(10, ...week.map((d) => d.seen));
  const bars = week.map((d) => {
    const bar = h('div', { class: 'week-bar' }, h('div', { class: 'week-good' }));
    bar.style.height = `${(d.seen / most) * 100}%`;
    (bar.firstChild as HTMLElement).style.height = d.seen > 0 ? `${((d.seen - d.missed) / d.seen) * 100}%` : '0';
    return h(
      'div',
      { class: 'week-col' },
      h('div', { class: 'week-num' }, String(d.seen)),
      h('div', { class: 'week-track' }, bar),
      h('div', { class: 'week-day' }, WEEKDAYS[new Date(`${d.key}T00:00:00`).getDay()]),
      h('div', { class: 'week-min' }, d.ms > 0 ? `${Math.max(1, Math.round(d.ms / 60_000))} น.` : '-'),
    );
  });
  const total = week.reduce((sum, d) => sum + d.ms, 0);
  return h(
    'div',
    { class: 'field' },
    h('div', { class: 'field-label' }, '7 วันล่าสุด'),
    h('div', { class: 'week-chart' }, ...bars),
    h('div', { class: 'field-note' }, `จำนวนข้อที่ลูกตอบในแต่ละวัน สีเข้มคือข้อที่ถูกตั้งแต่ครั้งแรก รวมเวลาเล่น ${Math.round(total / 60_000)} นาที`),
  );
}

/** เทียบสัปดาห์นี้กับสัปดาห์ก่อน บอกว่าลูกแม่นขึ้นหรือไม่ */
function trend(app: App, today: string, id: ActivityId): string {
  const now = weekTotals(app.save.days, today, id, 0);
  const before = weekTotals(app.save.days, today, id, 1);
  if (now.seen < MIN_WEEK_ANSWERS) return '';
  if (before.seen < MIN_WEEK_ANSWERS) return ` · สัปดาห์นี้ ${percent(now)}%`;
  const diff = percent(now) - percent(before);
  const arrow = diff >= 5 ? '📈 ดีขึ้น' : diff <= -5 ? '📉 ลดลง' : '➖ เท่าเดิม';
  return ` · สัปดาห์นี้ ${percent(now)}% (ก่อนหน้า ${percent(before)}%) ${arrow}`;
}

/** หน้าสรุปสำหรับผู้ปกครอง: ลูกทำได้ดีแค่ไหนในแต่ละหมวด และยังไม่แม่นข้อไหน */
export function reportScreen(app: App): ScreenView {
  const { stats, levels } = app.save;
  const today = dateKey(new Date());

  const summary = TRACKED.map((id) => {
    const { seen, missed } = totalsFor(stats, `${id}:`);
    const detail =
      seen === 0
        ? 'ยังไม่ได้เล่น'
        : `ตอบถูกตั้งแต่ครั้งแรก ${percent({ seen, missed })}% (${seen - missed} จาก ${seen} ข้อ)${trend(app, today, id)}`;
    return h(
      'div',
      { class: 'report-row' },
      h('div', { class: 'report-name' }, ACTIVITY_NAMES[id]),
      h('div', { class: 'report-detail' }, detail),
      h('div', { class: 'report-level' }, `ระดับ ${Math.min(levels[id], ACTIVITIES[id].maxLevel)}/${ACTIVITIES[id].maxLevel}`),
    );
  });

  const weak = weakItems(stats).map((item) => {
    const { icon, label } = describeItem(item.id);
    return h(
      'div',
      { class: 'weak-item' },
      h('span', { class: 'weak-icon' }, icon),
      h('span', { class: 'weak-label' }, label),
      h('span', { class: 'weak-count' }, `ผิด ${item.missed} จาก ${item.seen} ครั้ง`),
    );
  });

  const el = h(
    'div',
    { class: 'screen scrollable' },
    topBar(`📊 ผลการเล่นของ${app.save.settings.childName}`, () => app.go({ name: 'settings' })),
    h(
      'div',
      { class: 'settings-list' },
      weekChart(app, today),
      h('div', { class: 'field' }, h('div', { class: 'field-label' }, 'ภาพรวมแต่ละหมวด'), ...summary),
      h(
        'div',
        { class: 'field' },
        h('div', { class: 'field-label' }, 'ข้อที่ยังไม่แม่น'),
        weak.length > 0
          ? h('div', { class: 'weak-list' }, ...weak)
          : h('div', { class: 'field-note' }, 'ยังไม่มีข้อที่ผิดบ่อย เล่นต่ออีกสักหน่อยแล้วกลับมาดูใหม่นะ'),
        h('div', { class: 'field-note' }, 'เกมจะสุ่มข้อเหล่านี้ให้ลูกเจอบ่อยขึ้นเอง และจะหายจากรายการเมื่อลูกตอบถูกมากขึ้น'),
      ),
    ),
  );
  return { el };
}

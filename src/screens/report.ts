import { ACTIVITIES, ACTIVITY_NAMES, describeItem } from '../activities';
import type { App, ScreenView } from '../app';
import { h } from '../core/dom';
import { totalsFor, weakItems } from '../engine/mastery';
import type { ActivityId } from '../types';
import { topBar } from './ui';

/** กิจกรรมที่เก็บสถิติรายข้อ (เกมจับคู่ภาพไม่มีข้อถูกผิด) */
const TRACKED: ActivityId[] = ['counting', 'thai', 'english', 'pattern'];

/** หน้าสรุปสำหรับผู้ปกครอง: ลูกทำได้ดีแค่ไหนในแต่ละหมวด และยังไม่แม่นข้อไหน */
export function reportScreen(app: App): ScreenView {
  const { stats, levels } = app.save;

  const summary = TRACKED.map((id) => {
    const { seen, missed } = totalsFor(stats, `${id}:`);
    const detail =
      seen === 0
        ? 'ยังไม่ได้เล่น'
        : `ตอบถูกตั้งแต่ครั้งแรก ${Math.round(((seen - missed) / seen) * 100)}% (${seen - missed} จาก ${seen} ข้อ)`;
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
    topBar('📊 ผลการเล่นของลูก', () => app.go({ name: 'settings' })),
    h(
      'div',
      { class: 'settings-list' },
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

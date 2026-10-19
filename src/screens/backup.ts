import type { App, ScreenView } from '../app';
import { decodeBackup, encodeBackup } from '../core/backup';
import { h, onHold } from '../core/dom';
import { dateKey } from '../engine/daylog';
import { button, topBar } from './ui';

const RESTORE_HOLD_MS = 2000;

/** สำรองและกู้ข้อมูล เพราะข้อมูลอยู่ใน localStorage ของเครื่องเดียว ล้างข้อมูล Safari แล้วจะหายหมด */
export function backupScreen(app: App): ScreenView {
  const code = h('textarea', { class: 'input backup-code', readonly: 'true', rows: '4' });
  code.value = encodeBackup(app.save);
  const copied = h('div', { class: 'field-note' });

  const copy = button('btn btn-small', '📋 คัดลอกรหัส', () => {
    code.select();
    navigator.clipboard?.writeText(code.value).then(
      () => (copied.textContent = 'คัดลอกแล้ว ✓ นำไปวางเก็บในโน้ตหรือส่งให้ตัวเองได้เลย'),
      () => (copied.textContent = 'คัดลอกเองไม่ได้ ให้กดค้างที่รหัสแล้วเลือกคัดลอก'),
    );
  });

  const download = button('btn btn-small', '💾 บันทึกเป็นไฟล์', () => {
    const blob = new Blob([JSON.stringify(app.save)], { type: 'application/json' });
    const link = h('a', { href: URL.createObjectURL(blob), download: `buddy-park-${dateKey(new Date())}.json` });
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  });

  const input = h('textarea', { class: 'input backup-code', rows: '4', placeholder: 'วางรหัสสำรองที่นี่' });
  const status = h('div', { class: 'field-note' });
  const file = h('input', { type: 'file', accept: '.json,application/json,text/plain', class: 'file-input' });
  file.addEventListener('change', () => {
    void file.files?.[0]?.text().then((text) => {
      input.value = text;
      check();
    });
  });
  input.addEventListener('input', () => check());

  function check(): void {
    if (!input.value.trim()) {
      status.textContent = '';
      return;
    }
    const data = decodeBackup(input.value);
    status.textContent = data
      ? `พบข้อมูลของ ${data.settings.childName} (สติกเกอร์ ${data.stickers.length} ดวง) กดค้างปุ่มด้านล่างเพื่อกู้ข้อมูล`
      : 'รหัสนี้ไม่ใช่ข้อมูลของเกมนี้ ลองคัดลอกใหม่อีกครั้ง';
  }

  // กดค้างเพราะข้อมูลในเครื่องตอนนี้จะถูกแทนที่ทั้งหมด
  const restore = h(
    'button',
    { class: 'btn btn-hold btn-danger', type: 'button' },
    '♻️ กู้ข้อมูลแทนของเดิม',
    h('small', null, 'กดค้างไว้'),
  );
  onHold(restore, RESTORE_HOLD_MS, () => {
    const data = decodeBackup(input.value);
    if (!data) {
      status.textContent = 'ยังไม่มีรหัสสำรองที่ใช้ได้';
      return;
    }
    // รุ่นที่เคยเห็นเป็นของเครื่องนี้ ไม่ใช่ของข้อมูลที่นำมา
    app.save = { ...data, seenVersion: app.save.seenVersion };
    app.persist();
    app.go({ name: 'home' });
  });

  const el = h(
    'div',
    { class: 'screen scrollable' },
    topBar('💾 สำรองและย้ายข้อมูล', () => app.go({ name: 'settings' })),
    h(
      'div',
      { class: 'settings-list' },
      h(
        'div',
        { class: 'field' },
        h('div', { class: 'field-label' }, 'สำรองข้อมูล'),
        h('div', { class: 'field-note' }, 'รวมระดับ สติกเกอร์ สถิติ ลูกทุกคน และการตั้งค่า ใช้ย้ายไปเครื่องใหม่หรือเก็บไว้เผื่อข้อมูลหาย'),
        code,
        h('div', { class: 'home-row' }, copy, download),
        copied,
      ),
      h(
        'div',
        { class: 'field' },
        h('div', { class: 'field-label' }, 'กู้ข้อมูล'),
        h('div', { class: 'field-note' }, 'วางรหัสสำรอง หรือเลือกไฟล์ที่บันทึกไว้'),
        input,
        file,
        status,
        restore,
      ),
    ),
  );
  return { el };
}

import type { App, ScreenView } from '../app';
import { h, onHold } from '../core/dom';
import { speak, voiceStatus } from '../core/speech';
import { defaultSave } from '../core/storage';
import type { Handicap, Lang, Seating } from '../types';
import { button, segmented, topBar } from './ui';

const RESET_HOLD_MS = 2000;
type OnOff = 'on' | 'off';

const ON_OFF: { value: OnOff; label: string }[] = [
  { value: 'on', label: 'เปิด' },
  { value: 'off', label: 'ปิด' },
];

function field(label: string, control: HTMLElement, note?: string): HTMLElement {
  return h(
    'div',
    { class: 'field' },
    h('div', { class: 'field-label' }, label),
    control,
    note ? h('div', { class: 'field-note' }, note) : null,
  );
}

function voiceLabel(lang: Lang): string {
  const status = voiceStatus(lang);
  if (status === 'ready') return 'พร้อมใช้ ✓';
  if (status === 'missing') return 'ไม่พบในเครื่องนี้';
  return 'ยังตรวจไม่ได้ ลองกดทดสอบเสียง';
}

export function settingsScreen(app: App): ScreenView {
  const { settings } = app.save;
  const defaults = defaultSave();

  const nameInput = (key: 'childName' | 'parentName') => {
    const input = h('input', { class: 'input', type: 'text', maxlength: '12', value: settings[key] });
    input.addEventListener('input', () => {
      settings[key] = input.value.trim() || defaults.settings[key];
      app.persist();
    });
    return input;
  };

  const voiceNote = h('div', { class: 'field-note' });
  const showVoices = () => {
    voiceNote.textContent = `เสียงไทย: ${voiceLabel('th-TH')} · เสียงอังกฤษ: ${voiceLabel('en-US')}`;
  };
  showVoices();

  const reset = h(
    'button',
    { class: 'btn btn-hold btn-danger', type: 'button' },
    '🗑️ ล้างระดับ สติกเกอร์ และสถิติ',
    h('small', null, 'กดค้างไว้'),
  );
  onHold(reset, RESET_HOLD_MS, () => {
    app.save.levels = defaults.levels;
    app.save.stickers = [];
    app.save.plays = 0;
    app.save.stats = {};
    app.persist();
    reset.replaceChildren('ล้างเรียบร้อยแล้ว ✓');
  });

  const el = h(
    'div',
    { class: 'screen scrollable' },
    topBar('⚙️ ตั้งค่าสำหรับผู้ปกครอง', () => app.go({ name: 'home' })),
    h(
      'div',
      { class: 'settings-list' },
      button('btn', '📊 ดูผลการเล่นของลูก', () => app.go({ name: 'report' })),
      field('ชื่อลูก', nameInput('childName')),
      field('ชื่อผู้ปกครอง', nameInput('parentName')),
      field(
        'แต้มต่อของผู้ปกครอง',
        segmented<Handicap>(
          [
            { value: 'low', label: 'น้อย' },
            { value: 'normal', label: 'ปกติ' },
            { value: 'high', label: 'มาก' },
          ],
          settings.handicap,
          (value) => {
            settings.handicap = value;
            app.persist();
          },
        ),
        'ยิ่งมาก โจทย์ฝั่งผู้ปกครองยิ่งขึ้นช้า ลูกจึงมีเวลาตอบก่อน',
      ),
      field(
        'ท่านั่ง',
        segmented<Seating>(
          [
            { value: 'side', label: 'นั่งข้างกัน' },
            { value: 'facing', label: 'นั่งตรงข้าม' },
          ],
          settings.seating,
          (value) => {
            settings.seating = value;
            app.persist();
          },
        ),
        'นั่งตรงข้ามจะหมุนฝั่งผู้ปกครองกลับหัว ให้วาง iPad ราบไว้ตรงกลาง',
      ),
      field(
        'เสียงเอฟเฟกต์',
        segmented<OnOff>(ON_OFF, settings.sound ? 'on' : 'off', (value) => {
          settings.sound = value === 'on';
          app.persist();
        }),
      ),
      h(
        'div',
        { class: 'field' },
        h('div', { class: 'field-label' }, 'เสียงอ่านโจทย์'),
        segmented<OnOff>(ON_OFF, settings.speech ? 'on' : 'off', (value) => {
          settings.speech = value === 'on';
          app.persist();
        }),
        button('btn btn-small', '🔊 ทดสอบเสียง', () => {
          speak([
            { text: 'สวัสดีค่ะ มาเล่นกันนะ', lang: 'th-TH' },
            { text: 'Hello! Let’s play.', lang: 'en-US' },
          ]);
          // รายการเสียงของเบราว์เซอร์มักโหลดเสร็จหลังเริ่มพูดครั้งแรก
          window.setTimeout(showVoices, 500);
        }),
        voiceNote,
      ),
      reset,
    ),
  );
  return { el };
}

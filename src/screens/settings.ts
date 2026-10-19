import type { App, ScreenView } from '../app';
import { h, onHold } from '../core/dom';
import { speak, voiceStatus } from '../core/speech';
import { defaultSave } from '../core/storage';
import { BASE_AVATARS } from '../data/avatars';
import { MAX_PROFILES, addProfile, allProfiles, removeProfile, switchProfile } from '../engine/profiles';
import { ALL_AVATARS, unlockedAvatars } from '../engine/stickers';
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

const LIMITS = [0, 15, 20, 30, 45, 60];
const DELETE_HOLD_MS = 2000;

/** ตัวเลือกภาพประจำตัว ภาพที่อีกฝั่งใช้อยู่หรือยังไม่ปลดล็อกกดไม่ได้ */
function avatarPicker(options: string[], unlocked: string[], current: string, taken: string, onPick: (a: string) => void): HTMLElement {
  const buttons = options.map((avatar) => {
    const open = unlocked.includes(avatar) && avatar !== taken;
    const btn = button('seg-btn avatar-btn', unlocked.includes(avatar) ? avatar : '🔒', () => {
      if (!open) return;
      buttons.forEach((b) => b.classList.toggle('on', b === btn));
      onPick(avatar);
    });
    btn.classList.toggle('on', avatar === current);
    btn.disabled = !open;
    return btn;
  });
  return h('div', { class: 'segmented' }, ...buttons);
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
    '🗑️ ล้างระดับ สติกเกอร์ และสถิติของลูกคนนี้',
    h('small', null, 'กดค้างไว้'),
  );
  onHold(reset, RESET_HOLD_MS, () => {
    app.save.levels = defaults.levels;
    app.save.stickers = [];
    app.save.plays = 0;
    app.save.stats = {};
    app.save.days = {};
    app.persist();
    reset.replaceChildren('ล้างเรียบร้อยแล้ว ✓');
  });

  // ลูกหลายคน: ลูกที่กำลังเล่นแก้ชื่อและภาพได้ด้านล่าง คนอื่นสลับไปเล่นหรือลบได้ที่นี่
  const reload = () => app.go({ name: 'settings' });
  const profiles = allProfiles(app.save);
  const profileRows = profiles.map((p) => {
    const row = h('div', { class: 'profile-row' }, h('span', { class: 'profile-name' }, `${p.childAvatar} ${p.childName}`));
    if (p.id === app.save.profileId) {
      row.append(h('span', { class: 'report-level' }, 'กำลังเล่น'));
      return row;
    }
    const remove = h('button', { class: 'btn btn-small btn-hold btn-danger', type: 'button' }, '🗑️ ลบ', h('small', null, 'กดค้าง'));
    onHold(remove, DELETE_HOLD_MS, () => {
      app.save = removeProfile(app.save, p.id);
      app.persist();
      reload();
    });
    row.append(
      button('btn btn-small', '▶ เล่นเป็นคนนี้', () => {
        app.save = switchProfile(app.save, p.id);
        app.persist();
        reload();
      }),
      remove,
    );
    return row;
  });
  const newName = h('input', { class: 'input', type: 'text', maxlength: '12', placeholder: 'ชื่อลูกอีกคน' });
  const addChild = button('btn btn-small', '➕ เพิ่มลูก', () => {
    const name = newName.value.trim();
    if (!name) return;
    app.save = addProfile(app.save, name);
    app.persist();
    reload();
  });

  const el = h(
    'div',
    { class: 'screen scrollable' },
    topBar('⚙️ ตั้งค่าสำหรับผู้ปกครอง', () => app.go({ name: 'home' })),
    h(
      'div',
      { class: 'settings-list' },
      button('btn', '📊 ดูผลการเล่นของลูก', () => app.go({ name: 'report' })),
      button('btn', '💾 สำรองและย้ายข้อมูล', () => app.go({ name: 'backup' })),
      button('btn', '📜 มีอะไรใหม่ในแต่ละรุ่น', () => app.go({ name: 'changelog' })),
      field('ชื่อลูก', nameInput('childName')),
      field(
        'ภาพประจำตัวลูก',
        avatarPicker(ALL_AVATARS, unlockedAvatars(app.save.stickers), settings.childAvatar, settings.parentAvatar, (a) => {
          settings.childAvatar = a;
          app.persist();
        }),
        'สะสมสติกเกอร์ครบชุดเพื่อปลดล็อกภาพเพิ่ม',
      ),
      field('ชื่อผู้ปกครอง', nameInput('parentName')),
      field(
        'ภาพประจำตัวผู้ปกครอง',
        avatarPicker(BASE_AVATARS, BASE_AVATARS, settings.parentAvatar, settings.childAvatar, (a) => {
          settings.parentAvatar = a;
          app.persist();
        }),
      ),
      h(
        'div',
        { class: 'field' },
        h('div', { class: 'field-label' }, `ลูกในเครื่องนี้ (${profiles.length}/${MAX_PROFILES})`),
        ...profileRows,
        profiles.length < MAX_PROFILES ? h('div', { class: 'profile-add' }, newName, addChild) : null,
        h('div', { class: 'field-note' }, 'ลูกแต่ละคนมีระดับ สติกเกอร์ สถิติ และภารกิจของตัวเอง เลือกคนเล่นได้ที่หน้าแรก'),
      ),
      field(
        'เวลาเล่นต่อวัน',
        segmented<string>(
          LIMITS.map((m) => ({ value: String(m), label: m === 0 ? 'ไม่จำกัด' : `${m} นาที` })),
          String(settings.dailyLimit),
          (value) => {
            settings.dailyLimit = Number(value);
            app.persist();
          },
        ),
        'ครบเวลาแล้วเกมที่เล่นอยู่จะเล่นจนจบ จากนั้นจะขึ้นหน้าพักสายตา ผู้ปกครองกดค้างเพื่อให้เล่นต่อในวันนั้นได้',
      ),
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

import './style.css';
import type { App, Route, ScreenView } from './app';
import { setSoundEnabled, unlockAudio } from './core/audio';
import { initSpeech, setSpeechEnabled, stopSpeech, unlockSpeech } from './core/speech';
import { loadSave, writeSave } from './core/storage';
import { initUpdates } from './core/update';
import { dateKey, timeLeftMs } from './engine/daylog';
import { backupScreen } from './screens/backup';
import { changelogScreen } from './screens/changelog';
import { homeScreen } from './screens/home';
import { modeScreen } from './screens/mode';
import { playScreen } from './screens/play';
import { profilesScreen } from './screens/profiles';
import { questsScreen } from './screens/quests';
import { reportScreen } from './screens/report';
import { restScreen } from './screens/rest';
import { resultScreen } from './screens/result';
import { settingsScreen } from './screens/settings';
import { stickersScreen } from './screens/stickers';
import { zoneScreen } from './screens/zone';

const root = document.getElementById('app') as HTMLElement;
let current: ScreenView | null = null;

function applySettings(): void {
  setSoundEnabled(app.save.settings.sound);
  setSpeechEnabled(app.save.settings.speech);
}

/** ครบเวลาเล่นที่ผู้ปกครองตั้งไว้แล้ว ทางเข้าเกมทุกทางจะพาไปหน้าพักแทน */
function timeUp(): boolean {
  const { days, settings, extraTimeDay } = app.save;
  return timeLeftMs(days, dateKey(new Date()), settings.dailyLimit, extraTimeDay) <= 0;
}

function build(route: Route): ScreenView {
  if ((route.name === 'zone' || route.name === 'mode' || route.name === 'play') && timeUp()) return restScreen(app);
  switch (route.name) {
    case 'home':
      return homeScreen(app);
    case 'zone':
      return zoneScreen(app);
    case 'mode':
      return modeScreen(app, route.zone);
    case 'play':
      return playScreen(app, route.zone, route.mode);
    case 'result':
      return resultScreen(app, route);
    case 'stickers':
      return stickersScreen(app);
    case 'settings':
      return settingsScreen(app);
    case 'report':
      return reportScreen(app);
    case 'changelog':
      return changelogScreen(app);
    case 'profiles':
      return profilesScreen(app);
    case 'quests':
      return questsScreen(app);
    case 'rest':
      return restScreen(app);
    case 'backup':
      return backupScreen(app);
  }
}

const app: App = {
  save: loadSave(),
  persist() {
    writeSave(app.save);
    applySettings();
  },
  go(route) {
    current?.destroy?.();
    stopSpeech();
    current = build(route);
    root.replaceChildren(current.el);
  },
};

// iOS ให้เริ่มเสียงได้หลังผู้ใช้แตะจอเท่านั้น และอาจพักเสียงอีกเมื่อสลับแอป จึงปลดล็อกทุกครั้งที่แตะ
window.addEventListener('pointerdown', unlockAudio, { capture: true });
window.addEventListener('pointerdown', unlockSpeech, { capture: true, once: true });

// กันการซูมและการเลื่อนจอของ Safari ระหว่างที่สองคนแตะพร้อมกัน
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener(
  'touchmove',
  (e) => {
    if (!(e.target instanceof Element && e.target.closest('.scrollable'))) e.preventDefault();
  },
  { passive: false },
);

// เครื่องที่ไม่มีจอสัมผัส (เช่น notebook) สองคนแตะพร้อมกันไม่ได้ จึงแสดงป้ายชื่อปุ่มคีย์บอร์ดให้ใช้แทน
if (navigator.maxTouchPoints === 0) document.documentElement.classList.add('use-keys');

initSpeech();
initUpdates();
applySettings();
app.go({ name: 'home' });

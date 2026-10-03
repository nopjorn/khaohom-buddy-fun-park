import { ACTIVITY_IDS, zoneById } from '../activities';
import { type App, CHILD_AVATAR, PARENT_AVATAR, type ScreenView } from '../app';
import { sfx } from '../core/audio';
import { h, keycap, onTap } from '../core/dom';
import { halfOfKey } from '../core/keys';
import { mulberry32, randInt } from '../core/rng';
import { speak, stopSpeech } from '../core/speech';
import { type LevelState, newLevelState, parentDelayMs } from '../engine/difficulty';
import { HIGHFIVE_WINDOW_MS, type MatchState, applyCorrect, createMatch } from '../engine/match';
import { Panel } from '../engine/panel';
import { awardSticker } from '../engine/stickers';
import type { ActivityId, KeyHalf, Mode, Seating, Side, ZoneId } from '../types';
import { button, confetti } from './ui';

const COUNTDOWN_STEP_MS = 800;
const HINT_COOLDOWN_MS = 4000;
const RESULT_DELAY_MS = 1800;
const SIDES: Side[] = ['child', 'parent'];

interface Hud {
  el: HTMLElement;
  render(state: MatchState): void;
  /** แสดงมือของฝั่งที่เพิ่งตอบถูกและกำลังรออีกฝั่งมาไฮไฟว์ */
  setWaiting(side: Side | null): void;
}

function buildHud(mode: Mode, target: number, seating: Seating, onPause: () => void, onSwap: () => void): Hud {
  const pause = h('button', { class: 'hud-btn', type: 'button', 'aria-label': 'พักเกม' }, '⏸', keycap('Esc'));
  onTap(pause, onPause);
  // นั่งข้างกันคือสลับซ้ายขวา นั่งตรงข้ามคือสลับบนล่าง
  const swap = h(
    'button',
    { class: 'hud-btn', type: 'button', 'aria-label': seating === 'side' ? 'สลับซ้ายขวา' : 'สลับบนล่าง' },
    seating === 'side' ? '↔️' : '↕️',
  );
  onTap(swap, onSwap);
  const el = h('div', { class: `hud hud-${mode}` }, pause, swap);

  if (mode === 'versus') {
    const tracks = SIDES.map((side) => {
      const slots = Array.from({ length: target }, () => h('span', { class: 'slot' }, '⭐'));
      return { side, slots, el: h('div', { class: `track track-${side}` }, ...slots) };
    });
    el.append(h('div', { class: 'tracks' }, ...tracks.map((t) => t.el)));
    return {
      el,
      render(state) {
        for (const track of tracks) {
          track.slots.forEach((slot, i) => slot.classList.toggle('on', i < state.score[track.side]));
        }
      },
      setWaiting() {},
    };
  }

  const segments = Array.from({ length: target }, () => h('span', { class: 'seg' }));
  const label = h('div', { class: 'fuel-label' }, `0/${target}`);
  const hands = SIDES.map((side) => ({ side, el: h('span', { class: `hand hand-${side}` }, '✋') }));
  el.append(
    h('div', { class: 'rocket' }, '🚀'),
    h('div', { class: 'fuel' }, ...segments),
    label,
    h('div', { class: 'hands' }, ...hands.map((hand) => hand.el)),
  );
  return {
    el,
    render(state) {
      segments.forEach((seg, i) => seg.classList.toggle('on', i < state.shared));
      label.textContent = `${state.shared}/${target}`;
    },
    setWaiting(side) {
      for (const hand of hands) hand.el.classList.toggle('on', hand.side === side);
    },
  };
}

export function playScreen(app: App, zone: ZoneId, mode: Mode): ScreenView {
  const { settings } = app.save;
  const zoneDef = zoneById(zone);
  const rng = mulberry32((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);
  const panelRng = () => mulberry32(randInt(rng, 0, 0xffffffff));

  const timers = new Set<number>();
  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };

  // เวลาที่พักเกมไม่นับรวมในเวลาเล่น
  let pausedMs = 0;
  const clock = () => performance.now() - pausedMs;

  let match = createMatch(mode, 0);
  let started = false;
  let finished = false;
  let resume: (() => void) | null = null;
  let waitingToken = 0;

  const levels = Object.fromEntries(
    ACTIVITY_IDS.map((id) => [id, newLevelState(app.save.levels[id])]),
  ) as Record<ActivityId, LevelState>;

  // ปกติลูกอยู่ซ้าย (หรือล่างในท่านั่งตรงข้าม) สลับได้ระหว่างเล่นและจำไว้ใช้ครั้งต่อไป
  let swapped = settings.swapped;
  const keyHalfOf = (side: Side): KeyHalf => ((side === 'child') !== swapped ? 'left' : 'right');

  const el = h('div', { class: `play seating-${settings.seating} mode-${mode}` });
  el.classList.toggle('swapped', swapped);
  const hud = buildHud(mode, match.target, settings.seating, openPause, swapSides);

  const listen = h(
    'button',
    { class: 'head-btn', type: 'button', 'aria-label': 'ฟังโจทย์อีกครั้ง' },
    '🔊',
    keycap('Space'),
  );
  onTap(listen, () => child.repeat());

  // ปุ่มให้คำใบ้มีเฉพาะโหมดช่วยกัน เพราะในโหมดแข่งผู้ปกครองเป็นคู่แข่ง
  const help =
    mode === 'coop' ? h('button', { class: 'head-btn', type: 'button' }, '💡 ช่วยลูก', keycap('Enter')) : undefined;
  function giveHint(): void {
    if (!help || help.disabled || finished) return;
    sfx.tap();
    child.hint();
    help.disabled = true;
    later(() => (help.disabled = false), HINT_COOLDOWN_MS);
  }
  if (help) onTap(help, giveHint);

  const child = new Panel({
    side: 'child',
    name: settings.childName,
    avatar: CHILD_AVATAR,
    activities: zoneDef.activities,
    rng: panelRng(),
    levels,
    speak,
    delayMs: () => 0,
    keyHalf: () => keyHalfOf('child'),
    onCorrect: () => correct('child'),
    onLevelChange: (id, level) => {
      app.save.levels[id] = level;
      app.persist();
    },
    headExtra: listen,
  });

  const parent = new Panel({
    side: 'parent',
    name: settings.parentName,
    avatar: PARENT_AVATAR,
    activities: zoneDef.activities,
    rng: panelRng(),
    levels: null,
    // ฝั่งผู้ปกครองไม่อ่านออกเสียง เสียงจะได้ไม่ชนกับโจทย์ของลูก
    speak: () => {},
    delayMs: () => parentDelayMs(settings.handicap, mode, match.score.parent - match.score.child),
    keyHalf: () => keyHalfOf('parent'),
    onCorrect: () => correct('parent'),
    headExtra: help,
  });

  function correct(side: Side): void {
    if (finished) return;
    const result = applyCorrect(match, side, clock());
    match = result.state;
    hud.render(match);

    const highFive = result.effects.some((e) => e.type === 'highfive');
    if (highFive) {
      sfx.highfive();
      const cheer = h('div', { class: 'highfive' }, '🙌', h('span', null, 'ไฮไฟว์!'));
      el.append(cheer);
      later(() => cheer.remove(), 1200);
    }
    if (mode === 'coop') {
      const token = ++waitingToken;
      hud.setWaiting(highFive ? null : side);
      later(() => {
        if (token === waitingToken) hud.setWaiting(null);
      }, HIGHFIVE_WINDOW_MS);
    }
    if (match.winner) finish();
  }

  function finish(): void {
    finished = true;
    child.stop();
    parent.stop();
    stopSpeech();
    hud.setWaiting(null);
    sfx.win();

    const award = awardSticker(app.save.stickers, rng);
    if (award.isNew) app.save.stickers.push(award.sticker);
    app.save.plays += 1;
    app.persist();

    el.append(confetti(), h('div', { class: 'finish-banner' }, mode === 'coop' ? '🚀' : '🏆'));
    later(() => app.go({ name: 'result', zone, mode, match, award }), RESULT_DELAY_MS);
  }

  function swapSides(): void {
    if (finished) return;
    sfx.tap();
    swapped = !swapped;
    settings.swapped = swapped;
    app.persist();
    el.classList.toggle('swapped', swapped);
    child.rebindKeys();
    parent.rebindKeys();
  }

  function openPause(): void {
    if (!started || finished || resume) return;
    const pausedAt = performance.now();
    stopSpeech();
    const overlay = h(
      'div',
      { class: 'overlay' },
      h('div', { class: 'overlay-title' }, '⏸ พักก่อนนะ'),
      button('btn btn-go btn-xl', '▶ เล่นต่อ', () => resume?.()),
      button('btn', '🏠 ออกจากเกม', () => app.go({ name: 'home' })),
    );
    resume = () => {
      pausedMs += performance.now() - pausedAt;
      resume = null;
      overlay.remove();
    };
    el.append(overlay);
  }

  // เล่นด้วยคีย์บอร์ดบนเครื่องที่ไม่มีจอสัมผัส แผงฝั่งซ้ายใช้ปุ่มครึ่งซ้าย แผงฝั่งขวาใช้ครึ่งขวา กดพร้อมกันได้
  function onKeyDown(e: KeyboardEvent): void {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.code === 'Escape') {
      if (resume) resume();
      else openPause();
      return;
    }
    if (!started || finished || resume) return;

    if (e.code === 'Space') {
      child.repeat();
    } else if (e.code === 'Enter' && help) {
      giveHint();
    } else {
      const half = halfOfKey(e.code);
      if (!half) return;
      (half === keyHalfOf('child') ? child : parent).pressKey(e.code);
    }
    e.preventDefault();
    // เครื่องที่มีทั้งจอสัมผัสและคีย์บอร์ด จะเริ่มแสดงป้ายชื่อปุ่มเมื่อมีการกดคีย์บอร์ดครั้งแรก
    document.documentElement.classList.add('use-keys');
  }

  function countdown(overlay: HTMLElement, n: number): void {
    if (n === 0) {
      overlay.replaceChildren(h('span', { class: 'count-num' }, 'ไป!'));
      sfx.go();
      later(() => {
        overlay.remove();
        match = createMatch(mode, clock());
        started = true;
        child.start();
        parent.start();
      }, COUNTDOWN_STEP_MS);
      return;
    }
    overlay.replaceChildren(
      h('span', { class: 'count-num' }, String(n)),
      h('span', { class: 'key-hint' }, 'กดปุ่มบนคีย์บอร์ดตามตัวอักษรที่มุมของแต่ละช่อง'),
    );
    sfx.tick();
    later(() => countdown(overlay, n - 1), COUNTDOWN_STEP_MS);
  }

  const startOverlay = h('div', { class: 'overlay countdown' });
  el.append(
    child.el,
    hud.el,
    parent.el,
    startOverlay,
    h('div', { class: 'rotate-hint' }, h('div', { class: 'rotate-icon' }, '🔄'), 'หมุนจอเป็นแนวนอนนะ'),
  );
  window.addEventListener('keydown', onKeyDown);
  countdown(startOverlay, 3);

  return {
    el,
    destroy() {
      window.removeEventListener('keydown', onKeyDown);
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
      child.destroy();
      parent.destroy();
      stopSpeech();
    },
  };
}

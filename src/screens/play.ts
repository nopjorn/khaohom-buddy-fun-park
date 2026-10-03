import { ACTIVITY_IDS, zoneById } from '../activities';
import { type App, CHILD_AVATAR, PARENT_AVATAR, type ScreenView } from '../app';
import { sfx } from '../core/audio';
import { h, onTap } from '../core/dom';
import { mulberry32, randInt } from '../core/rng';
import { speak, stopSpeech } from '../core/speech';
import { type LevelState, newLevelState, parentDelayMs } from '../engine/difficulty';
import { HIGHFIVE_WINDOW_MS, type MatchState, applyCorrect, createMatch } from '../engine/match';
import { Panel } from '../engine/panel';
import { awardSticker } from '../engine/stickers';
import type { ActivityId, Mode, Side, ZoneId } from '../types';
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

function buildHud(mode: Mode, target: number, onPause: () => void): Hud {
  const pause = h('button', { class: 'hud-pause', type: 'button', 'aria-label': 'พักเกม' }, '⏸');
  onTap(pause, onPause);
  const el = h('div', { class: `hud hud-${mode}` }, pause);

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
  let pausedAt = 0;
  let pausedMs = 0;
  const clock = () => performance.now() - pausedMs;

  let match = createMatch(mode, 0);
  let finished = false;
  let waitingToken = 0;

  const levels = Object.fromEntries(
    ACTIVITY_IDS.map((id) => [id, newLevelState(app.save.levels[id])]),
  ) as Record<ActivityId, LevelState>;

  const el = h('div', { class: `play seating-${settings.seating} mode-${mode}` });
  const hud = buildHud(mode, match.target, openPause);

  const listen = h('button', { class: 'head-btn', type: 'button', 'aria-label': 'ฟังโจทย์อีกครั้ง' }, '🔊');
  onTap(listen, () => child.repeat());

  // ปุ่มให้คำใบ้มีเฉพาะโหมดช่วยกัน เพราะในโหมดแข่งผู้ปกครองเป็นคู่แข่ง
  let help: HTMLButtonElement | undefined;
  if (mode === 'coop') {
    const helpBtn = h('button', { class: 'head-btn', type: 'button' }, '💡 ช่วยลูก');
    onTap(helpBtn, () => {
      if (helpBtn.disabled || finished) return;
      sfx.tap();
      child.hint();
      helpBtn.disabled = true;
      later(() => (helpBtn.disabled = false), HINT_COOLDOWN_MS);
    });
    help = helpBtn;
  }

  const child = new Panel({
    side: 'child',
    name: settings.childName,
    avatar: CHILD_AVATAR,
    activities: zoneDef.activities,
    rng: panelRng(),
    levels,
    speak,
    delayMs: () => 0,
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

  function openPause(): void {
    if (finished || pausedAt) return;
    pausedAt = performance.now();
    stopSpeech();
    const overlay = h(
      'div',
      { class: 'overlay' },
      h('div', { class: 'overlay-title' }, '⏸ พักก่อนนะ'),
      button('btn btn-go btn-xl', '▶ เล่นต่อ', () => {
        pausedMs += performance.now() - pausedAt;
        pausedAt = 0;
        overlay.remove();
      }),
      button('btn', '🏠 ออกจากเกม', () => app.go({ name: 'home' })),
    );
    el.append(overlay);
  }

  function countdown(overlay: HTMLElement, n: number): void {
    if (n === 0) {
      overlay.replaceChildren(h('span', { class: 'count-num' }, 'ไป!'));
      sfx.go();
      later(() => {
        overlay.remove();
        match = createMatch(mode, clock());
        child.start();
        parent.start();
      }, COUNTDOWN_STEP_MS);
      return;
    }
    overlay.replaceChildren(h('span', { class: 'count-num' }, String(n)));
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
  countdown(startOverlay, 3);

  return {
    el,
    destroy() {
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
      child.destroy();
      parent.destroy();
      stopSpeech();
    },
  };
}

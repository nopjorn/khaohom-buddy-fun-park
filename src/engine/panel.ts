import { ACTIVITIES } from '../activities';
import { sfx } from '../core/audio';
import { clear, h } from '../core/dom';
import { pick } from '../core/rng';
import type { Activity, ActivityId, Rng, SayPart, Side } from '../types';
import { type LevelState, recordAnswer } from './difficulty';

export interface PanelOptions {
  side: Side;
  name: string;
  avatar: string;
  activities: ActivityId[];
  rng: Rng;
  /** ระดับของลูกในแต่ละกิจกรรม ถ้าเป็น null จะใช้โจทย์ระดับผู้ปกครอง */
  levels: Record<ActivityId, LevelState> | null;
  speak(parts: SayPart[]): void;
  /** เวลารอก่อนโจทย์ถัดไปจะขึ้น */
  delayMs(): number;
  onCorrect(): void;
  onLevelChange?(id: ActivityId, level: number): void;
  headExtra?: HTMLElement;
}

const BURST = ['⭐', '✨', '🌟', '✨', '⭐', '🎉'];

/** แผงของผู้เล่นหนึ่งฝั่ง คอยป้อนโจทย์ถัดไปเรื่อย ๆ จนกว่าจะถูกสั่งหยุด */
export class Panel {
  readonly el: HTMLElement;
  private readonly body: HTMLElement;
  private readonly fx: HTMLElement;
  private activity: Activity | null = null;
  private currentId: ActivityId | null = null;
  private lastKey = '';
  private timer: number | undefined;
  private running = false;

  constructor(private readonly opts: PanelOptions) {
    this.body = h('div', { class: 'panel-body' });
    this.fx = h('div', { class: 'panel-fx' });
    this.el = h(
      'section',
      { class: `panel panel-${opts.side}` },
      h(
        'header',
        { class: 'panel-head' },
        h('span', { class: 'panel-avatar' }, opts.avatar),
        h('span', { class: 'panel-name' }, opts.name),
        opts.headExtra ?? null,
      ),
      this.body,
      this.fx,
    );
  }

  start(): void {
    this.running = true;
    this.nextRound();
  }

  /** หยุดรับคำตอบ แต่ยังแสดงโจทย์ล่าสุดค้างไว้ */
  stop(): void {
    this.running = false;
    window.clearTimeout(this.timer);
    this.el.classList.add('stopped');
  }

  destroy(): void {
    this.stop();
    this.activity?.destroy();
    this.activity = null;
  }

  hint(): void {
    this.activity?.hint();
  }

  repeat(): void {
    this.activity?.repeat();
  }

  private pickActivity(): ActivityId {
    let pool = this.opts.activities;
    // โซนสุ่มรวมไม่ให้กิจกรรมเดิมซ้ำติดกัน ส่วนโซนที่มีสองกิจกรรมกันแค่เกมจับคู่ซึ่งใช้เวลานาน
    if (pool.length > 2) pool = pool.filter((id) => id !== this.currentId);
    else if (pool.length === 2 && this.currentId === 'memory') pool = pool.filter((id) => id !== 'memory');
    return pick(this.opts.rng, pool);
  }

  private nextRound(): void {
    if (!this.running) return;
    this.activity?.destroy();
    this.activity = null;
    const delay = this.opts.delayMs();
    if (delay <= 0) {
      this.mountRound();
      return;
    }
    clear(this.body);
    this.body.append(h('div', { class: 'panel-wait' }, '🤔'));
    this.timer = window.setTimeout(() => this.mountRound(), delay);
  }

  private mountRound(): void {
    if (!this.running) return;
    clear(this.body);
    const id = this.pickActivity();
    const def = ACTIVITIES[id];
    const { levels, rng } = this.opts;
    const level = levels ? Math.min(levels[id].level, def.maxLevel) : def.maxLevel + 1;

    let activity = def.create(level, rng);
    for (let i = 0; i < 4 && activity.key === this.lastKey; i++) activity = def.create(level, rng);
    this.lastKey = activity.key;
    this.currentId = id;
    this.activity = activity;

    activity.mount(this.body, {
      side: this.opts.side,
      onCorrect: () => this.answered(id, true),
      onWrong: () => this.answered(id, false),
      onDone: () => this.nextRound(),
      speak: this.opts.speak,
    });
  }

  private answered(id: ActivityId, correct: boolean): void {
    if (!this.running) return;
    const { levels } = this.opts;
    if (levels) {
      const before = levels[id].level;
      levels[id] = recordAnswer(levels[id], correct, ACTIVITIES[id].maxLevel);
      if (levels[id].level !== before) this.opts.onLevelChange?.(id, levels[id].level);
    }
    if (!correct) {
      sfx.wrong();
      return;
    }
    sfx.correct();
    this.burst();
    this.opts.onCorrect();
  }

  private burst(): void {
    const wrap = h('div', { class: 'burst' });
    BURST.forEach((emoji, i) => {
      const star = h('span', null, emoji);
      star.style.setProperty('--angle', `${i * 60}deg`);
      wrap.append(star);
    });
    this.fx.append(wrap);
    window.setTimeout(() => wrap.remove(), 900);
  }
}

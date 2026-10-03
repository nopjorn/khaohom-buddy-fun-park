import { ACTIVITIES } from '../activities';
import { sfx } from '../core/audio';
import { clear, h } from '../core/dom';
import { pick } from '../core/rng';
import type { Activity, ActivityId, ItemWeight, KeyHalf, Rng, SayPart, Side } from '../types';
import { type LevelState, recordAnswer } from './difficulty';
import { COMBO_MIN } from './praise';

/** ผลของโจทย์หนึ่งข้อเมื่อตอบถูกแล้ว */
export interface AnswerResult {
  /** สิ่งที่โจทย์นี้ฝึก (ดู Question.item) ไม่มีสำหรับเกมจับคู่ภาพและโจทย์ของผู้ปกครอง */
  item?: string;
  /** true ถ้าตอบผิดอย่างน้อยหนึ่งครั้งก่อนจะตอบถูก */
  missed: boolean;
}

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
  /** ครึ่งคีย์บอร์ดของฝั่งนี้ในตอนนี้ เปลี่ยนได้เมื่อผู้เล่นสลับฝั่ง */
  keyHalf(): KeyHalf;
  /** streak คือจำนวนข้อที่ฝั่งนี้ตอบถูกติดกันรวมข้อนี้ */
  onCorrect(streak: number): void;
  onWrong?(): void;
  onAnswered?(result: AnswerResult): void;
  onLevelChange?(id: ActivityId, level: number): void;
  /** น้ำหนักในการสุ่มโจทย์ ใช้ทวนข้อที่ลูกตอบผิดบ่อย */
  weight?: ItemWeight;
  /**
   * true คือแผงไม่สุ่มโจทย์เอง ผู้เรียกป้อนโจทย์ผ่าน present() และรับ onRoundDone เมื่อจบข้อ
   * ใช้กับโหมดคุยกัน ซึ่งโจทย์หนึ่งข้อแบ่งอยู่บนสองแผง
   */
  manual?: boolean;
  onRoundDone?(): void;
  headExtra?: HTMLElement;
}

const BURST = ['⭐', '✨', '🌟', '✨', '⭐', '🎉', '💫', '🌟', '✨', '⭐', '🎊', '💫'];
const BURST_BASE = 6;

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
  private streak = 0;
  private roundMissed = false;

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
    if (!this.opts.manual) this.nextRound();
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

  /** แสดงโจทย์ที่ผู้เรียกเตรียมมา (ใช้กับ manual) */
  present(activity: Activity): void {
    if (!this.running) return;
    this.activity?.destroy();
    clear(this.body);
    this.mount(activity);
  }

  hint(): void {
    this.activity?.hint();
  }

  repeat(): void {
    this.activity?.repeat();
  }

  pressKey(code: string): void {
    if (this.running) this.activity?.pressKey(code);
  }

  /** เรียกหลังผู้เล่นสลับฝั่ง เพื่อให้โจทย์ที่ค้างอยู่ใช้ปุ่มของฝั่งใหม่ */
  rebindKeys(): void {
    this.activity?.rebindKeys(this.opts.keyHalf());
  }

  /** ป้ายคำชมที่ลอยขึ้นกลางแผง */
  cheer(text: string): void {
    const banner = h('div', { class: 'cheer' }, text);
    this.fx.append(banner);
    window.setTimeout(() => banner.remove(), 2200);
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
    const { levels, rng, weight } = this.opts;
    const level = levels ? Math.min(levels[id].level, def.maxLevel) : def.maxLevel + 1;

    let activity = def.create(level, rng, weight);
    for (let i = 0; i < 4 && activity.key === this.lastKey; i++) activity = def.create(level, rng, weight);
    this.lastKey = activity.key;
    this.currentId = id;
    this.mount(activity);
  }

  private mount(activity: Activity): void {
    this.activity = activity;
    this.roundMissed = false;
    activity.mount(this.body, {
      side: this.opts.side,
      keyHalf: this.opts.keyHalf(),
      onCorrect: () => this.answered(true),
      onWrong: () => this.answered(false),
      onDone: () => {
        if (this.opts.manual) this.opts.onRoundDone?.();
        else this.nextRound();
      },
      speak: this.opts.speak,
    });
  }

  private answered(correct: boolean): void {
    if (!this.running) return;
    const { levels } = this.opts;
    const id = this.currentId;
    if (levels && id) {
      const before = levels[id].level;
      levels[id] = recordAnswer(levels[id], correct, ACTIVITIES[id].maxLevel);
      if (levels[id].level !== before) this.opts.onLevelChange?.(id, levels[id].level);
    }

    if (!correct) {
      this.streak = 0;
      this.roundMissed = true;
      sfx.wrong();
      this.opts.onWrong?.();
      return;
    }

    this.streak += 1;
    sfx.correct();
    this.burst();
    this.opts.onAnswered?.({ item: this.activity?.item, missed: this.roundMissed });
    this.opts.onCorrect(this.streak);
  }

  /** ดาวกระจายเมื่อตอบถูก ยิ่งถูกติดกันหลายข้อดาวยิ่งเยอะ และมีตัวนับคอมโบ */
  private burst(): void {
    const count = Math.min(BURST_BASE + (this.streak - 1) * 2, BURST.length);
    const wrap = h('div', { class: 'burst' });
    for (let i = 0; i < count; i++) {
      const star = h('span', null, BURST[i]);
      star.style.setProperty('--angle', `${(360 / count) * i}deg`);
      wrap.append(star);
    }
    if (this.streak >= COMBO_MIN) wrap.append(h('div', { class: 'combo' }, `🔥 ${this.streak}`));
    this.fx.append(wrap);
    window.setTimeout(() => wrap.remove(), 900);
  }
}

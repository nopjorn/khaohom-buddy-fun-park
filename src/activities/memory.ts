import { sfx } from '../core/audio';
import { h, onTap } from '../core/dom';
import { sample, shuffle } from '../core/rng';
import { MEMORY_ITEMS } from '../data/items';
import type { Activity, ActivityHost, Rng } from '../types';
import { th } from './util';

export const MEMORY_MAX_LEVEL = 3;

/** จำนวนคู่ของระดับ 1-3 และตัวสุดท้ายเป็นของผู้ปกครอง */
const PAIRS_BY_LEVEL = [3, 4, 6, 8];
const CLOSE_DELAY_MS = 900;
const DONE_DELAY_MS = 900;
const HINT_MS = 2000;

export function pairsForLevel(level: number): number {
  const index = Math.min(Math.max(level, 1), PAIRS_BY_LEVEL.length) - 1;
  return PAIRS_BY_LEVEL[index];
}

export function createDeck(pairs: number, rng: Rng): string[] {
  const items = sample(rng, MEMORY_ITEMS, pairs);
  return shuffle(rng, [...items, ...items]);
}

export interface MemoryState {
  deck: string[];
  matched: boolean[];
  /** การ์ดที่หงายอยู่และยังไม่จับคู่ มีได้ไม่เกิน 2 ใบ */
  open: number[];
}

export type FlipResult = 'ignored' | 'opened' | 'match' | 'miss' | 'complete';

export function newMemory(deck: string[]): MemoryState {
  return { deck, matched: deck.map(() => false), open: [] };
}

export function flipCard(state: MemoryState, index: number): { state: MemoryState; result: FlipResult } {
  if (state.matched[index] || state.open.includes(index) || state.open.length >= 2) {
    return { state, result: 'ignored' };
  }
  const open = [...state.open, index];
  if (open.length < 2) return { state: { ...state, open }, result: 'opened' };

  const [a, b] = open;
  if (state.deck[a] !== state.deck[b]) return { state: { ...state, open }, result: 'miss' };

  const matched = state.matched.slice();
  matched[a] = true;
  matched[b] = true;
  return {
    state: { ...state, matched, open: [] },
    result: matched.every(Boolean) ? 'complete' : 'match',
  };
}

export function closeOpen(state: MemoryState): MemoryState {
  return { ...state, open: [] };
}

export function createMemory(level: number, rng: Rng): Activity {
  const pairs = pairsForLevel(level);
  const cols = pairs === 3 ? 3 : 4;
  const rows = (pairs * 2) / cols;
  const say = [th('จับคู่ภาพที่เหมือนกัน')];

  let state = newMemory(createDeck(pairs, rng));
  let host: ActivityHost | null = null;
  let root: HTMLElement | null = null;
  let cards: HTMLButtonElement[] = [];
  const timers: number[] = [];
  const later = (fn: () => void, ms: number) => {
    timers.push(window.setTimeout(fn, ms));
  };

  function render(): void {
    cards.forEach((card, i) => {
      card.classList.toggle('up', state.matched[i] || state.open.includes(i));
      card.classList.toggle('matched', state.matched[i]);
    });
  }

  function tap(index: number): void {
    if (!host) return;
    const { state: next, result } = flipCard(state, index);
    if (result === 'ignored') return;
    state = next;
    sfx.flip();
    render();
    if (result === 'miss') {
      later(() => {
        state = closeOpen(state);
        render();
      }, CLOSE_DELAY_MS);
      return;
    }
    if (result === 'match' || result === 'complete') host.onCorrect();
    if (result === 'complete') later(() => host?.onDone(), DONE_DELAY_MS);
  }

  return {
    key: `memory:${state.deck.join('')}`,

    mount(el, activityHost) {
      host = activityHost;
      cards = state.deck.map((emoji, i) => {
        const card = h(
          'button',
          { class: 'mcard', type: 'button' },
          h('span', { class: 'mcard-back' }, '❓'),
          h('span', { class: 'mcard-front' }, emoji),
        );
        onTap(card, () => tap(i));
        return card;
      });
      const grid = h('div', { class: 'memory-grid' }, ...cards);
      grid.style.setProperty('--cols', String(cols));
      grid.style.setProperty('--rows', String(rows));
      // แผงที่กว้างกว่าสูง (ท่านั่งตรงข้าม) เรียงเป็นสองแถวยาวแทน
      grid.style.setProperty('--cols-wide', String(pairs));
      grid.style.setProperty('--rows-wide', '2');
      root = h('div', { class: 'memory' }, h('div', { class: 'quiz-text' }, 'จับคู่ภาพที่เหมือนกัน'), grid);
      el.append(root);
      host.speak(say);
    },

    hint() {
      const first = state.matched.findIndex((m) => !m);
      if (first < 0) return;
      const second = state.deck.findIndex((emoji, i) => i !== first && emoji === state.deck[first]);
      for (const i of [first, second]) {
        const card = cards[i];
        card.classList.add('hint');
        later(() => card.classList.remove('hint'), HINT_MS);
      }
    },

    repeat() {
      host?.speak(say);
    },

    destroy() {
      timers.forEach((t) => window.clearTimeout(t));
      root?.remove();
      host = null;
    },
  };
}

import type { Mode, Side } from '../types';

export const COOP_TARGET = 12;
export const VERSUS_TARGET = 8;
/** ถ้าสองฝั่งตอบถูกห่างกันไม่เกินเวลานี้ในโหมดช่วยกัน จะได้โบนัสไฮไฟว์ */
export const HIGHFIVE_WINDOW_MS = 3000;

export interface MatchState {
  mode: Mode;
  target: number;
  /** จำนวนข้อที่แต่ละฝั่งตอบถูก */
  score: Record<Side, number>;
  /** หลอดพลังร่วมของโหมดช่วยกัน (รวมโบนัสแล้ว) */
  shared: number;
  highFives: number;
  /** เวลาที่แต่ละฝั่งตอบถูกล่าสุดและยังไม่ถูกใช้จับคู่ไฮไฟว์ */
  pending: Record<Side, number | null>;
  winner: Side | 'team' | null;
  startedAt: number;
  finishedAt: number | null;
}

export type MatchEffect =
  | { type: 'star'; side: Side }
  | { type: 'highfive' }
  | { type: 'finish'; winner: Side | 'team' };

export function createMatch(mode: Mode, now: number): MatchState {
  return {
    mode,
    target: mode === 'coop' ? COOP_TARGET : VERSUS_TARGET,
    score: { child: 0, parent: 0 },
    shared: 0,
    highFives: 0,
    pending: { child: null, parent: null },
    winner: null,
    startedAt: now,
    finishedAt: null,
  };
}

export function otherSide(side: Side): Side {
  return side === 'child' ? 'parent' : 'child';
}

export function applyCorrect(
  state: MatchState,
  side: Side,
  now: number,
): { state: MatchState; effects: MatchEffect[] } {
  if (state.winner) return { state, effects: [] };

  const next: MatchState = {
    ...state,
    score: { ...state.score, [side]: state.score[side] + 1 },
    pending: { ...state.pending },
  };
  const effects: MatchEffect[] = [{ type: 'star', side }];

  if (state.mode === 'versus') {
    if (next.score[side] >= next.target) next.winner = side;
  } else {
    next.shared += 1;
    const other = otherSide(side);
    const otherAt = next.pending[other];
    if (otherAt !== null && now - otherAt <= HIGHFIVE_WINDOW_MS) {
      next.shared += 1;
      next.highFives += 1;
      next.pending[other] = null;
      next.pending[side] = null;
      effects.push({ type: 'highfive' });
    } else {
      next.pending[side] = now;
    }
    if (next.shared >= next.target) {
      next.shared = next.target;
      next.winner = 'team';
    }
  }

  if (next.winner) {
    next.finishedAt = now;
    effects.push({ type: 'finish', winner: next.winner });
  }
  return { state: next, effects };
}

/** ดาวของโหมดช่วยกัน คิดจากเวลาที่ใช้ */
export function coopRating(state: MatchState): 1 | 2 | 3 {
  const elapsed = (state.finishedAt ?? state.startedAt) - state.startedAt;
  if (elapsed <= 90_000) return 3;
  if (elapsed <= 150_000) return 2;
  return 1;
}

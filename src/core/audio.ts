let ctx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

/** iOS ให้เริ่มเสียงได้หลังผู้ใช้แตะจอเท่านั้น จึงต้องเรียกจาก event ของการแตะ */
export function unlockAudio(): void {
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

function tone(freq: number, delay: number, duration: number, type: OscillatorType = 'sine', volume = 0.18): void {
  if (!enabled || !ctx || ctx.state !== 'running') return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

export const sfx = {
  tap: () => tone(520, 0, 0.08, 'triangle', 0.1),
  flip: () => tone(660, 0, 0.07, 'triangle', 0.08),
  tick: () => tone(440, 0, 0.15, 'square', 0.08),
  go: () => {
    tone(660, 0, 0.12, 'square', 0.08);
    tone(880, 0.12, 0.25, 'square', 0.08);
  },
  correct: () => {
    tone(660, 0, 0.12);
    tone(880, 0.1, 0.12);
    tone(1175, 0.2, 0.22);
  },
  wrong: () => {
    tone(260, 0, 0.16, 'triangle', 0.14);
    tone(200, 0.14, 0.24, 'triangle', 0.14);
  },
  highfive: () => {
    [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.07, 0.2, 'triangle'));
  },
  win: () => {
    [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.13, 0.28, 'triangle'));
  },
};

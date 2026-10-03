import type { Lang, SayPart } from '../types';

let enabled = true;
let voices: SpeechSynthesisVoice[] = [];
// เก็บ utterance ไว้ไม่ให้ถูกเก็บกวาดก่อนพูดจบ (บั๊กที่พบใน Safari และ Chrome)
let active: SpeechSynthesisUtterance[] = [];

function supported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function refreshVoices(): void {
  voices = window.speechSynthesis.getVoices();
}

function voiceFor(lang: Lang): SpeechSynthesisVoice | null {
  const prefix = lang.slice(0, 2).toLowerCase();
  return (
    voices.find((v) => v.lang.replace('_', '-') === lang) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ??
    null
  );
}

export function setSpeechEnabled(on: boolean): void {
  enabled = on;
  if (!on) stopSpeech();
}

export function initSpeech(): void {
  if (!supported()) return;
  refreshVoices();
  // รายการ voice โหลดช้าและมาทีหลังในหลายเบราว์เซอร์
  window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
}

/** iOS ให้พูดได้หลังผู้ใช้แตะจอเท่านั้น จึงต้องเรียกจาก event ของการแตะ */
export function unlockSpeech(): void {
  if (!supported()) return;
  const u = new SpeechSynthesisUtterance(' ');
  u.volume = 0;
  window.speechSynthesis.speak(u);
}

export type VoiceStatus = 'ready' | 'missing' | 'unknown';

export function voiceStatus(lang: Lang): VoiceStatus {
  if (!supported()) return 'missing';
  if (voices.length === 0) return 'unknown';
  return voiceFor(lang) ? 'ready' : 'missing';
}

export function speak(parts: SayPart[]): void {
  if (!enabled || !supported()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  active = [];
  for (const part of parts) {
    const voice = voiceFor(part.lang);
    // ถ้ารู้แน่ว่าไม่มีเสียงภาษานั้นให้ข้ามไป ดีกว่าให้เสียงภาษาอื่นอ่านผิด ๆ
    if (!voice && voices.length > 0) continue;
    const u = new SpeechSynthesisUtterance(part.text);
    u.lang = part.lang;
    if (voice) u.voice = voice;
    u.rate = 0.9;
    u.pitch = 1.1;
    active.push(u);
    synth.speak(u);
  }
}

export function stopSpeech(): void {
  if (!supported()) return;
  window.speechSynthesis.cancel();
  active = [];
}

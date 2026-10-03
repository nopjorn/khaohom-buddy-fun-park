import { h, onTap } from '../core/dom';
import type { Activity, ActivityHost, Choice, Question, Visual } from '../types';

const WRONG_LOCK_MS = 1000;
const DONE_DELAY_MS = 900;
const HINT_MS = 2000;

const glyphCount = (text: string) => Array.from(text.replace(/️/g, '')).length;

function renderVisual(visual: Visual): HTMLElement {
  switch (visual.kind) {
    case 'groups': {
      const multi = visual.groups.length > 1;
      const wrap = h('div', { class: multi ? 'vis-groups multi' : 'vis-groups' });
      visual.groups.forEach((group, i) => {
        if (i > 0 && visual.joiner) wrap.append(h('span', { class: 'vis-joiner' }, visual.joiner));
        const box = h('div', { class: 'vis-group' }, ...group.map((e) => h('span', { class: 'vis-item' }, e)));
        // เรียงแถวละ 5 เหมือนตารางสิบช่อง เด็กจะนับง่ายกว่าวางกระจาย
        box.style.setProperty('--per-row', String(Math.min(group.length, multi ? 3 : 5)));
        wrap.append(box);
      });
      return wrap;
    }
    case 'glyph': {
      const length = glyphCount(visual.text);
      const size = length <= 1 ? 'xl' : length <= 4 ? 'lg' : 'md';
      return h(
        'div',
        { class: 'vis-glyph-wrap' },
        h('div', { class: `vis-glyph ${size}` }, visual.text),
        visual.caption ? h('div', { class: 'vis-caption' }, visual.caption) : null,
      );
    }
    case 'sequence': {
      const row = h(
        'div',
        { class: 'vis-sequence' },
        ...visual.items.map((item) => h('span', { class: 'vis-item' }, item)),
        h('span', { class: 'vis-item vis-next' }, '❓'),
      );
      // แบบรูปต้องอยู่บรรทัดเดียว จึงย่อขนาดตามจำนวนของในแถว
      row.style.setProperty('--n', String(visual.items.length + 1));
      return row;
    }
  }
}

function renderChoice(choice: Choice): HTMLButtonElement {
  const btn = h('button', { class: `choice choice-${choice.kind}`, type: 'button' });
  if (choice.kind === 'group') {
    for (let i = 0; i < choice.count; i++) btn.append(h('span', { class: 'vis-item' }, choice.label));
    btn.style.setProperty('--per-row', String(Math.min(choice.count, 5)));
    btn.style.setProperty('--per-row-wide', String(choice.count));
  } else {
    btn.append(h('span', { class: 'choice-label' }, choice.label));
  }
  return btn;
}

/** ตัวเลือกที่เป็นคำ (ยาวกว่าตัวเลขสองหลัก) ต้องใช้ตัวอักษรเล็กลงและช่องกว้างขึ้น */
const isWordy = (choices: Choice[]) => choices.some((c) => c.kind === 'text' && c.label.length > 2);

function columnsFor(choices: Choice[]): number {
  if (choices.some((c) => c.kind === 'group')) return 1;
  if (isWordy(choices)) return 2;
  return choices.length === 4 ? 2 : 3;
}

/** โจทย์แบบเลือกตอบ ใช้ร่วมกันทุกกิจกรรมที่เป็น quiz */
export function createQuiz(question: Question): Activity {
  let host: ActivityHost | null = null;
  let root: HTMLElement | null = null;
  let buttons: HTMLButtonElement[] = [];
  let locked = false;
  let done = false;
  const timers: number[] = [];
  const later = (fn: () => void, ms: number) => {
    timers.push(window.setTimeout(fn, ms));
  };

  function choose(index: number): void {
    const btn = buttons[index];
    if (!host || locked || done || btn.disabled) return;

    if (index === question.answer) {
      done = true;
      btn.classList.add('correct');
      buttons.forEach((b, i) => {
        if (i !== index) b.disabled = true;
      });
      host.onCorrect();
      later(() => host?.onDone(), DONE_DELAY_MS);
      return;
    }

    // ตอบผิดไม่เสียคะแนน แค่ตัวเลือกนั้นหายไปและพักสั้น ๆ กันการกดรัว
    locked = true;
    btn.classList.add('wrong');
    btn.disabled = true;
    root?.classList.add('locked');
    host.onWrong();
    later(() => {
      locked = false;
      root?.classList.remove('locked');
    }, WRONG_LOCK_MS);
  }

  return {
    key: [question.text, JSON.stringify(question.visual ?? null), JSON.stringify(question.choices[question.answer])].join('|'),

    mount(el, activityHost) {
      host = activityHost;
      buttons = question.choices.map((choice, i) => {
        const btn = renderChoice(choice);
        onTap(btn, () => choose(i));
        return btn;
      });
      const choices = h('div', { class: isWordy(question.choices) ? 'quiz-choices wordy' : 'quiz-choices' }, ...buttons);
      choices.style.setProperty('--cols', String(columnsFor(question.choices)));
      root = h(
        'div',
        { class: 'quiz' },
        h(
          'div',
          { class: 'quiz-prompt' },
          h('div', { class: 'quiz-text' }, question.text),
          question.visual ? renderVisual(question.visual) : null,
        ),
        choices,
      );
      el.append(root);
      host.speak(question.say);
    },

    hint() {
      if (done) return;
      const btn = buttons[question.answer];
      btn.classList.add('hint');
      later(() => btn.classList.remove('hint'), HINT_MS);
    },

    repeat() {
      host?.speak(question.say);
    },

    destroy() {
      timers.forEach((t) => window.clearTimeout(t));
      root?.remove();
      host = null;
    },
  };
}

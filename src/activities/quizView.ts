import { h, onTap } from '../core/dom';
import type { Activity, ActivityHost, Choice, KeyHalf, Question, SayPart, Visual } from '../types';
import { bindKeys } from './keyBinding';

const WRONG_LOCK_MS = 1000;
const DONE_DELAY_MS = 900;
const HINT_MS = 2000;

// ไม่นับตัวกำกับรูปแบบ emoji (U+FE0F) ซึ่งมองไม่เห็นแต่ทำให้ข้อความดูยาวขึ้น
const VARIATION_SELECTOR = String.fromCharCode(0xfe0f);
const glyphCount = (text: string) => Array.from(text.split(VARIATION_SELECTOR).join('')).length;

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
      // ลำดับตัวเลขต้องเว้นห่างกว่าภาพ ไม่อย่างนั้นตัวเลขจะดูติดกันเป็นจำนวนเดียว
      const numeric = visual.items.every((item) => /^\d+$/.test(item));
      const row = h(
        'div',
        { class: numeric ? 'vis-sequence numbers' : 'vis-sequence' },
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

const questionKey = (q: Question) =>
  [q.text, JSON.stringify(q.visual ?? null), JSON.stringify(q.choices[q.answer])].join('|');

/** ส่วนโจทย์: ข้อความและภาพ มี lead ไว้ใส่ป้ายบอกบทบาทของโหมดคุยกัน */
function renderPrompt(question: Question, lead?: HTMLElement): HTMLElement {
  return h(
    'div',
    { class: 'quiz-prompt' },
    lead ?? null,
    h('div', { class: 'quiz-text' }, question.text),
    question.visual ? renderVisual(question.visual) : null,
  );
}

interface AnswerEvents {
  onCorrect(): void;
  onWrong(): void;
  onDone(): void;
}

interface ChoiceGrid {
  el: HTMLElement;
  bind(half: KeyHalf): void;
  press(code: string): void;
  hint(): void;
  destroy(): void;
}

/** ส่วนตัวเลือก รับการแตะและการกดคีย์บอร์ด แล้วแจ้งผลผ่าน events */
function createChoiceGrid(question: Question, events: AnswerEvents): ChoiceGrid {
  const cols = columnsFor(question.choices);
  let keys = new Map<string, number>();
  let locked = false;
  let done = false;
  const timers: number[] = [];
  const later = (fn: () => void, ms: number) => {
    timers.push(window.setTimeout(fn, ms));
  };

  const buttons = question.choices.map((choice, i) => {
    const btn = renderChoice(choice);
    onTap(btn, () => choose(i));
    return btn;
  });
  const el = h('div', { class: isWordy(question.choices) ? 'quiz-choices wordy' : 'quiz-choices' }, ...buttons);
  el.style.setProperty('--cols', String(cols));

  function choose(index: number): void {
    const btn = buttons[index];
    if (locked || done || btn.disabled) return;

    if (index === question.answer) {
      done = true;
      btn.classList.add('correct');
      buttons.forEach((b, i) => {
        if (i !== index) b.disabled = true;
      });
      events.onCorrect();
      later(() => events.onDone(), DONE_DELAY_MS);
      return;
    }

    // ตอบผิดไม่เสียคะแนน แค่ตัวเลือกนั้นหายไปและพักสั้น ๆ กันการกดรัว
    locked = true;
    btn.classList.add('wrong');
    btn.disabled = true;
    el.classList.add('locked');
    events.onWrong();
    later(() => {
      locked = false;
      el.classList.remove('locked');
    }, WRONG_LOCK_MS);
  }

  return {
    el,
    bind(half) {
      keys = bindKeys(half, buttons, cols);
    },
    press(code) {
      const index = keys.get(code);
      if (index !== undefined) choose(index);
    },
    hint() {
      if (done) return;
      const btn = buttons[question.answer];
      btn.classList.add('hint');
      later(() => btn.classList.remove('hint'), HINT_MS);
    },
    destroy() {
      timers.forEach((t) => window.clearTimeout(t));
    },
  };
}

/** ส่งต่อผลการตอบไปยัง host ที่ยังผูกอยู่ หลัง destroy แล้ว host เป็น null จึงไม่มีอะไรเกิดขึ้น */
function hostEvents(getHost: () => ActivityHost | null): AnswerEvents {
  return {
    onCorrect: () => getHost()?.onCorrect(),
    onWrong: () => getHost()?.onWrong(),
    onDone: () => getHost()?.onDone(),
  };
}

/** โจทย์แบบเลือกตอบ ใช้ร่วมกันทุกกิจกรรมที่เป็น quiz */
export function createQuiz(question: Question): Activity {
  let host: ActivityHost | null = null;
  let root: HTMLElement | null = null;
  const grid = createChoiceGrid(
    question,
    hostEvents(() => host),
  );

  return {
    key: questionKey(question),
    item: question.item,

    mount(el, activityHost) {
      host = activityHost;
      grid.bind(host.keyHalf);
      root = h('div', { class: 'quiz' }, renderPrompt(question), grid.el);
      el.append(root);
      host.speak(question.say);
    },
    hint: () => grid.hint(),
    repeat() {
      host?.speak(question.say);
    },
    pressKey: (code) => grid.press(code),
    rebindKeys: (half) => grid.bind(half),
    destroy() {
      grid.destroy();
      root?.remove();
      host = null;
    },
  };
}

export interface TalkRoles {
  /** ป้ายบนแผงของคนที่เห็นโจทย์ และแผงของคนที่กดคำตอบ */
  askNote: string;
  answerNote: string;
  /** คำอธิบายบทบาทของแต่ละแผงเป็นเสียง */
  askSay: SayPart[];
  answerSay: SayPart[];
  /** true คือพูดคำอธิบายบทบาททันทีที่ขึ้นโจทย์ ถ้า false จะพูดเมื่อกดฟังซ้ำเท่านั้น */
  announce: boolean;
}

function roleBadge(icon: string, note: string): HTMLElement {
  return h('div', { class: 'talk-role' }, h('span', { class: 'talk-role-icon' }, icon), h('span', null, note));
}

/**
 * โจทย์หนึ่งข้อของโหมดคุยกัน แยกเป็นสองแผง: คนถามเห็นโจทย์แต่ไม่เห็นตัวเลือก
 * คนตอบเห็นตัวเลือกแต่ไม่เห็นโจทย์ จึงต้องพูดคุยกันก่อนกด
 */
export function createTalkPair(question: Question, roles: TalkRoles): { asker: Activity; answerer: Activity } {
  let askHost: ActivityHost | null = null;
  let askRoot: HTMLElement | null = null;
  let answerHost: ActivityHost | null = null;
  let answerRoot: HTMLElement | null = null;
  const grid = createChoiceGrid(
    question,
    hostEvents(() => answerHost),
  );
  const key = questionKey(question);

  const asker: Activity = {
    key,
    mount(el, host) {
      askHost = host;
      askRoot = h('div', { class: 'quiz talk-ask' }, renderPrompt(question, roleBadge('👀', roles.askNote)));
      el.append(askRoot);
      if (roles.announce) host.speak(roles.askSay);
    },
    hint() {},
    // ปุ่มฟังซ้ำของคนถามคืออ่านโจทย์เต็ม ใช้เป็นตัวช่วยเมื่อลูกยังบอกเองไม่ได้
    repeat() {
      askHost?.speak(question.say);
    },
    pressKey() {},
    rebindKeys() {},
    destroy() {
      askRoot?.remove();
      askHost = null;
    },
  };

  const answerer: Activity = {
    key,
    item: question.item,
    mount(el, host) {
      answerHost = host;
      grid.bind(host.keyHalf);
      answerRoot = h(
        'div',
        { class: 'quiz talk-answer' },
        h('div', { class: 'quiz-prompt' }, roleBadge('👂', roles.answerNote)),
        grid.el,
      );
      el.append(answerRoot);
      if (roles.announce) host.speak(roles.answerSay);
    },
    hint: () => grid.hint(),
    repeat() {
      answerHost?.speak(roles.answerSay);
    },
    pressKey: (code) => grid.press(code),
    rebindKeys: (half) => grid.bind(half),
    destroy() {
      grid.destroy();
      answerRoot?.remove();
      answerHost = null;
    },
  };

  return { asker, answerer };
}

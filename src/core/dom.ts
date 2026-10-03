type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string> | null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [name, value] of Object.entries(attrs)) {
      if (name === 'class') el.className = value;
      else el.setAttribute(name, value);
    }
  }
  for (const child of children) {
    if (child !== null && child !== undefined && child !== false) el.append(child);
  }
  return el;
}

/**
 * ใช้ pointerdown แทน click เพื่อให้สองคนแตะคนละปุ่มพร้อมกันได้
 * ส่วน click ที่ detail เป็น 0 คือการกดจากคีย์บอร์ด
 */
export function onTap(el: HTMLElement, handler: () => void): void {
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    handler();
  });
  el.addEventListener('click', (e) => {
    if (e.detail === 0) handler();
  });
}

/** เรียก handler เมื่อกดค้างครบเวลา ใช้กันเด็กกดเข้าเมนูของผู้ปกครองโดยไม่ตั้งใจ */
export function onHold(el: HTMLElement, ms: number, handler: () => void): void {
  let timer: number | undefined;
  const cancel = () => {
    window.clearTimeout(timer);
    timer = undefined;
    el.classList.remove('holding');
  };
  el.style.setProperty('--hold-ms', `${ms}ms`);
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    cancel();
    el.classList.add('holding');
    timer = window.setTimeout(() => {
      cancel();
      handler();
    }, ms);
  });
  for (const type of ['pointerup', 'pointercancel', 'pointerleave'] as const) {
    el.addEventListener(type, cancel);
  }
}

/** ป้ายชื่อปุ่มคีย์บอร์ด แสดงเฉพาะเมื่อเล่นด้วยคีย์บอร์ด (ดู .use-keys ใน CSS) */
export function keycap(label: string): HTMLElement {
  return h('kbd', { class: 'keycap' }, label);
}

export function clear(el: HTMLElement): void {
  el.replaceChildren();
}

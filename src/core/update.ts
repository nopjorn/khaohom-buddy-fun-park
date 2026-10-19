import { registerSW } from 'virtual:pwa-register';

// iPad มักเปิดเกมค้างไว้หลายวัน จึงต้องถามหารุ่นใหม่เองเป็นระยะ ไม่รอให้ปิดแอป
const CHECK_EVERY_MS = 30 * 60 * 1000;

let ready = false;
let applyUpdate: (reload?: boolean) => Promise<void> = async () => {};
const listeners = new Set<() => void>();

export function initUpdates(): void {
  if (!('serviceWorker' in navigator)) return;
  applyUpdate = registerSW({
    onNeedRefresh() {
      ready = true;
      listeners.forEach((fn) => fn());
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => {
        if (navigator.onLine) registration.update().catch(() => {});
      };
      setInterval(check, CHECK_EVERY_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    },
  });
}

export function isUpdateReady(): boolean {
  return ready;
}

/** เรียก fn เมื่อมีรุ่นใหม่รอโหลด คืนฟังก์ชันยกเลิก */
export function onUpdateReady(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** ให้ service worker รุ่นใหม่ทำงานแล้วโหลดหน้าใหม่ */
export function reloadToUpdate(): void {
  void applyUpdate(true);
}

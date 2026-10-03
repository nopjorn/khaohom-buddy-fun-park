// ค่าทั้งสามถูกแทนที่ตอน build (ดู define ใน vite.config.ts)
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;
declare const __COMMIT__: string;

/**
 * ข้อความรุ่นที่แสดงบนหน้าแรก เช่น "v1.1.0 · 3 ต.ค. 2569 13:05 · 8bf6285"
 * เวลาคือเวลาที่ build แสดงตามเวลาของเครื่องที่เปิดเกม ถ้าไม่มี commit แปลว่ารันในเครื่อง
 */
export function formatVersion(version: string, buildTime: string, commit: string): string {
  if (!commit) return `v${version} · รันในเครื่อง`;
  const built = new Date(buildTime).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
  return `v${version} · ${built} · ${commit}`;
}

export function versionLabel(): string {
  return formatVersion(__APP_VERSION__, __BUILD_TIME__, __COMMIT__);
}

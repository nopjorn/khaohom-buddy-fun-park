import { defineConfig, devices } from '@playwright/test';

// ไม่ติดตั้งชนิดข้อมูลของ Node ทั้งชุด เพราะจะทำให้โค้ดในเกมเรียกของ Node ได้โดยไม่รู้ตัว
declare const process: { env: Record<string, string | undefined> };

// ทดสอบกับรุ่นที่ build แล้ว ให้ตรงกับที่ผู้เล่นได้จริง ขนาดจอเท่า iPad แนวนอน
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 1024, height: 768 },
    // service worker จะโหลดหน้าใหม่เองเมื่อมีรุ่นใหม่ ทำให้เทสต์ไม่นิ่ง
    serviceWorkers: 'block',
    locale: 'th-TH',
  },
  projects: [
    { name: 'notebook', use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 } } },
    // เครื่องจอสัมผัสต่างแค่ไม่มีป้ายปุ่มคีย์บอร์ด จึงรันเฉพาะเทสต์ที่ติดป้าย @touch ให้ CI ไม่ช้าเกินไป
    {
      name: 'ipad',
      grep: /@touch/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 }, hasTouch: true },
    },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

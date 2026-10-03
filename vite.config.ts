import { loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import pkg from './package.json';

export default defineConfig(({ mode }) => {
  // GITHUB_SHA มีเฉพาะตอน build บน GitHub Actions ถ้าไม่มีแปลว่ารันหรือ build ในเครื่อง
  const commit = loadEnv(mode, '.', '').GITHUB_SHA?.slice(0, 7) ?? '';

  return {
    // path แบบสัมพัทธ์ เพื่อให้ทำงานบน GitHub Pages ได้ไม่ว่า repo จะชื่ออะไร
    base: './',
    // ข้อมูลรุ่นที่แสดงบนหน้าแรก เวลาและ commit เปลี่ยนเองทุกครั้งที่ deploy
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __COMMIT__: JSON.stringify(commit),
    },
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/favicon.svg', 'icons/apple-touch-icon.png'],
        manifest: {
          name: 'สวนสนุกคู่หู',
          short_name: 'คู่หู',
          description: 'เกม 2 คนสำหรับเด็ก 5 ขวบกับผู้ปกครอง เล่นพร้อมกันบน iPad',
          lang: 'th',
          start_url: './',
          scope: './',
          display: 'standalone',
          background_color: '#bfe9ff',
          theme_color: '#bfe9ff',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
      }),
    ],
    server: { port: 5173 },
    test: {
      include: ['tests/**/*.test.ts'],
      environment: 'node',
    },
  };
});

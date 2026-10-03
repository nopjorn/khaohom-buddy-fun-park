import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // path แบบสัมพัทธ์ เพื่อให้ทำงานบน GitHub Pages ได้ไม่ว่า repo จะชื่ออะไร
  base: './',
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
  server: { port: 5173, strictPort: true },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});

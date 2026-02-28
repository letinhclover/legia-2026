import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',        // KHÔNG auto-update cache
      injectRegister: 'auto',
      includeAssets: ['icon-192.svg', 'icon-512.svg'],
      manifest: {
        name: 'Gia Phả Dòng Họ Lê',
        short_name: 'Gia Phả Họ Lê',
        description: 'Gia phả số – Truyền thống · Đoàn kết · Phát triển',
        theme_color: '#800000',
        background_color: '#800000',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        lang: 'vi',
        icons: [
          { src:'/icon-192.svg', sizes:'192x192', type:'image/svg+xml', purpose:'any maskable' },
          { src:'/icon-512.svg', sizes:'512x512', type:'image/svg+xml', purpose:'any maskable' }
        ],
      },
      workbox: {
        navigateFallback: null,  // KHÔNG cache HTML → luôn load mới
        skipWaiting: false,
        clientsClaim: false,
        runtimeCaching: [
          {
            // Firebase Firestore → luôn cập nhật dữ liệu
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-v1',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 },
            },
          },
          {
            // Cloudinary images → StaleWhileRevalidate
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'cloudinary-imgs',
              expiration: { maxEntries: 300, maxAgeSeconds: 2592000 },
            },
          },
          {
            // Google Fonts → CacheFirst
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 31536000 },
            },
          },
        ],
      },
    }),
  ],
  optimizeDeps: { exclude: ['lucide-react'] },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',   // Thư mục output cần cho Netlify / Cloudflare
    sourcemap: true,
  },
});

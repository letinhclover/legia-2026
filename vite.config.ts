import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // autoUpdate: SW tự cập nhật mà KHÔNG hỏi user → mỗi khi GitHub push, app tự load mã mới
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icon-192.svg', 'icon-512.svg'],
      manifest: {
        name: 'Gia Phả Dòng Họ Lê',
        short_name: 'Gia Phả Lê',
        description: 'Gia phả số – Truyền thống · Đoàn kết · Phát triển',
        theme_color: '#800000',
        background_color: '#800000',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        lang: 'vi',
        icons: [
          { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // navigateFallback null → HTML không bị cache → luôn tải index.html mới
        navigateFallback: null,
        // skipWaiting + clientsClaim → SW mới kích hoạt NGAY, không chờ tab cũ đóng
        skipWaiting: true,
        clientsClaim: true,
        // Xóa cache cũ khi có SW mới
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Firebase Firestore → NetworkFirst (data luôn mới)
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-v2',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 },
            },
          },
          {
            // Cloudinary → StaleWhileRevalidate (ảnh ít thay đổi)
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'cloudinary-imgs-v2',
              expiration: { maxEntries: 300, maxAgeSeconds: 2592000 },
            },
          },
          {
            // Google Fonts → CacheFirst
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gfonts-v2',
              expiration: { maxEntries: 20, maxAgeSeconds: 31536000 },
            },
          },
        ],
      },
    }),
  ],
  optimizeDeps: { exclude: ['lucide-react'] },
});

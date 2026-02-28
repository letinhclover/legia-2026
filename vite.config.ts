import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Người dùng quyết định update cache
      injectRegister: 'auto',
      includeAssets: [
        'favicon.ico',        // Desktop
        'icon-192.png',       // Android/iOS small
        'icon-512.png',       // Android/iOS large
        'icon-maskable.png'   // Maskable cho iOS/Android
      ],
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
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon', purpose: 'any' }
        ],
      },
      workbox: {
        navigateFallback: null, // luôn load mới HTML
        skipWaiting: false,
        clientsClaim: false,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-v1',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 },
            },
          },
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'cloudinary-imgs',
              expiration: { maxEntries: 300, maxAgeSeconds: 2592000 },
            },
          },
          {
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
  build: {
    outDir: 'dist', // thư mục chuẩn deploy Netlify/Cloudflare
    sourcemap: true,
    rollupOptions: {
      output: { manualChunks: undefined },
    },
  },
});

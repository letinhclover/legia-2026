import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',       // User quyết định update cache
      injectRegister: 'auto',
      includeAssets: [
        'favicon.ico',              // Desktop favicon
        'icon-192.png',             // Small Android/iOS
        'icon-512.png',             // Large Android/iOS
        'icon-maskable.png'         // Maskable icon
      ],
      manifest: {
        name: 'Gia Phả Dòng Họ Lê',
        short_name: 'GiaPhảHọLê',
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
        navigateFallback: null,      // luôn load mới HTML, không cache
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
              cacheName: 'cloudinary-images',
              expiration: { maxEntries: 300, maxAgeSeconds: 2592000 }, // 30 ngày
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 31536000 }, // 1 năm
            },
          },
        ],
      },
    }),
  ],
  optimizeDeps: { exclude: ['lucide-react'] },
  build: {
    outDir: path.resolve(__dirname, 'dist'), // quan trọng cho Netlify/Cloudflare Pages
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});

/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      workbox: {
        // Cache FPL bootstrap / fixtures responses for a short window so the app
        // still loads on flaky connections.
        runtimeCaching: [
          {
            urlPattern: /https:\/\/(corsproxy\.io|.*\.workers\.dev)\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'fpl-api',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 },
            },
          },
          {
            urlPattern: /https:\/\/resources\.premierleague\.com\/.*\.(png|jpg|svg)/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pl-assets',
              expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
        ],
      },
      manifest: {
        name: 'FPL Fixture Difficulty',
        short_name: 'FPL-FDR',
        description: 'Fantasy Premier League fixture difficulty rating grid.',
        theme_color: '#0b1220',
        background_color: '#0b1220',
        display: 'standalone',
        start_url: '/FPL-FDR/',
        scope: '/FPL-FDR/',
        icons: [
          { src: 'vite.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
  base: '/FPL-FDR/',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
});

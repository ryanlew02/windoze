import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const BASE = '/DivergeOS/'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      scope: BASE,
      base: BASE,
      includeAssets: ['favicon.svg', 'icons.svg', '**/*.avif', '**/*.png'],
      manifest: {
        name: 'DivergeOS',
        short_name: 'DivergeOS',
        description: 'A faction-themed browser operating system inspired by the Divergent series.',
        theme_color: '#863bff',
        background_color: '#050409',
        display: 'standalone',
        start_url: BASE,
        scope: BASE,
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,avif,woff,woff2}'],
        navigateFallback: `${BASE}index.html`,
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|avif|svg|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'diverge-assets',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: { enabled: true },
    }),
  ],
  base: BASE,
})

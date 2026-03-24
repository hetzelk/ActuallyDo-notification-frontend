import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

const app = process.env.VITE_APP

interface AppManifest {
  name: string
  short_name: string
  theme_color: string
  background_color: string
  description: string
}

const manifests: Record<string, AppManifest> = {
  tuskdue: {
    name: 'TuskDue',
    short_name: 'TuskDue',
    theme_color: '#0f172a',
    background_color: '#ffffff',
    description: 'Never forget what you actually need to do',
  },
  wrenchdue: {
    name: 'WrenchDue',
    short_name: 'WrenchDue',
    theme_color: '#1e3a5f',
    background_color: '#ffffff',
    description: 'Vehicle maintenance tracking made simple',
  },
}

const manifest = app ? manifests[app] : manifests.tuskdue

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: manifest.name,
        short_name: manifest.short_name,
        description: manifest.description,
        theme_color: manifest.theme_color,
        background_color: manifest.background_color,
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              networkTimeoutSeconds: 3,
            },
          },
        ],
      },
      srcDir: path.resolve(__dirname, 'src'),
      filename: 'sw.ts',
      strategies: 'injectManifest',
      injectManifest: {
        globDirectory: path.resolve(__dirname, app ? `dist/${app}` : 'dist'),
      },
    }),
  ],
  root: app ? path.resolve(__dirname, `src/apps/${app}`) : undefined,
  build: app
    ? {
        outDir: path.resolve(__dirname, `dist/${app}`),
        emptyOutDir: true,
      }
    : undefined,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

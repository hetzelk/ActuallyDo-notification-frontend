import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const app = process.env.VITE_APP

export default defineConfig({
  plugins: [react(), tailwindcss()],
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

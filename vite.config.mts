import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// UI sources live in ui/, the production build goes to renderer/,
// which electron/main.js loads via loadFile() when PEAR_DEV_SERVER_URL is not set.
export default defineConfig({
  root: 'ui',
  base: './', // loadFile() serves from file://, so asset URLs must be relative
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
  build: {
    outDir: '../renderer',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    strictPort: true
  }
})

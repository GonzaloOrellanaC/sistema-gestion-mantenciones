/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy()
  ],
  // No pre-bundled optimizeDeps needed. Removed missing formio entries to avoid
  // Vite failing to resolve dependencies that are not installed in the project.
  optimizeDeps: {
    // Some runtime-only internal modules (e.g. platform-specific Ionic/Capacitor helpers)
    // may be incompatible with the dep optimizer and generate stale hashed files.
    // Exclude the problematic modules so Vite will load them on-demand instead.
    exclude: ['hardware-back-button', 'index7']
  },
  server: {
    port: 5100
  },
  resolve: {
    // Redirect any import that attempts to load the embedded Dart Sass
    // implementation to the JS `sass` package instead.
    alias: {
      'sass-embedded': 'sass'
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    css: true,
  },
  resolve: {
    dedupe: ['three', 'react', 'react-dom'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8788', // Target Wrangler dev server if running
        changeOrigin: true,
        secure: false,
        // Mock response if Wrangler isn't running (optional fallback mechanism needs more setup, relying on Wrangler for now)
      },
    },
  },
})

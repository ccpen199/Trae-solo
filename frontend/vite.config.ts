import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 49023,
    strictPort: true,
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:59023',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:59023',
        changeOrigin: true,
      }
    }
  }
})

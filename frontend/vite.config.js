import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 48211,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:48212',
        changeOrigin: true,
      }
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      }
    }
  }
})

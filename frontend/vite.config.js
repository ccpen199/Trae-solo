import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 33168,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:23168',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:23168',
        changeOrigin: true
      }
    }
  }
})

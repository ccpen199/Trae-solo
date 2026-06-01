import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 45837,
    proxy: {
      '/api': {
        target: 'http://localhost:44837',
        changeOrigin: true
      }
    }
  }
})

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 45853,
    proxy: {
      '/api': {
        target: 'http://localhost:44853',
        changeOrigin: true
      }
    }
  }
})

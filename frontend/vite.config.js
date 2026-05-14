import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 9852,
    proxy: {
      '/api': {
        target: 'http://localhost:9851',
        changeOrigin: true
      }
    }
  }
})
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 48072,
    proxy: {
      '/api': {
        target: 'http://localhost:48071',
        changeOrigin: true
      }
    }
  }
})
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 22132,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:12132',
        changeOrigin: true
      }
    }
  }
})

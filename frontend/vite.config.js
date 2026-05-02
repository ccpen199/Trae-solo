import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 21096,
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:11096',
        changeOrigin: true
      }
    }
  }
})

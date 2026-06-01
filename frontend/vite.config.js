import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 45850,
    proxy: {
      '/api': {
        target: 'http://localhost:44850',
        changeOrigin: true
      }
    }
  }
})

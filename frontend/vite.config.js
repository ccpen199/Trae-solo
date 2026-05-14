import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 47632,
    proxy: {
      '/api': {
        target: 'http://localhost:47631',
        changeOrigin: true
      }
    }
  }
})

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 11342,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:11341',
        changeOrigin: true
      }
    }
  }
})

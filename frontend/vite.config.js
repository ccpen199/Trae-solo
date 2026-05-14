import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 9842,
    proxy: {
      '/api': {
        target: 'http://localhost:9841',
        changeOrigin: true
      }
    }
  }
})
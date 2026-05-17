import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 48342,
    proxy: {
      '/api': {
        target: 'http://localhost:48341',
        changeOrigin: true
      }
    }
  }
})

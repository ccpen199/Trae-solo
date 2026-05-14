import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 2999,
    proxy: {
      '/api': {
        target: 'http://localhost:1999',
        changeOrigin: true
      }
    }
  }
})
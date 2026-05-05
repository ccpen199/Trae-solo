import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 33138,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:23138',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:23138',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})

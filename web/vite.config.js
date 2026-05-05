import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 22255,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:12255',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:12255',
        changeOrigin: true,
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})

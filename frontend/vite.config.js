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
    port: 30791,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:20791',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:20791',
        ws: true
      }
    }
  }
})

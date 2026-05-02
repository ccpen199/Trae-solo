import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 21731,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:21730',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:21730',
        ws: true
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})

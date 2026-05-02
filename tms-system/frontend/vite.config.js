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
    port: 7011,
    proxy: {
      '/api': {
        target: 'http://localhost:7010',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:7010',
        ws: true
      }
    }
  }
})

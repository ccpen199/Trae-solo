import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 30789,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:20789',
        changeOrigin: true
      },
      '/mock': {
        target: 'http://localhost:20789',
        changeOrigin: true
      },
      '/health': {
        target: 'http://localhost:20789',
        changeOrigin: true
      }
    }
  }
})

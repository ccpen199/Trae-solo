import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const mobileRoot = path.resolve(__dirname, 'packages/mobile')

export default defineConfig({
  root: mobileRoot,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(mobileRoot, 'src')
    }
  },
  server: {
    host: '127.0.0.1',
    port: 49134,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:59134',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://127.0.0.1:59134',
        changeOrigin: true,
        ws: true
      }
    }
  }
})

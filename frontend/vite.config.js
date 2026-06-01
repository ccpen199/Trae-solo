import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 45864,
    proxy: {
      '/api': {
        target: 'http://localhost:44864',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:44864',
        changeOrigin: true
      }
    }
  }
})
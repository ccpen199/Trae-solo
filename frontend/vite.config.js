import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 24776,
    proxy: {
      '/api': {
        target: 'http://localhost:14776',
        changeOrigin: true
      }
    }
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 48442,
    proxy: {
      '/api': {
        target: 'http://localhost:48441',
        changeOrigin: true
      }
    }
  }
})

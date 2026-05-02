import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 11802,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:11801',
        changeOrigin: true,
      }
    }
  }
})

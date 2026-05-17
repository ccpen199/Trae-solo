import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 47932,
    proxy: {
      '/api': {
        target: 'http://localhost:47931',
        changeOrigin: true
      }
    }
  }
})
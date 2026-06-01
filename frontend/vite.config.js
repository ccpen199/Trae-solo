import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 45851,
    proxy: {
      '/api': {
        target: 'http://localhost:44851',
        changeOrigin: true
      }
    }
  }
})

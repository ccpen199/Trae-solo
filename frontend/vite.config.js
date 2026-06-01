import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 45849,
    proxy: {
      '/api': {
        target: 'http://localhost:44849',
        changeOrigin: true
      }
    }
  }
})
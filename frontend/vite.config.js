import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 48262,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:48261',
        changeOrigin: true
      }
    }
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 48402,
    proxy: {
      '/api': {
        target: 'http://localhost:48401',
        changeOrigin: true
      }
    }
  }
})

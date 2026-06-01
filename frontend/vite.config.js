import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 45860,
    proxy: {
      '/api': {
        target: 'http://localhost:44860',
        changeOrigin: true,
        secure: false,
        followRedirects: true
      }
    }
  }
})

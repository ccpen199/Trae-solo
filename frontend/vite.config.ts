import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 48380,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:48381',
        changeOrigin: true
      }
    }
  }
})
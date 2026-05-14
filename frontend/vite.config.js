import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 12692,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:12691',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 12692
  }
})

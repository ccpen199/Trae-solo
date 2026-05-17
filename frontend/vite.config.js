import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 48272,
    proxy: {
      '/api': {
        target: 'http://localhost:48271',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:48271',
        ws: true
      }
    }
  }
})

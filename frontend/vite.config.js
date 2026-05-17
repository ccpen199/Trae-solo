import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 48092,
    proxy: {
      '/api': {
        target: 'http://localhost:48091',
        changeOrigin: true
      }
    }
  }
})

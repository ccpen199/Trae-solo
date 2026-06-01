import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 45861,
    proxy: {
      '/api': {
        target: 'http://localhost:44861',
        changeOrigin: true
      }
    }
  }
})

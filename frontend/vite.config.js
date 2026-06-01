import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 45857,
    proxy: {
      '/api': {
        target: 'http://localhost:44857',
        changeOrigin: true
      }
    }
  }
})

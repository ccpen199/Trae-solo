import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 9922,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:9921',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 9922
  }
})

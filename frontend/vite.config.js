import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 22212,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:22211',
        changeOrigin: true,
      }
    }
  }
})

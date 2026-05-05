import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 33144,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:23144',
        changeOrigin: true
      }
    }
  }
})

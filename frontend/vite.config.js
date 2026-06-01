import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 45847,
    proxy: {
      '/api': {
        target: 'http://localhost:44847',
        changeOrigin: true,
      }
    }
  }
})

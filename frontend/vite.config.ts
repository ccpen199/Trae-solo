import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 21086,
    host: 'localhost',
    proxy: {
      '/api': {
        target: 'http://localhost:11086',
        changeOrigin: true,
      },
    },
  },
})

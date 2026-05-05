import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 22291,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:12229',
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    port: 22291
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})

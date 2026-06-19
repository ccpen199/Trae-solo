import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const frontendHost = process.env.FRONTEND_HOST || '127.0.0.1'
const frontendPort = Number(process.env.FRONTEND_PORT || process.env.PORT || 5173)
const backendTarget = process.env.VITE_API_TARGET ||
  `http://${process.env.BACKEND_HOST || '127.0.0.1'}:${process.env.BACKEND_PORT || 3001}`

export default defineConfig({
  plugins: [react()],
  server: {
    host: frontendHost,
    port: frontendPort,
    strictPort: true,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true
      },
      '/socket.io': {
        target: backendTarget,
        changeOrigin: true,
        ws: true
      }
    }
  },
  preview: {
    host: frontendHost,
    port: frontendPort,
    strictPort: true
  }
})

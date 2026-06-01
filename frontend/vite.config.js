import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const frontendPort = 47792;
const backendPort = 56792;

export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_FRONTEND_PORT': JSON.stringify(frontendPort.toString()),
    'import.meta.env.VITE_BACKEND_PORT': JSON.stringify(backendPort.toString())
  },
  server: {
    host: '127.0.0.1',
    port: frontendPort,
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${backendPort}`,
        changeOrigin: true
      },
      '/socket.io': {
        target: `http://127.0.0.1:${backendPort}`,
        ws: true
      }
    }
  }
})

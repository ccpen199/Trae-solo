import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.join(__dirname, '..'), '')
  
  const FRONTEND_PORT = parseInt(env.FRONTEND_PORT) || 49076
  const BACKEND_PORT = parseInt(env.BACKEND_PORT) || 59076
  
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: FRONTEND_PORT,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${BACKEND_PORT}`,
          changeOrigin: true
        },
        '/uploads': {
          target: `http://127.0.0.1:${BACKEND_PORT}`,
          changeOrigin: true
        }
      }
    },
    preview: {
      host: '127.0.0.1',
      port: FRONTEND_PORT,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${BACKEND_PORT}`,
          changeOrigin: true
        },
        '/uploads': {
          target: `http://127.0.0.1:${BACKEND_PORT}`,
          changeOrigin: true
        }
      }
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || '/api'),
      'import.meta.env.VITE_FRONTEND_PORT': JSON.stringify(FRONTEND_PORT),
      'import.meta.env.VITE_BACKEND_PORT': JSON.stringify(BACKEND_PORT)
    }
  }
})

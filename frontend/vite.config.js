import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', ['VITE_', 'FRONTEND_', 'BACKEND_', 'API_'])
  const port = parseInt(env.FRONTEND_PORT || env.VITE_FRONTEND_PORT || '49214')
  const backendPort = parseInt(env.BACKEND_PORT || '59214')
  const apiBaseUrl = env.VITE_API_BASE_URL || env.API_BASE_URL || `http://127.0.0.1:${backendPort}/api`
  
  return {
    plugins: [react()],
    server: {
      port: port,
      strictPort: true,
      host: '127.0.0.1',
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true
        }
      }
    },
    preview: {
      port: port,
      strictPort: true,
      host: '127.0.0.1'
    }
  }
})

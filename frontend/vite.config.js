import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '')
  const port = parseInt(env.FRONTEND_PORT) || 48831
  const backendPort = parseInt(env.BACKEND_PORT) || 58831
  
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
    }
  }
})

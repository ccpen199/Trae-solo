import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const projectRoot = path.resolve(__dirname, '..')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, '')
  const frontendPort = Number(env.FRONTEND_PORT || env.VITE_FRONTEND_PORT || 49081)
  const backendPort = Number(env.BACKEND_PORT || env.VITE_BACKEND_PORT || 59081)

  return {
    plugins: [react()],
    server: {
      port: frontendPort,
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
      port: frontendPort,
      strictPort: true,
      host: '127.0.0.1'
    }
  }
})

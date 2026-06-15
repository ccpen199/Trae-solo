import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'), [
    'FRONTEND_',
    'BACKEND_',
    'VITE_',
    'API_'
  ])
  const port = Number(env.FRONTEND_PORT || env.VITE_FRONTEND_PORT || 50213)
  const backendPort = Number(env.BACKEND_PORT || 60213)

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    server: {
      port,
      host: '127.0.0.1',
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true
        }
      }
    },
    preview: {
      port,
      host: '127.0.0.1',
      strictPort: true
    }
  }
})

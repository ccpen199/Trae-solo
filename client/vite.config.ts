import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const host = env.HOST || '127.0.0.1'
  const frontendPort = Number(env.FRONTEND_PORT || env.VITE_PORT || 49183)
  const backendPort = Number(env.BACKEND_PORT || env.PORT || 59183)
  const apiBaseUrl = env.VITE_API_BASE_URL || `http://${host}:${backendPort}`

  return {
    plugins: [react()],
    server: {
      host,
      port: frontendPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: apiBaseUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})

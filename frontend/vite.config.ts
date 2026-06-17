import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '')
  const frontendPort = Number(env.FRONTEND_PORT || 48921)
  const backendPort = Number(env.BACKEND_PORT || 58921)
  const host = env.FRONTEND_HOST || env.HOST || '127.0.0.1'
  const backendHost = env.BACKEND_HOST || env.HOST || '127.0.0.1'

  return {
    plugins: [react()],
    server: {
      port: frontendPort,
      strictPort: true,
      host,
      proxy: {
        '/api': {
          target: `http://${backendHost}:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
  }
})

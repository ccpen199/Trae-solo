import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const frontendPort = Number(env.FRONTEND_PORT || env.APP_PORT || 49111)
  const backendPort = Number(env.BACKEND_PORT || 59111)
  const host = env.HOST || '127.0.0.1'

  return {
    plugins: [react()],
    server: {
      host,
      port: frontendPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
  }
})

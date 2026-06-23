import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const frontendHost = env.FRONTEND_HOST || '127.0.0.1'
  const frontendPort = Number(env.FRONTEND_PORT || 5173)
  const backendUrl = env.BACKEND_URL || 'http://127.0.0.1:59314'

  return {
    plugins: [react()],
    server: {
      host: frontendHost,
      port: frontendPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: false,
        },
      },
    },
    preview: {
      host: frontendHost,
      port: frontendPort,
      strictPort: true,
    },
  }
})

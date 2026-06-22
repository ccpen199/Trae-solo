import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '..', '')
  const frontendPort = Number(env.FRONTEND_PORT) || 48930
  const backendUrl = env.BACKEND_URL || 'http://127.0.0.1:58930'

  return {
    envDir: '..',
    plugins: [react()],
    server: {
      port: frontendPort,
      host: '127.0.0.1',
      strictPort: true,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  }
})

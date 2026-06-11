import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const frontendPort = Number(process.env.FRONTEND_PORT || env.FRONTEND_PORT || 49129)
  const backendPort = Number(process.env.BACKEND_PORT || env.BACKEND_PORT || 59129)

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: '127.0.0.1',
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

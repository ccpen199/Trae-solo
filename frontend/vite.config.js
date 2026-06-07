import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, '..')
  const env = { ...loadEnv(mode, envDir, ''), ...process.env }
  const frontendPort = Number(env.FRONTEND_PORT || 49050)
  const backendPort = Number(env.BACKEND_PORT || 59050)

  return {
    envDir,
    plugins: [react()],
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

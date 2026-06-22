import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const host = env.HOST || '127.0.0.1'
  const frontendPort = Number(env.FRONTEND_PORT || 49311)

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      host,
      port: frontendPort,
      strictPort: true,
    },
    preview: {
      host,
      port: frontendPort,
      strictPort: true,
    }
  }
})

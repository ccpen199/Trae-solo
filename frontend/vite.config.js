import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd() + '/..', '')
  return {
    plugins: [react()],
    server: {
      port: parseInt(env.FRONTEND_PORT) || 46800,
      strictPort: true,
      host: '127.0.0.1',
      proxy: {
        '/api': {
          target: env.API_BASE_URL || 'http://127.0.0.1:56800',
          changeOrigin: true,
        }
      }
    }
  }
})

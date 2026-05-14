import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      port: 9932,
      host: true,
      proxy: {
        '/api': {
          target: env.BACKEND_URL || 'http://localhost:9931',
          changeOrigin: true
        }
      }
    },
    preview: {
      port: 9932
    }
  }
})

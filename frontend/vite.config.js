import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const envRoot = loadEnv(mode, '../', '')
  
  const FRONTEND_PORT = parseInt(env.FRONTEND_PORT || envRoot.FRONTEND_PORT || '49099', 10)
  const BACKEND_URL = env.BACKEND_URL || envRoot.BACKEND_URL || 'http://127.0.0.1:59099'
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    server: {
      host: '127.0.0.1',
      port: FRONTEND_PORT,
      strictPort: true,
      proxy: {
        '/api': {
          target: BACKEND_URL,
          changeOrigin: true
        }
      }
    }
  }
})

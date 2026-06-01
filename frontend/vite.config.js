import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '')
  
  const FRONTEND_PORT = parseInt(env.FRONTEND_PORT || '43445', 10)
  const BACKEND_PORT = parseInt(env.BACKEND_PORT || '53445', 10)

  return {
    plugins: [vue()],
    server: {
      host: '127.0.0.1',
      port: FRONTEND_PORT,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${BACKEND_PORT}`,
          changeOrigin: true,
          secure: false
        },
        '/uploads': {
          target: `http://127.0.0.1:${BACKEND_PORT}`,
          changeOrigin: true,
          secure: false
        }
      }
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/api'),
      'import.meta.env.VITE_FRONTEND_PORT': JSON.stringify(FRONTEND_PORT),
      'import.meta.env.VITE_BACKEND_PORT': JSON.stringify(BACKEND_PORT)
    }
  }
})

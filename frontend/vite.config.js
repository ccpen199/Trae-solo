import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '')
  
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: parseInt(env.FRONTEND_PORT) || 43266,
      strictPort: true,
      hmr: {
        host: '127.0.0.1',
        port: parseInt(env.FRONTEND_PORT) || 43266
      },
      proxy: {
        '/api': {
          target: env.API_BASE_URL || 'http://127.0.0.1:53266',
          changeOrigin: true,
          secure: false
        },
        '/health': {
          target: env.API_BASE_URL || 'http://127.0.0.1:53266',
          changeOrigin: true
        }
      }
    },
    preview: {
      host: '127.0.0.1',
      port: parseInt(env.FRONTEND_PORT) || 43266,
      strictPort: true
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.API_BASE_URL || 'http://127.0.0.1:53266'),
      'import.meta.env.VITE_FRONTEND_PORT': JSON.stringify(env.FRONTEND_PORT || '43266')
    }
  }
})

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '')
  const viteEnv = loadEnv(mode, __dirname, '')

  const port = Number(viteEnv.VITE_PORT || env.FRONTEND_PORT || 49271)
  const proxyTarget = viteEnv.VITE_API_BASE_URL || env.BACKEND_URL || 'http://127.0.0.1:59271'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    server: {
      host: '127.0.0.1',
      port: port,
      strictPort: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true
        }
      }
    },
    preview: {
      host: '127.0.0.1',
      port: port,
      strictPort: true
    }
  }
})

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, '..')
  const env = loadEnv(mode, envDir, '')

  const port = parseInt(env.FRONTEND_PORT || '46797')
  const backendPort = parseInt(env.BACKEND_PORT || '56797')

  return {
    plugins: [vue()],
    server: {
      host: '127.0.0.1',
      port: port,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true
        }
      }
    },
    preview: {
      host: '127.0.0.1',
      port: port,
      strictPort: true
    },
    envDir: envDir
  }
})

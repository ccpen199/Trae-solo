import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../')
  const port = parseInt(env.FRONTEND_PORT || '49152')
  const apiBase = env.VITE_API_URL || 'http://127.0.0.1:59152/api'
  return {
    plugins: [vue()],
    server: {
      host: '127.0.0.1',
      port,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiBase.replace('/api', ''),
          changeOrigin: true
        }
      }
    },
    preview: {
      host: '127.0.0.1',
      port,
      strictPort: true
    }
  }
})

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const host = env.VITE_FRONTEND_HOST || '127.0.0.1'
  const port = Number(env.VITE_FRONTEND_PORT || 49211)
  const backendUrl = env.VITE_BACKEND_URL || 'http://127.0.0.1:59211'

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    server: {
      host,
      port,
      strictPort: true,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true
        }
      }
    }
  }
})

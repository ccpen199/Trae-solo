import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd() + '/..', '')
  const frontendPort = Number(env.FRONTEND_PORT || 49090)
  const backendPort = Number(env.BACKEND_PORT || 59090)

  return {
    plugins: [vue()],
    server: {
      host: '127.0.0.1',
      port: frontendPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
          secure: false
        }
      }
    },
    preview: {
      host: '127.0.0.1',
      port: frontendPort,
      strictPort: true
    }
  }
})

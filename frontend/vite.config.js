import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '')
  
  const frontendPort = parseInt(env.FRONTEND_PORT) || 49093
  const backendUrl = env.BACKEND_URL || 'http://127.0.0.1:59093'
  const apiBaseUrl = env.VITE_API_URL || env.API_BASE_URL || 'http://127.0.0.1:59093/api'
  
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    define: {
      __APP_ENV__: JSON.stringify({
        FRONTEND_PORT: frontendPort,
        BACKEND_URL: backendUrl,
        API_BASE_URL: apiBaseUrl
      })
    },
    server: {
      host: '127.0.0.1',
      port: frontendPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true
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

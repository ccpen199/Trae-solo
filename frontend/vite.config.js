import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.join(__dirname, '..'))
  const backendPort = parseInt(env.BACKEND_PORT) || 59032
  
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      host: '127.0.0.1',
      port: parseInt(env.FRONTEND_PORT) || 49032,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
        }
      }
    },
    define: {
      __APP_ENV__: JSON.stringify(env)
    }
  }
})

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '')
  const port = parseInt(env.FRONTEND_PORT) || 48880
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://127.0.0.1:58880/api'
  
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      host: '127.0.0.1',
      port: port,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiBaseUrl.replace('/api', ''),
          changeOrigin: true
        }
      }
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl),
      'import.meta.env.FRONTEND_PORT': port
    }
  }
})

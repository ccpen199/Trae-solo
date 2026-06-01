import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../')
  const port = parseInt(env.FRONTEND_PORT) || 48830
  
  return {
    plugins: [vue()],
    server: {
      host: '127.0.0.1',
      port: port,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${env.BACKEND_PORT || 58830}`,
          changeOrigin: true
        }
      }
    }
  }
})

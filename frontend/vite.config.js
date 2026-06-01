import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '')
  return {
    plugins: [vue()],
    server: {
      host: '127.0.0.1',
      port: parseInt(env.FRONTEND_PORT) || 48850,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${env.BACKEND_PORT || 58850}`,
          changeOrigin: true
        }
      }
    }
  }
})

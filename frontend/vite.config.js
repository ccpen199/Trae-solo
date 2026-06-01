import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '')
  return {
    plugins: [vue()],
    server: {
      host: '127.0.0.1',
      port: Number(env.FRONTEND_PORT || 44411),
      strictPort: true,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://127.0.0.1:54411',
          changeOrigin: true
        }
      }
    },
    define: {
        'process.env': env
      }
  }
})

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue()],
    server: {
      host: '127.0.0.1',
      port: parseInt(env.FRONTEND_PORT || 48886),
      strictPort: true
    },
    preview: {
      host: '127.0.0.1',
      port: parseInt(env.FRONTEND_PORT || 48886),
      strictPort: true
    }
  }
})

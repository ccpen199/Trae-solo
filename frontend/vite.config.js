import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, '../') }
  return {
    plugins: [react()],
    server: {
      port: parseInt(process.env.FRONTEND_PORT || 48828),
      strictPort: true,
      host: '127.0.0.1',
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${process.env.BACKEND_PORT || 58828}`,
          changeOrigin: true,
        }
      }
    }
  }
})

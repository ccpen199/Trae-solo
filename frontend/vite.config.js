import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../');
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: parseInt(env.FRONTEND_PORT) || 48938,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${parseInt(env.BACKEND_PORT) || 58938}`,
          changeOrigin: true
        }
      }
    },
    define: {
      'process.env': env
    }
  }
})

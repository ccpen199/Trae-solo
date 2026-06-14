import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd() + '/..', '')
  
  return {
    plugins: [react()],
    build: {
      minify: false
    },
    server: {
      host: '127.0.0.1',
      port: parseInt(env.FRONTEND_PORT) || 49028,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${env.BACKEND_PORT || 59028}`,
          changeOrigin: true
        }
      }
    }
  }
})

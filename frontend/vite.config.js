import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '')
  const port = parseInt(env.FRONTEND_PORT || '48937')
  const backendPort = parseInt(env.BACKEND_PORT || '58937')
  const apiProxy = {
    '/api': {
      target: `http://127.0.0.1:${backendPort}`,
      changeOrigin: true,
      secure: false
    }
  }

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: port,
      strictPort: true,
      proxy: apiProxy
    },
    preview: {
      host: '127.0.0.1',
      port: port,
      strictPort: true,
      proxy: apiProxy
    }
  }
})

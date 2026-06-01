import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd() + '/..', '')
  const frontendPort = parseInt(env.FRONTEND_PORT || '48769')
  const backendPort = parseInt(env.BACKEND_PORT || '58769')
  const apiProxy = {
    '/api': {
      target: `http://127.0.0.1:${backendPort}`,
      changeOrigin: true,
    },
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      host: '127.0.0.1',
      port: frontendPort,
      strictPort: true,
      proxy: apiProxy,
    },
    preview: {
      host: '127.0.0.1',
      port: frontendPort,
      strictPort: true,
      proxy: apiProxy,
    },
  }
})

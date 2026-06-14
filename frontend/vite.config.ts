import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '..'))
  const port = parseInt(env.FRONTEND_PORT || '49080')
  const backendPort = parseInt(env.BACKEND_PORT || '59080')

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: port,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
          secure: false
        }
      },
      hmr: {
        host: '127.0.0.1',
        port: port
      }
    },
    preview: {
      host: '127.0.0.1',
      port: port,
      strictPort: true
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    }
  }
})

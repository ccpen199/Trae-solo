import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
import path from 'path'

export default defineConfig(({ mode }) => {
  const envPath = path.resolve(__dirname, '../.env')
  const envContent = fs.readFileSync(envPath, 'utf-8')
  
  const frontendPortMatch = envContent.match(/FRONTEND_PORT=(\d+)/)
  const backendPortMatch = envContent.match(/BACKEND_PORT=(\d+)/)
  
  const FRONTEND_PORT = frontendPortMatch ? parseInt(frontendPortMatch[1]) : 43414
  const BACKEND_PORT = backendPortMatch ? parseInt(backendPortMatch[1]) : 53414

  return {
    plugins: [vue()],
    server: {
      host: '127.0.0.1',
      port: FRONTEND_PORT,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${BACKEND_PORT}`,
          changeOrigin: true
        }
      }
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/api')
    }
  }
})

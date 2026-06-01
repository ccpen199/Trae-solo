import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 46793,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:56793',
          changeOrigin: true
        }
      }
    }
  }
})

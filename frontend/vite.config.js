import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', '')
  return {
    plugins: [react()],
    server: {
      port: parseInt(env.FRONTEND_PORT) || 48814,
      host: '127.0.0.1',
      strictPort: true
    }
  }
})

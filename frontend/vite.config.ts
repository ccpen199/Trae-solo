import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd() + '/..', '')
  const port = parseInt(env.FRONTEND_PORT) || 48952
  
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: port,
      strictPort: true
    },
    envDir: process.cwd() + '/..'
  }
})

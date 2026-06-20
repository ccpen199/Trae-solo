import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: env.HOST || '127.0.0.1',
      port: parseInt(env.FRONTEND_PORT || '49275', 10),
      strictPort: true,
    },
    preview: {
      host: env.HOST || '127.0.0.1',
      port: parseInt(env.FRONTEND_PORT || '49275', 10),
      strictPort: true,
    },
  }
})

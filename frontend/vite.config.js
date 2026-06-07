import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, '')

  return {
    envDir: rootDir,
    plugins: [react()],
    server: {
      port: Number(env.FRONTEND_PORT || 48817),
      host: '127.0.0.1',
      strictPort: true
    }
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '..', '.env')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    for (const line of content.split('\n')) {
      const match = line.match(/^(\w+)=(.*)$/)
      if (match) process.env[match[1]] = match[2]
    }
  }
}
loadEnv()

const frontendPort = parseInt(process.env.FRONTEND_PORT || '43402', 10)
const backendPort = parseInt(process.env.BACKEND_PORT || '53402', 10)

export default defineConfig({
  plugins: [react()],
  base: '/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  server: {
    host: '127.0.0.1',
    port: frontendPort,
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '127.0.0.1',
    port: frontendPort,
    strictPort: true,
  },
})
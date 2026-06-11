import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function loadProjectEnv() {
  const envPath = path.resolve(__dirname, '..', '.env')
  if (!fs.existsSync(envPath)) return {}

  return fs.readFileSync(envPath, 'utf8').split(/\r?\n/).reduce((env, line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return env
    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) return env

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '')
    if (key) env[key] = value
    return env
  }, {})
}

const projectEnv = loadProjectEnv()
const host = process.env.HOST || projectEnv.HOST || '127.0.0.1'
const frontendPort = Number(process.env.FRONTEND_PORT || projectEnv.FRONTEND_PORT || 49162)
const backendUrl = process.env.VITE_API_BASE_URL || projectEnv.VITE_API_BASE_URL || projectEnv.BACKEND_URL || 'http://127.0.0.1:59162'

export default defineConfig({
  plugins: [react()],
  server: {
    host,
    port: frontendPort,
    strictPort: true,
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true
      }
    }
  }
})


import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'

const readRootEnv = () => {
  const envUrl = new URL('../.env', import.meta.url)

  if (!fs.existsSync(envUrl)) return {}

  return fs.readFileSync(envUrl, 'utf8')
    .split(/\r?\n/)
    .reduce((values, line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return values

      const match = trimmed.match(/^([^=\s]+)\s*=\s*(.*)$/)
      if (!match) return values

      const [, key, rawValue] = match
      values[key] = rawValue.replace(/^['"]|['"]$/g, '')
      return values
    }, {})
}

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, '../', ''), ...readRootEnv() }
  const backendPort = parseInt(env.BACKEND_PORT) || 58783
  const frontendPort = parseInt(env.FRONTEND_PORT) || 48783
  const apiTarget = env.API_BASE_URL || `http://127.0.0.1:${backendPort}`
  const apiProxy = {
    '/api': {
      target: apiTarget,
      changeOrigin: true
    }
  }

  return {
    plugins: [react()],
    server: {
      port: frontendPort,
      strictPort: true,
      host: '127.0.0.1',
      proxy: apiProxy
    },
    preview: {
      port: frontendPort,
      strictPort: true,
      host: '127.0.0.1',
      proxy: apiProxy
    }
  }
})

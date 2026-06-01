import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import fs from 'node:fs'

const readEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return {}

  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return env

      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
      if (!match) return env

      env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
      return env
    }, {})
}

const readProjectEnv = (envDir, mode) => ({
  ...readEnvFile(path.join(envDir, '.env')),
  ...readEnvFile(path.join(envDir, `.env.${mode}`))
})

export default defineConfig(({ mode }) => {
  const rootEnvDir = path.resolve(process.cwd(), '..')
  const rootFileEnv = readProjectEnv(rootEnvDir, mode)
  const localFileEnv = readProjectEnv(process.cwd(), mode)
  const rootEnv = loadEnv(mode, rootEnvDir, '')
  const localEnv = loadEnv(mode, process.cwd(), '')
  const env = { ...rootEnv, ...localEnv, ...rootFileEnv, ...localFileEnv }
  const frontendPort = parseInt(env.FRONTEND_PORT, 10) || 46776
  const backendPort = parseInt(env.BACKEND_PORT, 10) || 56776

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: frontendPort,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true
        }
      }
    }
  }
})

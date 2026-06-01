import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function loadEnvFile() {
  const envPath = path.resolve(__dirname, '../.env')
  const envContent = fs.readFileSync(envPath, 'utf-8')
  const env = {}
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) env[key.trim()] = value.trim()
  })
  return env
}

export default defineConfig(() => {
  const env = loadEnvFile()
  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: parseInt(env.FRONTEND_PORT) || 49877,
      strictPort: true
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
      'import.meta.env.FRONTEND_PORT': JSON.stringify(env.FRONTEND_PORT),
      'import.meta.env.BACKEND_PORT': JSON.stringify(env.BACKEND_PORT)
    }
  }
})
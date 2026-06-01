import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
import path from 'path'

function loadEnvFile() {
  const envPath = path.resolve(__dirname, '../.env')
  const env = {}
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    content.split('\n').forEach(line => {
      const match = line.match(/^([^=#]+)=(.*)$/)
      if (match) {
        env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
      }
    })
  }
  return env
}

const env = loadEnvFile()
const port = parseInt(env.FRONTEND_PORT || '43443')
const backendPort = parseInt(env.BACKEND_PORT || '53443')

console.log('Vite config:', { port, backendPort })

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: port,
    strictPort: true,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${backendPort}`,
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    host: '127.0.0.1',
    port: port,
    strictPort: true
  }
})

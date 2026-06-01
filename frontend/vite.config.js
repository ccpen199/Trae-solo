import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import fs from 'fs'
import path from 'path'

function loadEnvFile() {
  const envPath = path.resolve(__dirname, '../.env')
  const env = {}
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    content.split('\n').forEach(line => {
      const [key, ...values] = line.split('=')
      if (key && values.length) {
        env[key.trim()] = values.join('=').trim()
      }
    })
  }
  return env
}

export default defineConfig(() => {
  const env = loadEnvFile()
  const frontendPort = parseInt(env.FRONTEND_PORT) || 49842
  const backendPort = parseInt(env.BACKEND_PORT) || 59842
  
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
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

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

function readEnv() {
  const envPath = path.resolve(__dirname, '../.env')
  const env = {}
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    content.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
      }
    })
  }
  return env
}

export default defineConfig(() => {
  const env = readEnv()
  const frontendPort = parseInt(env.FRONTEND_PORT) || 43488
  const backendPort = parseInt(env.BACKEND_PORT) || 53488
  const apiBaseUrl = env.VITE_API_BASE_URL || `http://127.0.0.1:${backendPort}/api`
  
  console.log('========================================')
  console.log('📋 Vite 配置加载')
  console.log(`📍 前端端口: ${frontendPort}`)
  console.log(`🔌 后端端口: ${backendPort}`)
  console.log(`🌐 API 地址: ${apiBaseUrl}`)
  console.log('========================================')
  
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
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl)
    }
  }
})

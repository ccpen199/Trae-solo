import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'

export default defineConfig(() => {
  let env = {}
  try {
    const envContent = fs.readFileSync('../.env', 'utf-8')
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=')
      if (key && value) env[key.trim()] = value.trim()
    })
  } catch (e) {}
  
  return {
    plugins: [vue()],
    server: {
      host: '127.0.0.1',
      port: parseInt(env.FRONTEND_PORT) || 49957,
      strictPort: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${env.BACKEND_PORT || 59957}`,
          changeOrigin: true
        }
      }
    }
  }
})

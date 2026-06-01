import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, '..')
  const env = loadEnv(mode, envDir, '')
  
  let frontendPort = parseInt(env.FRONTEND_PORT) || 43361
  let backendPort = parseInt(env.BACKEND_PORT) || 53361
  const tail4 = env.TAIL4 || '3361'
  
  const checkPort = (port) => {
    try {
      const result = execSync(`lsof -ti tcp:${port} 2>/dev/null || echo ""`).toString().trim()
      return result === ''
    } catch (e) {
      return true
    }
  }
  
  const slots = [0, 1000, 2000, 3000, 4000, 5000]
  let slotIndex = 0
  let foundPort = false
  
  while (!foundPort && slotIndex < slots.length) {
    const testFrontendPort = 40000 + slots[slotIndex] + parseInt(tail4)
    const testBackendPort = 50000 + slots[slotIndex] + parseInt(tail4)
    
    if (checkPort(testFrontendPort) && checkPort(testBackendPort)) {
      frontendPort = testFrontendPort
      backendPort = testBackendPort
      foundPort = true
      
      if (slotIndex > 0) {
        const envPath = path.join(envDir, '.env')
        let envContent = fs.readFileSync(envPath, 'utf8')
        envContent = envContent.replace(/FRONTEND_PORT=\d+/, `FRONTEND_PORT=${frontendPort}`)
        envContent = envContent.replace(/BACKEND_PORT=\d+/, `BACKEND_PORT=${backendPort}`)
        envContent = envContent.replace(/API_BASE_URL=http:\/\/127\.0\.0\.1:\d+\/api/, `API_BASE_URL=http://127.0.0.1:${backendPort}/api`)
        fs.writeFileSync(envPath, envContent)
        console.log(`端口已更新为: ${frontendPort}/${backendPort}`)
      }
    } else {
      slotIndex++
    }
  }
  
  if (!foundPort) {
    console.error('所有端口槽位均被占用，请手动释放端口后重试')
    process.exit(1)
  }
  
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
    },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(`http://127.0.0.1:${backendPort}/api`),
      'import.meta.env.VITE_FRONTEND_PORT': JSON.stringify(frontendPort),
      'import.meta.env.VITE_BACKEND_PORT': JSON.stringify(backendPort)
    }
  }
})

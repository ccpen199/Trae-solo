import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

function checkPort(port) {
  try {
    const result = execSync(`lsof -ti tcp:${port} 2>/dev/null || echo ""`, { encoding: 'utf8' }).trim()
    return result ? result.split('\n').filter(p => p.trim()) : []
  } catch (e) {
    return []
  }
}

function killProcesses(pids) {
  for (const pid of pids) {
    try {
      const cwd = execSync(`lsof -p ${pid} -a -d cwd -Fn 2>/dev/null | sed 's/^n//' | tail -1`, { encoding: 'utf8' }).trim()
      if (cwd.includes('may-63367')) {
        console.log(`终止当前项目旧进程 PID: ${pid}`)
        execSync(`kill ${pid} 2>/dev/null || true`)
      }
    } catch (e) {
      // ignore
    }
  }
}

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(__dirname, '..')
  const env = loadEnv(mode, envDir)
  const tail4 = 6336
  const slots = [40000, 41000, 42000, 43000, 44000, 45000]
  
  let finalPort = parseInt(env.FRONTEND_PORT) || 46336
  let backendPort = parseInt(env.BACKEND_PORT) || 56336
  
  const currentOccupied = checkPort(finalPort)
  if (currentOccupied.length > 0) {
    console.log(`端口 ${finalPort} 被占用，检查进程归属...`)
    killProcesses(currentOccupied)
    execSync('sleep 1')
    
    if (checkPort(finalPort).length > 0) {
      console.log(`进程不属于当前项目，尝试使用备用端口...`)
      let foundPort = false
      for (let i = 1; i < slots.length; i++) {
        const testPort = slots[i] + tail4
        if (checkPort(testPort).length === 0) {
          finalPort = testPort
          foundPort = true
          const envPath = path.join(envDir, '.env')
          let content = fs.readFileSync(envPath, 'utf8')
          content = content.replace(/FRONTEND_PORT=\d+/, `FRONTEND_PORT=${finalPort}`)
          fs.writeFileSync(envPath, content)
          console.log(`已切换到备用端口: ${finalPort}`)
          break
        }
      }
      if (!foundPort) {
        console.error('所有端口槽位都被占用，请手动释放端口后重试')
        process.exit(1)
      }
    } else {
      console.log(`已释放端口 ${finalPort}`)
    }
  }
  
  console.log(`前端服务端口: ${finalPort}`)
  console.log(`后端服务地址: http://127.0.0.1:${backendPort}`)
  console.log(`访问地址: http://127.0.0.1:${finalPort}/`)
  
  process.env.VITE_PORT = finalPort
  
  return {
    plugins: [vue()],
    server: {
      host: '127.0.0.1',
      port: finalPort,
      strictPort: false,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true
        }
      }
    },
    envDir: envDir
  }
})

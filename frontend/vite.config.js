import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import net from 'net'

const checkPort = (port) => {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`端口 ${port} 已被占用`))
      } else {
        reject(err)
      }
    })
    server.once('listening', () => {
      server.close()
      resolve()
    })
    server.listen(port, '0.0.0.0')
  })
}

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, '../')
  const port = parseInt(env.VITE_PORT) || 5173
  const strictPort = env.VITE_STRICT_PORT === 'true'

  if (strictPort) {
    try {
      await checkPort(port)
      console.log(`端口 ${port} 可用`)
    } catch (error) {
      console.error(`启动失败: ${error.message}`)
      process.exit(1)
    }
  }

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      host: '0.0.0.0',
      port: port,
      strictPort: strictPort,
      proxy: {
        '/api': {
          target: `http://localhost:${parseInt(env.SERVER_PORT) || 5174}`,
          changeOrigin: true
        }
      }
    }
  }
})

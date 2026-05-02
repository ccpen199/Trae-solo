import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createServer } from 'net'

const DEFAULT_PORT = 51799
const PORT_RANGE_START = 51799
const PORT_RANGE_END = 52000

async function findAvailablePort(startPort, endPort) {
  for (let port = startPort; port <= endPort; port++) {
    const available = await new Promise((resolve) => {
      const server = createServer()
      server.on('error', () => resolve(false))
      server.on('listening', () => {
        server.close(() => resolve(true))
      })
      server.listen(port, '127.0.0.1')
    })
    if (available) return port
  }
  return startPort
}

export default defineConfig(async () => {
  const port = await findAvailablePort(PORT_RANGE_START, PORT_RANGE_END)
  console.log(`Using port ${port}`)
  
  return {
    plugins: [vue()],
    server: {
      port: port,
      strictPort: true
    }
  }
})
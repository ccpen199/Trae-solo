import { createServer } from 'node:http'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = dirname(fileURLToPath(import.meta.url))
loadEnv(join(rootDir, '.env'))

const host = process.env.HOST || '127.0.0.1'
const frontendPort = Number(process.env.FRONTEND_PORT || 49311)
const backendPort = Number(process.env.BACKEND_PORT || 59311)
const frontendUrl = process.env.FRONTEND_URL || `http://${host}:${frontendPort}/`
const backendUrl = process.env.BACKEND_URL || `http://${host}:${backendPort}`

const server = createServer((req, res) => {
  if (req.url === '/api/health') {
    const body = JSON.stringify({
      success: true,
      message: 'ok',
      mode: 'mock-frontend-only',
      host,
      frontendUrl,
      backendUrl,
    })

    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': Buffer.byteLength(body),
    })
    res.end(body)
    return
  }

  const body = JSON.stringify({
    success: false,
    error: 'API not found',
  })

  res.writeHead(404, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
})

server.listen(backendPort, host, () => {
  console.log(`Server ready on ${backendUrl}`)
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => {
      process.exit(0)
    })
  })
}

function loadEnv(filePath) {
  if (!existsSync(filePath)) {
    return
  }

  for (const rawLine of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) {
      continue
    }

    const separator = line.indexOf('=')
    if (separator === -1) {
      continue
    }

    const key = line.slice(0, separator).trim()
    const value = line.slice(separator + 1).trim()

    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}

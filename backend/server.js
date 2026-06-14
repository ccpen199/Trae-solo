import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

loadEnv(path.join(projectRoot, '.env'))

const host = process.env.HOST || '127.0.0.1'
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 59142)

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || '*'

  if (req.method === 'OPTIONS') {
    writeCors(res, 204, origin)
    return
  }

  const url = new URL(req.url || '/', `http://${host}:${port}`)

  if (req.method === 'GET' && url.pathname === '/api/health') {
    json(res, 200, {
      success: true,
      ok: true,
      project: 'may-89142',
      service: 'coin-task-local-api',
      time: new Date().toISOString(),
    }, origin)
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/summary') {
    json(res, 200, {
      success: true,
      data: {
        taskTypes: ['steps', 'video', 'checkin', 'invite'],
        walletStatus: 'available',
        adminModules: ['dashboard', 'tasks', 'users', 'risk', 'ads'],
      },
    }, origin)
    return
  }

  json(res, 404, { success: false, error: 'API not found', path: url.pathname }, origin)
})

server.listen(port, host, () => {
  console.log(`may-89142 backend listening on http://${host}:${port}`)
})

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return

  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/)
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2]
  }
}

function writeCors(res, status, origin) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  })
  res.end()
}

function json(res, status, body, origin) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
  })
  res.end(JSON.stringify(body))
}

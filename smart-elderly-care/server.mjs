import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const readEnvFile = () => {
  const envPath = path.join(__dirname, '.env')
  if (!existsSync(envPath)) return {}

  return readFileSync(envPath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .reduce((acc, line) => {
      const idx = line.indexOf('=')
      const key = line.slice(0, idx).trim()
      const value = line.slice(idx + 1).trim()
      acc[key] = value
      return acc
    }, {})
}

const env = {
  ...readEnvFile(),
  ...process.env,
}

const host = env.HOST || '127.0.0.1'
const port = Number.parseInt(env.BACKEND_PORT || '59275', 10)

const json = (res, status, payload) => {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(JSON.stringify(payload))
}

const server = createServer((req, res) => {
  const url = req.url || '/'

  if (req.method === 'GET' && (url === '/api/health' || url === '/api/health/')) {
    return json(res, 200, {
      code: 0,
      message: 'ok',
      data: {
        status: 'healthy',
        app: 'smart-elderly-care-mock-backend',
        timestamp: new Date().toISOString(),
        roles: ['government', 'institution', 'family'],
        dataMode: 'embedded-mock',
      },
    })
  }

  if (req.method === 'GET' && (url === '/' || url === '/api')) {
    return json(res, 200, {
      code: 0,
      message: '智慧养老项目后端已启动，当前项目以前端内置 mock 数据为主。',
    })
  }

  return json(res, 404, {
    code: 404,
    message: `Not Found: ${req.method} ${url}`,
  })
})

server.listen(port, host, () => {
  console.log(`Smart elderly care backend listening on http://${host}:${port}`)
})

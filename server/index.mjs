import http from 'node:http'

process.loadEnvFile('.env')

const host = process.env.HOST || '127.0.0.1'
const port = Number(process.env.BACKEND_PORT || 59307)

const payload = {
  ok: true,
  service: 'city-life-service-knowledge-graph-backend',
  timestamp: new Date().toISOString(),
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || `${host}:${port}`}`)

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify(payload))
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/config') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(
      JSON.stringify({
        ...payload,
        apiBaseUrl: process.env.VITE_API_BASE_URL || `http://${host}:${port}/api`,
      }),
    )
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify({ ok: false, error: 'Not Found', path: url.pathname }))
})

server.listen(port, host, () => {
  console.log(`Backend listening on http://${host}:${port}`)
})

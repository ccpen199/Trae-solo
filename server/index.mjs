import http from 'node:http'

const frontendPort = Number(process.env.VITE_PORT || 49281)
const host = process.env.BACKEND_HOST || '127.0.0.1'
const port = Number(process.env.BACKEND_PORT || 59281)

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', `http://127.0.0.1:${frontendPort}`)
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Trace-Id')
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload)
  setCorsHeaders(res)
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

function sendReportDownload(res, reportId) {
  const body = [
    `reportId=${reportId}`,
    'project=may-89281',
    `generatedAt=${new Date().toISOString()}`,
    'status=ok',
  ].join('\n')

  setCorsHeaders(res)
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Disposition': `attachment; filename="${reportId}-report.txt"`,
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${host}:${port}`)

  if (req.method === 'OPTIONS') {
    setCorsHeaders(res)
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/health') {
    sendJson(res, 200, {
      code: 0,
      message: 'success',
      data: {
        status: 'ok',
        service: 'may-89281-backend',
        host,
        port,
      },
      timestamp: Date.now(),
      traceId: 'health-check',
    })
    return
  }

  const reportMatch = url.pathname.match(/^\/api\/reports\/([^/]+)\/export$/)
  if (req.method === 'GET' && reportMatch) {
    sendReportDownload(res, reportMatch[1])
    return
  }

  sendJson(res, 404, {
    code: 404,
    message: `Route not found: ${req.method} ${url.pathname}`,
    data: null,
    timestamp: Date.now(),
    traceId: 'not-found',
  })
})

server.listen(port, host, () => {
  console.log(`backend listening on http://${host}:${port}`)
})

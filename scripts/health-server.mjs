import http from 'node:http'

const port = Number(process.env.PORT || process.env.BACKEND_PORT || 58943)
const host = '127.0.0.1'

function send(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': 'http://127.0.0.1:48943',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  })
  res.end(payload)
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': 'http://127.0.0.1:48943',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    })
    res.end()
    return
  }

  if (req.url === '/api/health') {
    send(res, 200, { success: true, message: 'ok' })
    return
  }

  if (req.url === '/api/auth/login' && req.method === 'POST') {
    send(res, 200, {
      success: true,
      data: {
        token: 'demo-token',
        user: { id: 1, username: 'admin', role: 'admin', name: '系统管理员', phone: '13800000000' },
      },
    })
    return
  }

  if (req.url === '/api/auth/me') {
    send(res, 200, { success: true, data: { id: 1, username: 'admin', role: 'admin', name: '系统管理员' } })
    return
  }

  send(res, 404, { success: false, error: 'API not found' })
})

server.listen(port, host, () => {
  console.log(`Health server ready on http://${host}:${port}`)
})

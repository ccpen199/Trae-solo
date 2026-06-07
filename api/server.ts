import http from 'http'
import { WebSocketServer } from 'ws'
import app from './app.js'
import { env } from './config/env.js'

const PORT = env.BACKEND_PORT || 59011
const HOST = '127.0.0.1'

const server = http.createServer(app)

const wss = new WebSocketServer({ server, path: '/ws' })

const clients = new Map<string, Set<WebSocket>>()

wss.on('connection', (ws, req) => {
  console.log('WebSocket client connected')

  const url = new URL(req.url || '', `http://${req.headers.host}`)
  const userId = url.searchParams.get('userId') || 'anonymous'

  if (!clients.has(userId)) {
    clients.set(userId, new Set())
  }
  clients.get(userId)!.add(ws)

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      
      if (message.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }))
      } else if (message.type === 'subscribe') {
        ws.send(JSON.stringify({ 
          type: 'subscribed', 
          channel: message.channel,
          timestamp: Date.now()
        }))
      }
    } catch (err) {
      console.error('WebSocket message error:', err)
    }
  })

  ws.on('close', () => {
    console.log('WebSocket client disconnected')
    if (clients.has(userId)) {
      clients.get(userId)!.delete(ws)
      if (clients.get(userId)!.size === 0) {
        clients.delete(userId)
      }
    }
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
  })

  ws.send(JSON.stringify({
    type: 'connected',
    message: 'WebSocket连接成功',
    timestamp: Date.now()
  }))
})

export function broadcastToUser(userId: string, message: any): void {
  const userClients = clients.get(userId)
  if (userClients) {
    userClients.forEach(ws => {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify(message))
      }
    })
  }
}

export function broadcastToAll(message: any): void {
  wss.clients.forEach(ws => {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(message))
    }
  })
}

server.listen(PORT, HOST, () => {
  console.log(`Server ready on http://${HOST}:${PORT}`)
  console.log(`WebSocket ready on ws://${HOST}:${PORT}/ws`)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received')
  wss.close(() => {
    console.log('WebSocket server closed')
  })
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received')
  wss.close(() => {
    console.log('WebSocket server closed')
  })
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

export { server, wss }
export default app

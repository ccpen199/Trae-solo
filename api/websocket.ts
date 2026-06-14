import { WebSocketServer, WebSocket } from 'ws'
import { type Server } from 'http'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'vehicle_monitor_jwt_secret_2024'

interface ClientInfo {
  ws: WebSocket
  userId?: number
}

const clients: Map<WebSocket, ClientInfo> = new Map()
let wss: WebSocketServer | null = null

export function initWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: '/ws' })
  wss.on('connection', (ws: WebSocket, req) => {
    try {
      const url = new URL(req.url || '', `http://${req.headers.host}`)
      const token = url.searchParams.get('token')
      if (!token) {
        ws.close(4001, '未提供认证令牌')
        return
      }
      const decoded = jwt.verify(token, JWT_SECRET) as any
      clients.set(ws, { ws, userId: decoded.id })
      ws.on('close', () => {
        clients.delete(ws)
      })
      ws.on('error', () => {
        clients.delete(ws)
      })
      ws.send(JSON.stringify({ type: 'connected', data: { message: 'WebSocket连接成功' } }))
    } catch {
      ws.close(4001, '认证令牌无效')
    }
  })
}

export function broadcast(type: string, data: any): void {
  const message = JSON.stringify({ type, data })
  for (const [ws, client] of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message)
    }
  }
}

export function getConnectedClientsCount(): number {
  return clients.size
}

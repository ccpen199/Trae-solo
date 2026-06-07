import { WebSocketServer, type WebSocket } from 'ws'
import db from './db.js'

interface LiveClient {
  ws: WebSocket
  liveId: number
}

let wss: WebSocketServer | null = null
const clients = new Map<number, LiveClient[]>()

const initWSS = (server: any) => {
  wss = new WebSocketServer({ server })

  wss.on('connection', (ws) => {
    let currentLiveId: number | null = null

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString())
        
        if (message.type === 'join' && message.liveId) {
          currentLiveId = message.liveId
          if (!clients.has(currentLiveId)) {
            clients.set(currentLiveId, [])
          }
          clients.get(currentLiveId)!.push({ ws, liveId: currentLiveId })
          ws.send(JSON.stringify({ type: 'joined', liveId: currentLiveId }))
        }
        
        if (message.type === 'danmaku' && message.liveId && message.content) {
          const { liveId, content, userId, username } = message
          
          try {
            const stmt = db.prepare(`
              INSERT INTO danmaku (live_id, user_id, username, content)
              VALUES (?, ?, ?, ?)
            `)
            stmt.run(liveId, userId || 0, username || '匿名', content)
          } catch (err) {
            console.error('Failed to save danmaku:', err)
          }
          
          broadcastDanmaku(Number(liveId), {
            liveId,
            content,
            username: username || '匿名',
            createdAt: new Date().toISOString()
          })
        }
      } catch (err) {
        console.error('WebSocket message error:', err)
      }
    })

    ws.on('close', () => {
      if (currentLiveId && clients.has(currentLiveId)) {
        const liveClients = clients.get(currentLiveId)!
        const filtered = liveClients.filter(c => c.ws !== ws)
        if (filtered.length === 0) {
          clients.delete(currentLiveId)
        } else {
          clients.set(currentLiveId, filtered)
        }
      }
    })

    ws.on('error', (err) => {
      console.error('WebSocket error:', err)
    })
  })

  return wss
}

const broadcastDanmaku = (liveId: number, danmakuData: any) => {
  const liveClients = clients.get(Number(liveId))
  if (liveClients) {
    const msg = JSON.stringify({
      type: 'danmaku',
      ...danmakuData
    })
    liveClients.forEach(client => {
      if (client.ws.readyState === 1) {
        client.ws.send(msg)
      }
    })
  }
}

export { initWSS, broadcastDanmaku }

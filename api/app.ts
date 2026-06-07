import express, {
  type Request,
  type Response,
  type NextFunction,
  type Application,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { createServer } from 'http'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'

import authRoutes from './routes/auth.js'
import propertyRoutes from './routes/property.js'
import purchaseRoutes from './routes/purchase.js'
import imRoutes from './routes/im.js'
import adminRoutes from './routes/admin.js'
import { JWT_SECRET } from './middleware/auth.js'
import type { ApiResponse, JwtPayload } from './types/index.js'
import db from './db/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: Application = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

io.on('connection', (socket) => {
  const token = socket.handshake.auth.token
  let userId: number | null = null

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
      userId = decoded.userId
      socket.join(`user:${userId}`)
    } catch (error) {
      console.log('Socket auth failed:', error)
    }
  }

  socket.on('sendMessage', (data) => {
    const { sessionId, receiverId, content, type = 'text' } = data
    if (!userId || !sessionId || !receiverId || !content) return

    const result = db.prepare(`
      INSERT INTO messages (session_id, sender_id, receiver_id, content, type)
      VALUES (?, ?, ?, ?, ?)
    `).run(sessionId, userId, receiverId, content, type)

    db.prepare(`
      UPDATE chat_sessions SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(sessionId)

    const message = db.prepare(`
      SELECT m.*, u.name as sender_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid)

    io.to(`user:${receiverId}`).emit('newMessage', message)
    io.to(`user:${userId}`).emit('messageSent', message)
  })

  socket.on('typing', (data) => {
    const { receiverId, isTyping } = data
    if (userId && receiverId) {
      io.to(`user:${receiverId}`).emit('userTyping', { userId, isTyping })
    }
  })

  socket.on('markRead', (data) => {
    const { sessionId } = data
    if (userId && sessionId) {
      db.prepare(`
        UPDATE messages SET is_read = 1 
        WHERE session_id = ? AND receiver_id = ? AND is_read = 0
      `).run(sessionId, userId)
    }
  })

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id)
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/properties', propertyRoutes)
app.use('/api/purchase', purchaseRoutes)
app.use('/api/im', imRoutes)
app.use('/api/admin', adminRoutes)

app.get(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      code: 200,
      message: 'ok',
      data: {
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    } as ApiResponse)
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', error)
  res.status(500).json({
    code: 500,
    message: '服务器内部错误：' + error.message,
    data: null
  } as ApiResponse)
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    code: 404,
    message: 'API 不存在',
    data: null
  } as ApiResponse)
})

export { app, server, io }
export default app

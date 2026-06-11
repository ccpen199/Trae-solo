import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { randomUUID } from 'crypto'

const router = Router()

const tokenUserMap = new Map<string, Record<string, unknown>>()

router.post('/login', (req: Request, res: Response): void => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      res.status(400).json({ success: false, error: 'Username and password are required' })
      return
    }

    const user = db.prepare(`SELECT * FROM users WHERE name = ?`).get(username) as Record<string, unknown> | undefined

    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' })
      return
    }

    if (password !== '123456') {
      res.status(401).json({ success: false, error: 'Invalid password' })
      return
    }

    const token = `token-${randomUUID()}`
    tokenUserMap.set(token, user)

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          ca_token: user.ca_token,
        },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/register', (req: Request, res: Response): void => {
  try {
    const { name, role } = req.body

    if (!name) {
      res.status(400).json({ success: false, error: 'Name is required' })
      return
    }

    const existing = db.prepare(`SELECT * FROM users WHERE name = ?`).get(name)
    if (existing) {
      res.status(409).json({ success: false, error: 'User already exists' })
      return
    }

    const id = `user-${randomUUID().slice(0, 8)}`
    const userRole = role || 'citizen'

    db.prepare(`INSERT INTO users (id, name, role) VALUES (?, ?, ?)`).run(id, name, userRole)

    res.json({
      success: true,
      data: {
        id,
        name,
        role: userRole,
        message: 'Registration successful (demo mode)',
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/me', (req: Request, res: Response): void => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'No token provided' })
      return
    }

    const token = authHeader.slice(7)
    const user = tokenUserMap.get(token)

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' })
      return
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        role: user.role,
        ca_token: user.ca_token,
        created_at: user.created_at,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router

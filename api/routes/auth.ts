/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { randomUUID } from 'crypto'

const router = Router()

const demoUser = {
  id: 'u1',
  phone: '13800138000',
  name: '张伟',
  role: 'user',
}

function publicUser(user: any) {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
  }
}

/**
 * User Login
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { phone = demoUser.phone, name = demoUser.name, role = 'user' } = req.body || {}
  let user = db.prepare('SELECT id, phone, name, role FROM users WHERE phone = ?').get(phone) as any
  if (!user) {
    const id = randomUUID()
    db.prepare('INSERT INTO users (id, phone, name, role) VALUES (?, ?, ?, ?)').run(id, phone, name, role)
    user = db.prepare('SELECT id, phone, name, role FROM users WHERE id = ?').get(id)
  }
  res.status(201).json({ success: true, data: { user: publicUser(user), token: `logistics-${Date.now()}` } })
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const phone = req.body?.phone || demoUser.phone
  let user = db.prepare('SELECT id, phone, name, role FROM users WHERE phone = ?').get(phone) as any
  if (!user) {
    user = db.prepare('SELECT id, phone, name, role FROM users WHERE id = ?').get(demoUser.id) as any
  }
  res.json({ success: true, data: { user: publicUser(user || demoUser), token: `logistics-${Date.now()}` } })
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true, message: 'logged out' })
})

router.get(['/me', '/profile'], async (_req: Request, res: Response): Promise<void> => {
  const user = db.prepare('SELECT id, phone, name, role FROM users WHERE id = ?').get(demoUser.id) as any
  res.json({ success: true, data: publicUser(user || demoUser) })
})

export default router

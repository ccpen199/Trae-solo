import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import { getDb } from '../db.js'

const router = Router()

router.post('/register', (req: Request, res: Response): void => {
  const { username, password, role } = req.body
  if (!username || !password || !role) {
    res.status(400).json({ error: 'username, password, role are required' })
    return
  }
  const validRoles = ['designer', 'pm', 'developer', 'researcher']
  if (!validRoles.includes(role)) {
    res.status(400).json({ error: 'invalid role' })
    return
  }
  const db = getDb()
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existing) {
    res.status(409).json({ error: 'username already exists' })
    return
  }
  const password_hash = bcrypt.hashSync(password, 10)
  const result = db.prepare(
    'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)'
  ).run(username, password_hash, role)
  const user = db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ token: username, user })
})

router.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body
  if (!username || !password) {
    res.status(400).json({ error: 'username and password are required' })
    return
  }
  const db = getDb()
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any
  if (!row) {
    res.status(401).json({ error: 'invalid credentials' })
    return
  }
  if (!bcrypt.compareSync(password, row.password_hash)) {
    res.status(401).json({ error: 'invalid credentials' })
    return
  }
  const user = { id: row.id, username: row.username, role: row.role, created_at: row.created_at }
  res.json({ token: username, user })
})

router.get('/me', (req: Request, res: Response): void => {
  const token = req.query.token as string
  if (!token) {
    res.status(401).json({ error: 'token required' })
    return
  }
  const db = getDb()
  const user = db.prepare('SELECT id, username, role, created_at FROM users WHERE username = ?').get(token)
  if (!user) {
    res.status(404).json({ error: 'user not found' })
    return
  }
  res.json(user)
})

export default router

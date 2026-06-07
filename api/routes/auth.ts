import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.post('/register', (req: Request, res: Response): void => {
  try {
    const { username, password, name, role, enterprise_id } = req.body

    if (!username || !password || !name) {
      res.status(400).json({ success: false, error: 'Username, password, and name are required' })
      return
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
    if (existingUser) {
      res.status(400).json({ success: false, error: 'Username already exists' })
      return
    }

    const userColumns = db.pragma('table_info(users)') as Array<{ name: string }>
    const hasPasswordColumn = userColumns.some((column) => column.name === 'password')
    const passwordColumn = hasPasswordColumn ? 'password' : 'password_hash'
    const stmt = db.prepare(`INSERT INTO users (username, ${passwordColumn}, name, role, enterprise_id) VALUES (?, ?, ?, ?, ?)`)
    const result = stmt.run(username, password, name, role || 'enterprise', enterprise_id || null)

    const user = db.prepare('SELECT id, username, name, role, enterprise_id, created_at FROM users WHERE id = ?').get(result.lastInsertRowid)

    res.json({ success: true, data: user })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ success: false, error: 'Registration failed' })
  }
})

router.post('/login', (req: Request, res: Response): void => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      res.status(400).json({ success: false, error: '请输入用户名和密码' })
      return
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any
    if (!user) {
      res.status(401).json({ success: false, error: '账号不存在，请检查用户名' })
      return
    }

    const storedPassword = user.password_hash || user.password
    if (storedPassword !== password) {
      res.status(401).json({ success: false, error: '密码错误，请重新输入' })
      return
    }

    const { password: _, password_hash: __, ...userWithoutPassword } = user

    let enterprise = null
    if (user.enterprise_id) {
      enterprise = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(user.enterprise_id)
    }

    const token = `token_${user.id}_${Date.now()}`
    res.json({ success: true, data: { ...userWithoutPassword, enterprise, token } })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ success: false, error: '系统异常，请稍后重试' })
  }
})

router.post('/logout', (req: Request, res: Response): void => {
  try {
    res.json({ success: true, data: { message: 'Logged out successfully' } })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ success: false, error: 'Logout failed' })
  }
})

router.get('/me', (req: Request, res: Response): void => {
  try {
    const userId = req.headers['x-user-id'] as string

    if (!userId) {
      res.status(401).json({ success: false, error: 'Not authenticated' })
      return
    }

    const user = db.prepare('SELECT id, username, name, role, enterprise_id, created_at FROM users WHERE id = ?').get(userId) as any
    if (!user) {
      res.status(401).json({ success: false, error: 'User not found' })
      return
    }

    let enterprise = null
    if (user.enterprise_id) {
      enterprise = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(user.enterprise_id)
    }

    res.json({ success: true, data: { ...user, enterprise } })
  } catch (error) {
    console.error('Get current user error:', error)
    res.status(500).json({ success: false, error: 'Failed to get user information' })
  }
})

export default router

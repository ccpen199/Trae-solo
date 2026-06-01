import express, { type Request, type Response } from 'express'
import db from '../database.js'

const router = express.Router()

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body

  const user = db.prepare(`
    SELECT id, username, name, role, department
    FROM users
    WHERE username = ? AND password = ?
  `).get(username, password)

  if (!user) {
    return res.status(401).json({
      success: false,
      error: '用户名或密码错误'
    })
  }

  res.json({
    success: true,
    data: user
  })
})

router.post('/logout', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: '登出成功'
  })
})

router.get('/users', (req: Request, res: Response) => {
  const users = db.prepare(`
    SELECT id, username, name, role, department, created_at
    FROM users
    ORDER BY id
  `).all()

  res.json({
    success: true,
    data: users
  })
})

export default router

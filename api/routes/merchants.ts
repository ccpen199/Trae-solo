import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.post('/apply', (req: Request, res: Response): void => {
  const { user_id, name, license_url, category } = req.body
  if (!user_id || !name) {
    res.status(400).json({ success: false, error: 'user_id和name为必填项' })
    return
  }

  const db = getDb()
  const existing = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(user_id)
  if (existing) {
    res.status(409).json({ success: false, error: '该用户已提交入驻申请' })
    return
  }

  const result = db.prepare(
    'INSERT INTO merchants (user_id, name, license_url, category, status) VALUES (?, ?, ?, ?, ?)'
  ).run(user_id, name, license_url || null, category || null, 'pending')

  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: merchant })
})

export default router

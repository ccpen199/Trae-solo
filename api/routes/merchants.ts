import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.post('/verify', (req: Request, res: Response): void => {
  const db = getDb()
  const { user_id, name, license_no } = req.body

  if (!user_id || !name || !license_no) {
    res.status(400).json({ success: false, error: 'Missing required fields: user_id, name, license_no' })
    return
  }

  const existing = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(user_id)
  if (existing) {
    res.status(409).json({ success: false, error: 'Merchant already exists for this user' })
    return
  }

  const result = db.prepare(
    'INSERT INTO merchants (user_id, name, license_no, license_verified, deposit_amount, deposit_status, rating, review_count) VALUES (?, ?, ?, 0, 0, ?, 0, 0)'
  ).run(user_id, name, license_no, 'none')

  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: merchant })
})

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const merchants = db.prepare(
    'SELECT m.*, u.phone, u.name as user_name FROM merchants m JOIN users u ON m.user_id = u.id ORDER BY m.rating DESC'
  ).all()

  res.json({ success: true, data: merchants })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const merchant = db.prepare(
    'SELECT m.*, u.phone, u.name as user_name FROM merchants m JOIN users u ON m.user_id = u.id WHERE m.id = ?'
  ).get(req.params.id)

  if (!merchant) {
    res.status(404).json({ success: false, error: 'Merchant not found' })
    return
  }

  res.json({ success: true, data: merchant })
})

router.get('/:id/reviews', (req: Request, res: Response): void => {
  const db = getDb()
  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.id)

  if (!merchant) {
    res.status(404).json({ success: false, error: 'Merchant not found' })
    return
  }

  const reviews = db.prepare(
    `SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.merchant_id = ? ORDER BY r.created_at DESC`
  ).all(req.params.id)

  res.json({ success: true, data: reviews })
})

router.post('/:id/deposit', (req: Request, res: Response): void => {
  const db = getDb()
  const { amount } = req.body

  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined
  if (!merchant) {
    res.status(404).json({ success: false, error: 'Merchant not found' })
    return
  }

  const depositAmount = amount || 0
  const depositStatus = depositAmount >= 10000 ? 'paid' : 'pending'

  db.prepare(
    'UPDATE merchants SET deposit_amount = ?, deposit_status = ? WHERE id = ?'
  ).run(depositAmount, depositStatus, req.params.id)

  const updated = db.prepare('SELECT * FROM merchants WHERE id = ?').get(req.params.id)
  res.json({ success: true, data: updated })
})

export default router

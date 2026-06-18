import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/status', auth, (req: Request, res: Response): void => {
  const db = getDb()
  const records = db.prepare(
    'SELECT * FROM insurance_records WHERE user_id = ?'
  ).all(req.user!.userId)
  res.json({ ok: true, records })
})

router.get('/payments', auth, (req: Request, res: Response): void => {
  const db = getDb()
  const { year } = req.query

  let sql = 'SELECT * FROM payment_records WHERE user_id = ?'
  const params: any[] = [req.user!.userId]

  if (year) {
    sql += ' AND period LIKE ?'
    params.push(`${year}%`)
  }

  sql += ' ORDER BY period DESC'
  const payments = db.prepare(sql).all(...params)
  res.json({ ok: true, payments })
})

export default router

import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type, user_id, page = '1', pageSize = '20' } = req.query
    const p = Number(page)
    const ps = Number(pageSize)
    const conditions: string[] = []
    const params: any[] = []

    if (status) { conditions.push('p.status = ?'); params.push(status) }
    if (type) { conditions.push('p.type = ?'); params.push(type) }
    if (user_id) { conditions.push('p.user_id = ?'); params.push(user_id) }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    const total = (db.prepare(`SELECT COUNT(*) as c FROM payments p ${where}`).get(params) as any).c
    const rows = db.prepare(
      `SELECT p.*, u.name as user_name FROM payments p LEFT JOIN users u ON p.user_id = u.id ${where} ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`
    ).all(...params, ps, (p - 1) * ps)

    res.json({ success: true, data: { list: rows, total, page: p, pageSize: ps } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:id/pay', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id) as any
    if (!payment) {
      res.status(404).json({ success: false, error: '账单不存在' })
      return
    }
    if (payment.status === 'paid') {
      res.status(400).json({ success: false, error: '账单已支付' })
      return
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const receiptNo = 'RCP' + Date.now()

    db.prepare(
      "UPDATE payments SET status = 'paid', paid_at = ?, updated_at = datetime('now','localtime') WHERE id = ?"
    ).run(now, payment.id)

    db.prepare(
      'INSERT INTO payment_receipts (payment_id, receipt_no, amount, paid_at) VALUES (?,?,?,?)'
    ).run(payment.id, receiptNo, payment.amount, now)

    const updated = db.prepare('SELECT * FROM payments WHERE id = ?').get(payment.id)
    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id/receipt', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const receipt = db.prepare(
      `SELECT pr.*, p.type, p.period, p.description, u.name as user_name
       FROM payment_receipts pr
       JOIN payments p ON pr.payment_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE pr.payment_id = ?`
    ).get(req.params.id) as any

    if (!receipt) {
      res.status(404).json({ success: false, error: '收据不存在' })
      return
    }

    res.json({ success: true, data: receipt })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router

import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware } from '../auth.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, taxpayer_id } = req.query
    let sql = `SELECT p.*, t.name as taxpayer_name, d.period as declaration_period
      FROM payments p
      JOIN taxpayers t ON p.taxpayer_id = t.id
      LEFT JOIN declarations d ON p.declaration_id = d.id
      WHERE 1=1`
    const params: any[] = []
    if (req.user!.role !== 'admin') {
      sql += ' AND p.user_id = ?'
      params.push(req.user!.id)
    }
    if (status) {
      sql += ' AND p.status = ?'
      params.push(status)
    }
    if (taxpayer_id) {
      sql += ' AND p.taxpayer_id = ?'
      params.push(taxpayer_id)
    }
    sql += ' ORDER BY p.created_at DESC'
    const payments = db.prepare(sql).all(...params)
    res.json({ success: true, data: payments })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取缴款列表失败' })
  }
})

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { declaration_id, taxpayer_id, amount } = req.body
    if (!taxpayer_id || !amount) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }
    const voucherNo = `PAY-${new Date().getFullYear()}-${String(Date.now()).slice(-8)}`
    const result = db.prepare(
      'INSERT INTO payments (declaration_id, taxpayer_id, user_id, amount, voucher_no) VALUES (?, ?, ?, ?, ?)'
    ).run(declaration_id || null, taxpayer_id, req.user!.id, amount, voucherNo)
    res.json({ success: true, data: { id: result.lastInsertRowid, voucher_no: voucherNo } })
  } catch (err) {
    res.status(500).json({ success: false, error: '创建缴款记录失败' })
  }
})

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const payment = db.prepare(
      `SELECT p.*, t.name as taxpayer_name, d.period as declaration_period
       FROM payments p
       JOIN taxpayers t ON p.taxpayer_id = t.id
       LEFT JOIN declarations d ON p.declaration_id = d.id
       WHERE p.id = ?`
    ).get(req.params.id) as any
    if (!payment) {
      res.status(404).json({ success: false, error: '缴款记录不存在' })
      return
    }
    res.json({ success: true, data: payment })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取缴款详情失败' })
  }
})

router.post('/:id/pay', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(req.params.id) as any
    if (!payment) {
      res.status(404).json({ success: false, error: '缴款记录不存在' })
      return
    }
    if (payment.status !== 'pending') {
      res.status(400).json({ success: false, error: '仅待缴款状态可支付' })
      return
    }
    const { pay_method } = req.body
    const transactionId = `TXN-${uuidv4().slice(0, 12).toUpperCase()}`
    db.prepare('UPDATE payments SET status=?, pay_method=?, transaction_id=?, paid_at=datetime(\'now\') WHERE id=?')
      .run('paid', pay_method || 'treasury_gateway', transactionId, req.params.id)
    res.json({ success: true, data: { transaction_id: transactionId, status: 'paid' } })
  } catch (err) {
    res.status(500).json({ success: false, error: '支付失败' })
  }
})

export default router

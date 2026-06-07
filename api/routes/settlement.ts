import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/list', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = db.prepare(`
      SELECT s.*, w.waybill_no, o.from_city, o.to_city, o.price
      FROM settlements s
      JOIN waybills w ON s.waybill_id = w.id
      JOIN orders o ON w.order_id = o.id
      ORDER BY s.created_at DESC
      LIMIT 50
    `).all() as any[]

    res.json(rows.map((row) => ({
      id: String(row.id),
      orderId: row.waybill_no,
      fromCity: row.from_city,
      toCity: row.to_city,
      amount: row.total_amount,
      fee: row.platform_fee,
      driverFee: row.driver_amount,
      platformFee: row.platform_fee,
      status: row.status,
      createdAt: row.created_at,
      settledAt: row.settle_date ?? undefined,
    })))
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/pending', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', pageSize = '20' } = req.query
    const p = parseInt(page as string)
    const ps = parseInt(pageSize as string)
    const total = (db.prepare("SELECT COUNT(*) as count FROM settlements WHERE status IN ('pending','processing')").get() as any).count
    const settlements = db.prepare(`
      SELECT s.*, w.waybill_no, o.from_city, o.to_city, o.cargo_type,
             u.name as driver_name
      FROM settlements s
      JOIN waybills w ON s.waybill_id = w.id
      JOIN orders o ON w.order_id = o.id
      LEFT JOIN driver_profiles dp ON w.driver_id = dp.id
      LEFT JOIN users u ON dp.user_id = u.id
      WHERE s.status IN ('pending','processing')
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `).all(ps, (p - 1) * ps)
    res.json({ success: true, settlements, total })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/process/:waybillId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const waybill = db.prepare(`
      SELECT w.*, o.price FROM waybills w
      JOIN orders o ON w.order_id = o.id
      WHERE w.id = ?
    `).get(req.params.waybillId) as any
    if (!waybill) {
      res.status(404).json({ success: false, error: '运单不存在' })
      return
    }
    const existing = db.prepare('SELECT * FROM settlements WHERE waybill_id = ?').get(req.params.waybillId) as any
    if (existing) {
      res.status(400).json({ success: false, error: '运单已生成结算' })
      return
    }
    const totalAmount = waybill.price
    const platformFee = Math.round(totalAmount * 0.08)
    const driverAmount = totalAmount - platformFee
    const txNo = `TX${Date.now()}`
    const settleDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]
    const result = db.prepare(`
      INSERT INTO settlements (waybill_id, total_amount, driver_amount, platform_fee, status, settle_date, transaction_no)
      VALUES (?, ?, ?, ?, 'processing', ?, ?)
    `).run(Number(req.params.waybillId), totalAmount, driverAmount, platformFee, settleDate, txNo)
    res.json({
      success: true,
      settlementId: Number(result.lastInsertRowid),
      amounts: { totalAmount, driverAmount, platformFee },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/history', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', pageSize = '20' } = req.query
    const p = parseInt(page as string)
    const ps = parseInt(pageSize as string)
    const total = (db.prepare("SELECT COUNT(*) as count FROM settlements").get() as any).count
    const settlements = db.prepare(`
      SELECT s.*, w.waybill_no, o.from_city, o.to_city, o.cargo_type,
             u.name as driver_name
      FROM settlements s
      JOIN waybills w ON s.waybill_id = w.id
      JOIN orders o ON w.order_id = o.id
      LEFT JOIN driver_profiles dp ON w.driver_id = dp.id
      LEFT JOIN users u ON dp.user_id = u.id
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `).all(ps, (p - 1) * ps)
    res.json({ success: true, settlements, total })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:settlementId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const settlement = db.prepare(`
      SELECT s.*, w.waybill_no, o.from_city, o.to_city, o.cargo_type, o.weight, o.price,
             u.name as driver_name, dp.plate_no
      FROM settlements s
      JOIN waybills w ON s.waybill_id = w.id
      JOIN orders o ON w.order_id = o.id
      LEFT JOIN driver_profiles dp ON w.driver_id = dp.id
      LEFT JOIN users u ON dp.user_id = u.id
      WHERE s.id = ?
    `).get(req.params.settlementId) as any
    if (!settlement) {
      res.status(404).json({ success: false, error: '结算记录不存在' })
      return
    }
    res.json({ success: true, settlement })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/withdraw', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, bankAccount } = req.body
    if (!amount || !bankAccount) {
      res.status(400).json({ success: false, error: '缺少提现金额或银行账户' })
      return
    }
    const withdrawalId = `WD${Date.now()}`
    res.json({ success: true, withdrawalId, status: 'processing' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router

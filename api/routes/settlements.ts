import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { v4 as uuidv4 } from 'uuid'
import { authMiddleware, roleMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/summary', authMiddleware, (req: Request, res: Response): void => {
  const userId = req.user!.userId
  const role = req.user!.role

  let availableBalance = 0
  let frozenAmount = 0
  let totalIncome = 0
  let totalWithdraw = 0

  if (role === 'driver') {
    const totalIncomeRow = db.prepare(`
      SELECT COALESCE(SUM(total_amount - platform_fee), 0) as total
      FROM settlements WHERE payee_id = ? AND status = 'completed'
    `).get(userId) as { total: number }
    totalIncome = totalIncomeRow.total

    const withdrawCompletedRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM withdrawals WHERE driver_id = ? AND status = 'completed'
    `).get(userId) as { total: number }
    totalWithdraw = withdrawCompletedRow.total

    const withdrawTotalRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM withdrawals WHERE driver_id = ? AND status IN ('completed', 'pending')
    `).get(userId) as { total: number }
    const withdrawTotal = withdrawTotalRow.total

    const pendingWithdrawRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM withdrawals WHERE driver_id = ? AND status = 'pending'
    `).get(userId) as { total: number }
    frozenAmount = pendingWithdrawRow.total

    availableBalance = Math.max(0, totalIncome - withdrawTotal)
  } else if (role === 'shipper') {
    const totalPaidRow = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM settlements WHERE payer_id = ? AND status = 'completed'
    `).get(userId) as { total: number }
    totalIncome = totalPaidRow.total

    const pendingSettlementRow = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM settlements WHERE payer_id = ? AND status = 'pending'
    `).get(userId) as { total: number }
    frozenAmount = pendingSettlementRow.total

    availableBalance = 0
    totalWithdraw = 0
  } else if (role === 'admin') {
    const totalFeeRow = db.prepare(`
      SELECT COALESCE(SUM(platform_fee), 0) as total
      FROM settlements WHERE status = 'completed'
    `).get() as { total: number }
    totalIncome = totalFeeRow.total

    const pendingFeeRow = db.prepare(`
      SELECT COALESCE(SUM(platform_fee), 0) as total
      FROM settlements WHERE status = 'pending'
    `).get() as { total: number }
    frozenAmount = pendingFeeRow.total

    availableBalance = totalIncome
    totalWithdraw = 0
  }

  res.json({
    success: true,
    data: {
      availableBalance: Math.round(availableBalance * 100) / 100,
      frozenAmount: Math.round(frozenAmount * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalWithdraw: Math.round(totalWithdraw * 100) / 100,
    }
  })
})

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 20
  const status = req.query.status as string
  const userId = req.user!.userId
  const role = req.user!.role

  const offset = (page - 1) * pageSize
  const conditions: string[] = []
  const params: any[] = []

  if (role === 'driver') {
    conditions.push('s.payee_id = ?')
    params.push(userId)
  } else if (role === 'shipper') {
    conditions.push('s.payer_id = ?')
    params.push(userId)
  }
  if (status) {
    conditions.push('s.status = ?')
    params.push(status)
  }

  const whereSql = conditions.length > 0
    ? 'WHERE ' + conditions.join(' AND ')
    : ''

  const total = db.prepare(`SELECT COUNT(*) as count FROM settlements s ${whereSql}`).get(...params) as { count: number }

  const list = db.prepare(`
    SELECT s.*, o.waybill_no, f.origin, f.destination,
      u_payer.name as payer_name, u_payee.name as payee_name
    FROM settlements s
    JOIN orders o ON s.order_id = o.id
    JOIN freights f ON o.freight_id = f.id
    LEFT JOIN users u_payer ON s.payer_id = u_payer.id
    LEFT JOIN users u_payee ON s.payee_id = u_payee.id
    ${whereSql}
    ORDER BY s.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset)

  res.json({ success: true, list, total: total.count })
})

router.get('/withdrawals', authMiddleware, roleMiddleware('driver'), (req: Request, res: Response): void => {
  const driverId = req.user!.userId
  const page = parseInt(req.query.page as string) || 1
  const pageSize = parseInt(req.query.pageSize as string) || 20
  const offset = (page - 1) * pageSize

  const total = db.prepare('SELECT COUNT(*) as count FROM withdrawals WHERE driver_id = ?').get(driverId) as { count: number }
  const list = db.prepare('SELECT * FROM withdrawals WHERE driver_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(driverId, pageSize, offset)

  res.json({ success: true, list, total: total.count })
})

router.post('/withdraw', authMiddleware, roleMiddleware('driver'), (req: Request, res: Response): void => {
  const driverId = req.user!.userId
  const { amount, bank_card_no } = req.body

  if (!amount || amount <= 0) {
    res.status(400).json({ success: false, error: '提现金额无效' })
    return
  }
  if (!bank_card_no) {
    res.status(400).json({ success: false, error: '请选择提现银行卡' })
    return
  }

  const totalIncomeRow = db.prepare(`
    SELECT COALESCE(SUM(total_amount - platform_fee), 0) as total
    FROM settlements WHERE payee_id = ? AND status = 'completed'
  `).get(driverId) as { total: number }
  const totalIncome = totalIncomeRow.total

  const withdrawTotalRow = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total
    FROM withdrawals WHERE driver_id = ? AND status IN ('completed', 'pending')
  `).get(driverId) as { total: number }
  const withdrawTotal = withdrawTotalRow.total

  const available = totalIncome - withdrawTotal
  if (amount > available) {
    res.status(400).json({ success: false, error: '余额不足' })
    return
  }

  const id = `w_${uuidv4().substring(0, 8)}`
  db.prepare(`
    INSERT INTO withdrawals (id, driver_id, amount, bank_card_no, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).run(id, driverId, amount, bank_card_no)

  const withdrawal = db.prepare('SELECT * FROM withdrawals WHERE id = ?').get(id)
  res.json({ success: true, data: withdrawal })
})

router.get('/:id', authMiddleware, (req: Request, res: Response): void => {
  const settlement = db.prepare(`
    SELECT s.*, o.waybill_no, f.origin, f.destination, f.goods_type, f.weight,
      u_payer.name as payer_name, u_payee.name as payee_name
    FROM settlements s
    JOIN orders o ON s.order_id = o.id
    JOIN freights f ON o.freight_id = f.id
    LEFT JOIN users u_payer ON s.payer_id = u_payer.id
    LEFT JOIN users u_payee ON s.payee_id = u_payee.id
    WHERE s.id = ?
  `).get(req.params.id)

  if (!settlement) {
    res.status(404).json({ success: false, error: '结算记录不存在' })
    return
  }

  res.json({ success: true, data: settlement })
})

router.post('/:id/settle', authMiddleware, roleMiddleware('shipper', 'admin'), (req: Request, res: Response): void => {
  const orderId = req.params.id

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
  if (!order) {
    res.status(404).json({ success: false, error: '运单不存在' })
    return
  }
  if (order.status !== 'delivered') {
    res.status(400).json({ success: false, error: '运单尚未送达，无法结算' })
    return
  }

  const existing = db.prepare('SELECT * FROM settlements WHERE order_id = ?').get(orderId)
  if (existing) {
    res.json({ success: true, data: existing, message: '结算已存在' })
    return
  }

  const totalAmount = order.total_fee
  const platformFee = Math.round(totalAmount * 0.05 * 100) / 100
  const fuelAmount = Math.round(totalAmount * 0.3 * 100) / 100
  const insuranceAmount = Math.round(totalAmount * 0.02 * 100) / 100
  const freightAmount = Math.round((totalAmount - platformFee - fuelAmount - insuranceAmount) * 100) / 100

  const settlementId = `s_${uuidv4().substring(0, 8)}`
  const now = new Date().toISOString()

  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO settlements (id, order_id, payer_id, payee_id, total_amount, freight_amount, fuel_amount, insurance_amount, platform_fee, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)
    `).run(settlementId, orderId, order.shipper_id, order.driver_id, totalAmount, freightAmount, fuelAmount, insuranceAmount, platformFee, now)

    db.prepare("UPDATE orders SET status = 'completed' WHERE id = ?").run(orderId)
  })
  tx()

  const settlement = db.prepare('SELECT * FROM settlements WHERE id = ?').get(settlementId)
  res.json({ success: true, data: settlement })
})

export default router

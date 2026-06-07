import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware } from '../middleware.js'

const router = Router()

function generatePolicyNumber(prefix: string): string {
  const now = new Date()
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0')
  const random = Math.floor(10000 + Math.random() * 90000)
  return `${prefix}-${dateStr}-${random}`
}

router.post('/auto-insure', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { order_id } = req.body

    if (!order_id) {
      res.status(400).json({ success: false, error: '缺少订单ID' })
      return
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id) as any
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    const existing = db.prepare(
      "SELECT * FROM insurance_policies WHERE order_id = ? AND status = 'active'"
    ).all(order_id) as any[]

    if (existing.length > 0) {
      res.status(409).json({ success: false, error: '该订单已有有效保单', data: existing })
      return
    }

    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(order.service_id) as any
    const liabilityPremium = service ? service.price * 0.05 : 10
    const accidentPremium = service ? service.price * 0.03 : 5

    const liabilityNumber = generatePolicyNumber('CLI')
    const accidentNumber = generatePolicyNumber('ACC')

    const r1 = db.prepare(
      'INSERT INTO insurance_policies (order_id, insurance_type, policy_number, premium) VALUES (?, ?, ?, ?)'
    ).run(order_id, 'liability', liabilityNumber, liabilityPremium)

    const r2 = db.prepare(
      'INSERT INTO insurance_policies (order_id, insurance_type, policy_number, premium) VALUES (?, ?, ?, ?)'
    ).run(order_id, 'accident', accidentNumber, accidentPremium)

    db.prepare(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user!.id, 'auto_insure', 'order', order_id, `policies: ${liabilityNumber}, ${accidentNumber}`, req.ip)

    const liabilityPolicy = db.prepare('SELECT * FROM insurance_policies WHERE id = ?').get(r1.lastInsertRowid)
    const accidentPolicy = db.prepare('SELECT * FROM insurance_policies WHERE id = ?').get(r2.lastInsertRowid)

    res.status(201).json({
      success: true,
      data: { liability: liabilityPolicy, accident: accidentPolicy }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/policies', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { order_id } = req.query
    let sql = 'SELECT * FROM insurance_policies WHERE 1=1'
    const params: any[] = []

    if (order_id) {
      sql += ' AND order_id = ?'
      params.push(order_id)
    }

    sql += ' ORDER BY created_at DESC'

    const policies = db.prepare(sql).all(...params) as any[]

    res.json({ success: true, data: policies })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/policies/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const policy = db.prepare('SELECT * FROM insurance_policies WHERE id = ?').get(req.params.id) as any
    if (!policy) {
      res.status(404).json({ success: false, error: '保单不存在' })
      return
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(policy.order_id) as any

    res.json({ success: true, data: { ...policy, order } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router

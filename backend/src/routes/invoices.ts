import { Router } from 'express'
import db from '../db/index.js'
import { z } from 'zod'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

const invoiceSchema = z.object({
  patient_id: z.number(),
  appointment_id: z.number().optional(),
  items: z.array(z.object({
    name: z.string(),
    treatment_id: z.number().optional(),
    supply_id: z.number().optional(),
    price: z.number(),
    quantity: z.number().default(1)
  })).min(1, '至少需要一个收费项目'),
  discount: z.number().default(0),
  note: z.string().optional()
})

router.post('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const data = invoiceSchema.parse(req.body)
    
    const totalAmount = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0) - data.discount

    const result = db.prepare(`
      INSERT INTO invoices (patient_id, appointment_id, total_amount, discount, status, created_by)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `).run(data.patient_id, data.appointment_id, totalAmount, data.discount, req.user?.id)

    const invoiceId = result.lastInsertRowid as number
    
    const insertItem = db.prepare(`
      INSERT INTO invoice_items (invoice_id, name, treatment_id, supply_id, price, quantity)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    data.items.forEach(item => {
      insertItem.run(invoiceId, item.name, item.treatment_id, item.supply_id, item.price, item.quantity)
    })

    res.json({ id: invoiceId, total_amount: totalAmount, status: 'pending' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    res.status(500).json({ error: '创建收费单失败' })
  }
})

router.get('/', authenticateToken, (req, res) => {
  try {
    const { patient_id, status, page = 1, pageSize = 20 } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)

    let query = `
      SELECT i.*, p.name as patient_name, 
             COALESCE((SELECT SUM(amount) FROM payments WHERE invoice_id = i.id), 0) as paid_total
      FROM invoices i
      LEFT JOIN patients p ON i.patient_id = p.id
      WHERE 1=1
    `
    const params: any[] = []

    if (patient_id) {
      query += ' AND i.patient_id = ?'
      params.push(patient_id)
    }
    if (status) {
      query += ' AND i.status = ?'
      params.push(status)
    }

    query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), offset)

    const invoices = db.prepare(query).all(...params)

    let countQuery = 'SELECT COUNT(*) as count FROM invoices WHERE 1=1'
    const countParams: any[] = []
    if (patient_id) { countQuery += ' AND patient_id = ?'; countParams.push(patient_id) }
    if (status) { countQuery += ' AND status = ?'; countParams.push(status) }

    const total = db.prepare(countQuery).get(...countParams) as { count: number }

    res.json({
      list: invoices,
      total: total.count,
      page: Number(page),
      pageSize: Number(pageSize)
    })
  } catch (error) {
    res.status(500).json({ error: '获取收费单失败' })
  }
})

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const invoice = db.prepare(`
      SELECT i.*, p.name as patient_name, p.phone as patient_phone
      FROM invoices i
      LEFT JOIN patients p ON i.patient_id = p.id
      WHERE i.id = ?
    `).get(req.params.id) as any

    if (!invoice) {
      return res.status(404).json({ error: '收费单不存在' })
    }

    const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(req.params.id)
    const payments = db.prepare(`
      SELECT py.*, u.name as created_by_name
      FROM payments py
      LEFT JOIN users u ON py.created_by = u.id
      WHERE py.invoice_id = ?
      ORDER BY py.created_at DESC
    `).all(req.params.id)
    const refunds = db.prepare(`
      SELECT r.*, u.name as created_by_name
      FROM refunds r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.invoice_id = ?
      ORDER BY r.created_at DESC
    `).all(req.params.id)

    res.json({ ...invoice, items, payments, refunds })
  } catch (error) {
    res.status(500).json({ error: '获取收费单详情失败' })
  }
})

router.post('/:id/pay', authenticateToken, (req: AuthRequest, res) => {
  try {
    const invoiceId = Number(req.params.id)
    const { amount, payment_method, transaction_no, notes } = req.body

    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId) as any
    if (!invoice) {
      return res.status(404).json({ error: '收费单不存在' })
    }

    const paidResult = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE invoice_id = ?').get(invoiceId) as { total: number }
    const refundResult = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM refunds WHERE invoice_id = ?').get(invoiceId) as { total: number }
    
    const currentPaid = paidResult.total - refundResult.total
    const newTotal = currentPaid + amount
    const remaining = invoice.total_amount - invoice.discount - currentPaid

    if (amount > remaining + 0.01) {
      return res.status(400).json({ error: '付款金额超过应付金额' })
    }

    db.prepare(`
      INSERT INTO payments (invoice_id, amount, payment_method, transaction_no, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(invoiceId, amount, payment_method, transaction_no, notes, req.user?.id)

    const newPaidTotal = newTotal
    const newStatus = newPaidTotal >= invoice.total_amount - invoice.discount - 0.01 ? 'paid' : 'partial'
    
    db.prepare(`
      UPDATE invoices SET status=?, paid_amount=?, paid_at=CASE WHEN ?='paid' THEN CURRENT_TIMESTAMP ELSE paid_at END WHERE id=?
    `).run(newStatus, newPaidTotal, newStatus, invoiceId)

    res.json({ success: true, new_status: newStatus })
  } catch (error) {
    res.status(500).json({ error: '付款失败' })
  }
})

router.post('/:id/refund', authenticateToken, (req: AuthRequest, res) => {
  try {
    const invoiceId = Number(req.params.id)
    const { amount, reason } = req.body

    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId) as any
    if (!invoice) {
      return res.status(404).json({ error: '收费单不存在' })
    }

    const paidResult = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE invoice_id = ?').get(invoiceId) as { total: number }
    const refundResult = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM refunds WHERE invoice_id = ?').get(invoiceId) as { total: number }
    
    const netPaid = paidResult.total - refundResult.total

    if (amount > netPaid + 0.01) {
      return res.status(400).json({ error: '退款金额超过已付金额' })
    }

    db.prepare(`
      INSERT INTO refunds (invoice_id, amount, reason, approved_by, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(invoiceId, amount, reason, req.user?.id, req.user?.id)

    const newNetPaid = netPaid - amount
    const newStatus = newNetPaid <= 0.01 ? 'refunded' : (newNetPaid < invoice.total_amount - invoice.discount ? 'partial' : 'paid')
    
    db.prepare(`
      UPDATE invoices SET status=?, paid_amount=? WHERE id=?
    `).run(newStatus, Math.max(0, newNetPaid), invoiceId)

    res.json({ success: true, new_status: newStatus })
  } catch (error) {
    res.status(500).json({ error: '退款失败' })
  }
})

export default router

import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../models/database.js'

const router = express.Router()

router.get('/', (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, customerId } = req.query
    const offset = (page - 1) * pageSize

    let whereClause = '1=1'
    const params = []
    if (status) {
      whereClause += ' AND status = ?'
      params.push(status)
    }
    if (customerId) {
      whereClause += ' AND customer_id = ?'
      params.push(customerId)
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM statements WHERE ${whereClause}`).get(...params).count
    const statements = db.prepare(`SELECT * FROM statements WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset)

    statements.forEach(s => {
      s.line_items = JSON.parse(s.line_items || '[]')
    })

    res.json({ data: statements, total })
  } catch (error) {
    res.status(500).json({ message: '获取对账单列表失败' })
  }
})

router.get('/:id', (req, res) => {
  try {
    const statement = db.prepare('SELECT * FROM statements WHERE id = ?').get(req.params.id)
    if (!statement) {
      return res.status(404).json({ message: '对账单不存在' })
    }

    statement.line_items = JSON.parse(statement.line_items || '[]')

    const freights = db.prepare(`
      SELECT f.*, w.waybill_no, o.order_no, o.pickup_city, o.delivery_city, o.goods_name
      FROM freights f
      LEFT JOIN waybills w ON f.waybill_id = w.id
      LEFT JOIN orders o ON w.order_id = o.id
      WHERE f.status IN ('CALCULATED', 'CONFIRMED')
    `).all()

    if (statement.line_items.length === 0) {
      statement.line_items = freights.map(f => ({
        waybill_no: f.waybill_no,
        order_no: f.order_no,
        route: `${f.pickup_city}-${f.delivery_city}`,
        distance: f.distance,
        weight: f.weight,
        freight: f.total_freight,
        status: f.status
      }))
    }

    res.json({ data: statement })
  } catch (error) {
    res.status(500).json({ message: '获取对账单详情失败' })
  }
})

router.post('/', (req, res) => {
  try {
    const id = uuidv4()
    const statementNo = `ST-${Date.now()}`

    const { statement_type, customer_id, customer_name, carrier_id, carrier_name, period_start, period_end, adjustment } = req.body

    const freights = db.prepare(`
      SELECT f.*, w.waybill_no, o.order_no, o.pickup_city, o.delivery_city
      FROM freights f
      LEFT JOIN waybills w ON f.waybill_id = w.id
      LEFT JOIN orders o ON w.order_id = o.id
      WHERE f.status IN ('CALCULATED', 'CONFIRMED')
    `).all()

    const line_items = freights.map(f => ({
      waybill_no: f.waybill_no,
      order_no: f.order_no,
      route: `${f.pickup_city}-${f.delivery_city}`,
      distance: f.distance,
      weight: f.weight,
      freight: f.total_freight
    }))

    const subtotal = freights.reduce((sum, f) => sum + (f.total_freight || 0), 0)
    const total_amount = subtotal + (adjustment || 0)

    db.prepare(`
      INSERT INTO statements (id, statement_no, statement_type, customer_id, customer_name, carrier_id, carrier_name,
        period_start, period_end, total_orders, total_distance, total_weight, subtotal, adjustment, total_amount, line_items, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT')
    `).run(
      id, statementNo, statement_type, customer_id, customer_name, carrier_id, carrier_name,
      period_start, period_end, freights.length,
      freights.reduce((sum, f) => sum + (f.distance || 0), 0),
      freights.reduce((sum, f) => sum + (f.weight || 0), 0),
      subtotal, adjustment || 0, total_amount, JSON.stringify(line_items)
    )

    const statement = db.prepare('SELECT * FROM statements WHERE id = ?').get(id)
    statement.line_items = JSON.parse(statement.line_items)
    res.json({ data: statement })
  } catch (error) {
    res.status(500).json({ message: '创建对账单失败' })
  }
})

router.put('/:id', (req, res) => {
  try {
    const { adjustment, status } = req.body

    const statement = db.prepare('SELECT * FROM statements WHERE id = ?').get(req.params.id)
    if (!statement) {
      return res.status(404).json({ message: '对账单不存在' })
    }

    const newAdjustment = adjustment !== undefined ? adjustment : statement.adjustment
    const newTotalAmount = statement.subtotal + newAdjustment

    db.prepare('UPDATE statements SET adjustment = ?, total_amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      newAdjustment, newTotalAmount, status || statement.status, req.params.id
    )

    const updated = db.prepare('SELECT * FROM statements WHERE id = ?').get(req.params.id)
    updated.line_items = JSON.parse(updated.line_items)
    res.json({ data: updated })
  } catch (error) {
    res.status(500).json({ message: '更新对账单失败' })
  }
})

router.post('/:id/send', (req, res) => {
  try {
    db.prepare("UPDATE statements SET status = 'SENT' WHERE id = ?").run(req.params.id)
    const statement = db.prepare('SELECT * FROM statements WHERE id = ?').get(req.params.id)
    statement.line_items = JSON.parse(statement.line_items)
    res.json({ data: statement })
  } catch (error) {
    res.status(500).json({ message: '发送对账单失败' })
  }
})

router.post('/:id/settle', (req, res) => {
  try {
    db.prepare("UPDATE statements SET status = 'SETTLED' WHERE id = ?").run(req.params.id)
    const statement = db.prepare('SELECT * FROM statements WHERE id = ?').get(req.params.id)
    statement.line_items = JSON.parse(statement.line_items)
    res.json({ data: statement })
  } catch (error) {
    res.status(500).json({ message: '结算对账单失败' })
  }
})

router.get('/:id/export', (req, res) => {
  try {
    const statement = db.prepare('SELECT * FROM statements WHERE id = ?').get(req.params.id)
    if (!statement) {
      return res.status(404).json({ message: '对账单不存在' })
    }

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=${statement.statement_no}.pdf`)

    res.json({ message: '导出功能需要实际PDF库支持', statement_no: statement.statement_no })
  } catch (error) {
    res.status(500).json({ message: '导出失败' })
  }
})

export default router

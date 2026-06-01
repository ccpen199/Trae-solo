const express = require('express')
const { db } = require('../database')
const router = express.Router()

function generateNo(prefix) {
  const date = new Date()
  const dateStr = date.getFullYear().toString() + 
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}${dateStr}${random}`
}

router.get('/records', (req, res) => {
  const { customer_id, status } = req.query
  let sql = `
    SELECT b.*, c.name as customer_name
    FROM billing_records b
    JOIN customers c ON b.customer_id = c.id
    WHERE 1=1
  `
  const params = []
  if (customer_id) {
    sql += ' AND b.customer_id = ?'
    params.push(customer_id)
  }
  if (status) {
    sql += ' AND b.status = ?'
    params.push(status)
  }
  sql += ' ORDER BY b.created_at DESC'
  const records = db.prepare(sql).all(...params)
  res.json(records)
})

router.get('/records/:id', (req, res) => {
  const record = db.prepare(`
    SELECT b.*, c.name as customer_name
    FROM billing_records b
    JOIN customers c ON b.customer_id = c.id
    WHERE b.id = ?
  `).get(req.params.id)
  
  if (!record) return res.status(404).json({ error: '账单不存在' })

  const details = db.prepare(`
    SELECT * FROM billing_details WHERE billing_record_id = ?
  `).all(req.params.id)

  res.json({ ...record, details })
})

router.post('/calculate', (req, res) => {
  const { customer_id, period_start, period_end } = req.body
  
  const inventoryData = db.prepare(`
    SELECT i.*, p.storage_fee, p.handling_fee, p.name as product_name,
           julianday(?) - julianday(i.inbound_time) as storage_days
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    WHERE i.customer_id = ?
  `).all(period_end, customer_id)

  const outboundData = db.prepare(`
    SELECT oi.*, o.outbound_time, p.handling_fee, p.storage_fee, p.name as product_name,
           julianday(o.outbound_time) - julianday(i.inbound_time) as storage_days
    FROM outbound_items oi
    JOIN outbound_orders o ON oi.outbound_order_id = o.id
    JOIN inventory i ON oi.inventory_id = i.id
    JOIN products p ON i.product_id = p.id
    WHERE i.customer_id = ?
      AND o.outbound_time BETWEEN ? AND ?
      AND o.status IN ('completed', 'partial')
  `).all(customer_id, period_start, period_end)

  const details = []
  let totalStorageFee = 0
  let totalHandlingFee = 0

  inventoryData.forEach(inv => {
    const days = Math.ceil(Math.max(1, inv.storage_days || 0))
    const storageFee = days * inv.quantity * (inv.storage_fee || 0)
    totalStorageFee += storageFee
    details.push({
      type: 'storage',
      description: `仓储费 - ${inv.product_name} (${inv.batch_no})`,
      quantity: inv.quantity,
      unit_price: inv.storage_fee,
      amount: storageFee,
      related_id: inv.id
    })
  })

  outboundData.forEach(ob => {
    const handlingFee = ob.quantity * (ob.handling_fee || 0)
    totalHandlingFee += handlingFee
    details.push({
      type: 'handling',
      description: `操作费 - ${ob.product_name} (${ob.batch_no})`,
      quantity: ob.quantity,
      unit_price: ob.handling_fee,
      amount: handlingFee,
      related_id: ob.id
    })
  })

  res.json({
    storage_fee: totalStorageFee,
    handling_fee: totalHandlingFee,
    total_amount: totalStorageFee + totalHandlingFee,
    details
  })
})

router.post('/create', (req, res) => {
  const { customer_id, period_start, period_end } = req.body
  
  const calcResult = db.prepare(`
    SELECT i.*, p.storage_fee, p.handling_fee, p.name as product_name,
           julianday(?) - julianday(i.inbound_time) as storage_days
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    WHERE i.customer_id = ?
  `).all(period_end, customer_id)

  const outboundResult = db.prepare(`
    SELECT oi.*, o.outbound_time, p.handling_fee, p.storage_fee, p.name as product_name,
           julianday(o.outbound_time) - julianday(i.inbound_time) as storage_days
    FROM outbound_items oi
    JOIN outbound_orders o ON oi.outbound_order_id = o.id
    JOIN inventory i ON oi.inventory_id = i.id
    JOIN products p ON i.product_id = p.id
    WHERE i.customer_id = ?
      AND o.outbound_time BETWEEN ? AND ?
      AND o.status IN ('completed', 'partial')
  `).all(customer_id, period_start, period_end)

  let totalStorageFee = 0
  let totalHandlingFee = 0
  const details = []

  calcResult.forEach(inv => {
    const days = Math.ceil(Math.max(1, inv.storage_days || 0))
    const storageFee = days * inv.quantity * (inv.storage_fee || 0)
    totalStorageFee += storageFee
    details.push({
      type: 'storage',
      description: `仓储费 - ${inv.product_name} (${inv.batch_no})`,
      quantity: inv.quantity,
      unit_price: inv.storage_fee,
      amount: storageFee,
      related_id: inv.id
    })
  })

  outboundResult.forEach(ob => {
    const handlingFee = ob.quantity * (ob.handling_fee || 0)
    totalHandlingFee += handlingFee
    details.push({
      type: 'handling',
      description: `操作费 - ${ob.product_name} (${ob.batch_no})`,
      quantity: ob.quantity,
      unit_price: ob.handling_fee,
      amount: handlingFee,
      related_id: ob.id
    })
  })

  const billNo = generateNo('BL')
  const totalAmount = totalStorageFee + totalHandlingFee

  const billResult = db.prepare(`
    INSERT INTO billing_records
    (bill_no, customer_id, period_start, period_end, storage_fee, handling_fee, other_fee, total_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'unpaid')
  `).run(billNo, customer_id, period_start, period_end, totalStorageFee, totalHandlingFee, totalAmount)

  const billId = billResult.lastInsertRowid
  const detailStmt = db.prepare(`
    INSERT INTO billing_details
    (billing_record_id, type, description, quantity, unit_price, amount, related_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  
  details.forEach(d => {
    detailStmt.run(billId, d.type, d.description, d.quantity, d.unit_price, d.amount, d.related_id)
  })

  res.json({
    id: billId,
    bill_no: billNo,
    storage_fee: totalStorageFee,
    handling_fee: totalHandlingFee,
    total_amount: totalAmount,
    details_count: details.length
  })
})

router.post('/records/:id/pay', (req, res) => {
  db.prepare(`
    UPDATE billing_records 
    SET status = 'paid', paid_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id)
  res.json({ success: true })
})

module.exports = router

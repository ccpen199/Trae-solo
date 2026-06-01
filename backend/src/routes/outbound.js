const express = require('express')
const Joi = require('joi')
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

const outboundSchema = Joi.object({
  customer_id: Joi.number().required(),
  product_id: Joi.number().required(),
  requested_quantity: Joi.number().required(),
  batch_strategy: Joi.string().valid('fifo', 'lifo', 'specific').default('fifo'),
  specific_batch: Joi.string().allow(''),
  remark: Joi.string().allow('')
})

router.get('/', (req, res) => {
  const orders = db.prepare(`
    SELECT o.*,
           c.name as customer_name,
           p.name as product_name,
           p.code as product_code
    FROM outbound_orders o
    JOIN customers c ON o.customer_id = c.id
    JOIN products p ON o.product_id = p.id
    ORDER BY o.created_at DESC
  `).all()
  res.json(orders)
})

router.get('/:id', (req, res) => {
  const order = db.prepare(`
    SELECT o.*,
           c.name as customer_name,
           p.name as product_name
    FROM outbound_orders o
    JOIN customers c ON o.customer_id = c.id
    JOIN products p ON o.product_id = p.id
    WHERE o.id = ?
  `).get(req.params.id)
  
  if (!order) return res.status(404).json({ error: '出库单不存在' })

  const items = db.prepare(`
    SELECT oi.*,
           i.batch_no,
           i.inbound_time,
           l.code as location_code
    FROM outbound_items oi
    JOIN inventory i ON oi.inventory_id = i.id
    JOIN locations l ON i.location_id = l.id
    WHERE oi.outbound_order_id = ?
  `).all(req.params.id)

  res.json({ ...order, items })
})

router.post('/', (req, res) => {
  const { error, value } = outboundSchema.validate(req.body)
  if (error) return res.status(400).json({ error: error.details[0].message })

  const orderNo = generateNo('OB')
  const result = db.prepare(`
    INSERT INTO outbound_orders
    (order_no, customer_id, product_id, requested_quantity, batch_strategy, status, remark)
    VALUES (?, ?, ?, ?, ?, 'pending', ?)
  `).run(orderNo, value.customer_id, value.product_id, value.requested_quantity, 
         value.batch_strategy, value.remark)

  res.json({ id: result.lastInsertRowid, order_no: orderNo, ...value })
})

router.post('/:id/execute', (req, res) => {
  const order = db.prepare('SELECT * FROM outbound_orders WHERE id = ?').get(req.params.id)
  if (!order) return res.status(404).json({ error: '出库单不存在' })
  if (order.status !== 'pending') return res.status(400).json({ error: '出库单已执行' })

  let inventoryQuery = `
    SELECT * FROM inventory 
    WHERE product_id = ? AND customer_id = ? AND available_quantity > 0
  `
  const params = [order.product_id, order.customer_id]

  if (order.batch_strategy === 'fifo') {
    inventoryQuery += ' ORDER BY inbound_time ASC'
  } else if (order.batch_strategy === 'lifo') {
    inventoryQuery += ' ORDER BY inbound_time DESC'
  } else if (order.batch_strategy === 'specific' && req.body.specific_batch) {
    inventoryQuery += ' AND batch_no = ? ORDER BY inbound_time ASC'
    params.push(req.body.specific_batch)
  }

  const inventory = db.prepare(inventoryQuery).all(...params)
  
  let remainingQty = order.requested_quantity
  const allocatedItems = []
  const updateStmt = db.prepare('UPDATE inventory SET available_quantity = ? WHERE id = ?')
  const insertItemStmt = db.prepare(`
    INSERT INTO outbound_items (outbound_order_id, inventory_id, quantity, batch_no)
    VALUES (?, ?, ?, ?)
  `)

  for (const inv of inventory) {
    if (remainingQty <= 0) break
    const qtyToTake = Math.min(inv.available_quantity, remainingQty)
    const newAvailable = inv.available_quantity - qtyToTake
    
    updateStmt.run(newAvailable, inv.id)
    insertItemStmt.run(req.params.id, inv.id, qtyToTake, inv.batch_no)
    allocatedItems.push({ inventory_id: inv.id, quantity: qtyToTake, batch_no: inv.batch_no })
    
    remainingQty -= qtyToTake
  }

  const actualQty = order.requested_quantity - remainingQty
  const hasDifference = remainingQty > 0

  db.prepare(`
    UPDATE outbound_orders 
    SET status = ?, actual_quantity = ?, outbound_time = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(hasDifference ? 'partial' : 'completed', actualQty, req.params.id)

  if (hasDifference) {
    const exceptionNo = generateNo('EX')
    db.prepare(`
      INSERT INTO exception_orders
      (exception_no, type, related_type, related_id, description, quantity, status)
      VALUES (?, 'shortage', 'outbound', ?, '库存不足，部分出库', ?, 'pending')
    `).run(exceptionNo, req.params.id, remainingQty)
  }

  res.json({ 
    success: true, 
    allocated: allocatedItems,
    actual_quantity: actualQty,
    difference: remainingQty,
    has_difference: hasDifference
  })
})

module.exports = router

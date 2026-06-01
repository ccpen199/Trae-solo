const express = require('express')
const db = require('../db')
const { generateNo, logOperation, successResponse, errorResponse } = require('../utils')

const router = express.Router()

router.get('/items', (req, res) => {
  const { category } = req.query
  let sql = 'SELECT * FROM material_items'
  let params = []
  if (category) {
    sql += ' WHERE category = ?'
    params.push(category)
  }
  sql += ' ORDER BY created_at DESC'
  const list = db.prepare(sql).all(...params)
  successResponse(res, list)
})

router.post('/items', (req, res) => {
  const { item_code, item_name, category, unit, total_stock, unit_price, specifications } = req.body
  if (!item_code || !item_name) {
    return errorResponse(res, '缺少必要参数')
  }

  const stmt = db.prepare(`
    INSERT INTO material_items (item_code, item_name, category, unit, total_stock, unit_price, specifications)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(item_code, item_name, category, unit, total_stock || 0, unit_price, specifications)
  logOperation('material', 'create_item', result.lastInsertRowid, 'system', req.ip, req.body)
  successResponse(res, { id: result.lastInsertRowid }, '物资创建成功')
})

router.put('/items/:id', (req, res) => {
  const { id } = req.params
  const { item_name, category, unit, total_stock, unit_price, specifications } = req.body

  const existing = db.prepare('SELECT * FROM material_items WHERE id = ?').get(id)
  if (!existing) {
    return errorResponse(res, '物资不存在', 404)
  }

  const stmt = db.prepare(`
    UPDATE material_items SET
      item_name = COALESCE(?, item_name),
      category = COALESCE(?, category),
      unit = COALESCE(?, unit),
      total_stock = COALESCE(?, total_stock),
      unit_price = COALESCE(?, unit_price),
      specifications = COALESCE(?, specifications)
    WHERE id = ?
  `)
  stmt.run(item_name, category, unit, total_stock, unit_price, specifications, id)
  logOperation('material', 'update_item', id, 'system', req.ip, req.body)
  successResponse(res, null, '更新成功')
})

router.get('/demands', (req, res) => {
  const { page = 1, pageSize = 10, status, urgency } = req.query
  const offset = (page - 1) * pageSize

  let whereSql = []
  let params = []
  if (status) {
    whereSql.push('d.status = ?')
    params.push(status)
  }
  if (urgency) {
    whereSql.push('d.urgency = ?')
    params.push(urgency)
  }
  const whereClause = whereSql.length > 0 ? `WHERE ${whereSql.join(' AND ')}` : ''

  const total = db.prepare(`SELECT COUNT(*) as count FROM material_demands d ${whereClause}`).get(...params).count
  const list = db.prepare(`
    SELECT d.*, i.item_name, i.category, i.unit, i.total_stock
    FROM material_demands d
    LEFT JOIN material_items i ON d.item_id = i.id
    ${whereClause}
    ORDER BY d.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset)

  successResponse(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

router.post('/demands', (req, res) => {
  const { item_id, quantity, demand_location, requester_unit, urgency, description } = req.body
  if (item_id === undefined || item_id === null || item_id === '' ||
      quantity === undefined || quantity === null || quantity <= 0) {
    return errorResponse(res, '请填写必填项：物资、需求数量')
  }

  const demand_no = generateNo('MD')
  const stmt = db.prepare(`
    INSERT INTO material_demands (demand_no, item_id, quantity, demand_location, requester_unit, urgency, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(demand_no, item_id, quantity, demand_location, requester_unit, urgency || 'normal', description)

  const newDemand = db.prepare(`
    SELECT d.*, i.item_name, i.category, i.unit, i.total_stock
    FROM material_demands d
    LEFT JOIN material_items i ON d.item_id = i.id
    WHERE d.id = ?
  `).get(result.lastInsertRowid)

  logOperation('material', 'create_demand', result.lastInsertRowid, requester_unit || 'system', req.ip, req.body)
  successResponse(res, newDemand, '需求提交成功，已生成待分配记录')
})

router.put('/demands/:id', (req, res) => {
  const { id } = req.params
  const { status, quantity, allocated_quantity } = req.body

  const existing = db.prepare('SELECT * FROM material_demands WHERE id = ?').get(id)
  if (!existing) {
    return errorResponse(res, '需求不存在', 404)
  }

  const stmt = db.prepare(`
    UPDATE material_demands SET
      status = COALESCE(?, status),
      quantity = COALESCE(?, quantity),
      allocated_quantity = COALESCE(?, allocated_quantity)
    WHERE id = ?
  `)
  stmt.run(status, quantity, allocated_quantity, id)
  logOperation('material', 'update_demand', id, 'system', req.ip, req.body)
  successResponse(res, null, '更新成功')
})

router.get('/allocations', (req, res) => {
  const { page = 1, pageSize = 10, status } = req.query
  const offset = (page - 1) * pageSize

  let whereSql = []
  let params = []
  if (status) {
    whereSql.push('a.status = ?')
    params.push(status)
  }
  const whereClause = whereSql.length > 0 ? `WHERE ${whereSql.join(' AND ')}` : ''

  const total = db.prepare(`SELECT COUNT(*) as count FROM material_allocations a ${whereClause}`).get(...params).count
  const list = db.prepare(`
    SELECT a.*, i.item_name, i.category, i.unit, d.demand_no, d.demand_location
    FROM material_allocations a
    LEFT JOIN material_items i ON a.item_id = i.id
    LEFT JOIN material_demands d ON a.demand_id = d.id
    ${whereClause}
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset)

  successResponse(res, { list, total, page: parseInt(page), pageSize: parseInt(pageSize) })
})

router.post('/allocations', (req, res) => {
  const { demand_id, item_id, quantity, from_location, to_location, transporter, estimated_arrival, operator } = req.body
  if (item_id === undefined || item_id === null || item_id === '' ||
      quantity === undefined || quantity === null || quantity <= 0) {
    return errorResponse(res, '请填写必填项：物资、调拨数量')
  }

  const item = db.prepare('SELECT * FROM material_items WHERE id = ?').get(item_id)
  if (!item) {
    return errorResponse(res, '物资不存在', 404)
  }

  if (item.total_stock < quantity) {
    return errorResponse(res, `库存不足，当前库存: ${item.total_stock}${item.unit}`)
  }

  const allocation_no = generateNo('AL')
  const dispatch_time = new Date().toISOString()
  const status = 'dispatched'

  const stmt = db.prepare(`
    INSERT INTO material_allocations (
      allocation_no, demand_id, item_id, quantity, from_location, to_location,
      transporter, dispatch_time, estimated_arrival, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    allocation_no, demand_id, item_id, quantity, from_location, to_location,
    transporter, dispatch_time, estimated_arrival, status
  )

  db.prepare('UPDATE material_items SET total_stock = total_stock - ? WHERE id = ?').run(quantity, item_id)

  if (demand_id) {
    const demand = db.prepare('SELECT * FROM material_demands WHERE id = ?').get(demand_id)
    const newAllocated = (demand.allocated_quantity || 0) + quantity
    let newStatus = 'partial'
    if (newAllocated >= demand.quantity) {
      newStatus = 'allocated'
    } else if (newAllocated > 0) {
      newStatus = 'partial'
    }
    db.prepare('UPDATE material_demands SET allocated_quantity = ?, status = ? WHERE id = ?').run(newAllocated, newStatus, demand_id)
  }

  const newAllocation = db.prepare(`
    SELECT a.*, i.item_name, i.category, i.unit, d.demand_no, d.demand_location
    FROM material_allocations a
    LEFT JOIN material_items i ON a.item_id = i.id
    LEFT JOIN material_demands d ON a.demand_id = d.id
    WHERE a.id = ?
  `).get(result.lastInsertRowid)

  logOperation('material', 'create_allocation', result.lastInsertRowid, operator || 'system', req.ip, {
    ...req.body,
    stock_before: item.total_stock,
    stock_after: item.total_stock - quantity
  })
  successResponse(res, newAllocation, '调拨成功，已扣减库存并生成派送记录')
})

router.put('/allocations/:id', (req, res) => {
  const { id } = req.params
  const { status, actual_arrival, receiver, signoff_time, operator } = req.body

  const existing = db.prepare('SELECT * FROM material_allocations WHERE id = ?').get(id)
  if (!existing) {
    return errorResponse(res, '调拨单不存在', 404)
  }

  if (existing.status === 'cancelled' || existing.status === 'signed') {
    return errorResponse(res, '该调拨单已完成或已取消，无法修改')
  }

  if (status === undefined || status === null || status === '') {
    return errorResponse(res, '请选择状态')
  }

  if (status === 'signed' && (!receiver || receiver === '')) {
    return errorResponse(res, '请填写签收人')
  }

  const stmt = db.prepare(`
    UPDATE material_allocations SET
      status = COALESCE(?, status),
      actual_arrival = COALESCE(?, actual_arrival),
      receiver = COALESCE(?, receiver),
      signoff_time = COALESCE(?, signoff_time)
    WHERE id = ?
  `)
  stmt.run(status, actual_arrival, receiver, signoff_time, id)

  if (status === 'cancelled') {
    db.prepare('UPDATE material_items SET total_stock = total_stock + ? WHERE id = ?').run(existing.quantity, existing.item_id)
  }

  if (status === 'signed' && existing.demand_id) {
    const demand = db.prepare('SELECT * FROM material_demands WHERE id = ?').get(existing.demand_id)
    if (demand) {
      const allocated = demand.allocated_quantity || 0
      if (allocated >= demand.quantity) {
        db.prepare('UPDATE material_demands SET status = ? WHERE id = ?').run('completed', existing.demand_id)
      }
    }
  }

  const updated = db.prepare(`
    SELECT a.*, i.item_name, i.category, i.unit, d.demand_no, d.demand_location
    FROM material_allocations a
    LEFT JOIN material_items i ON a.item_id = i.id
    LEFT JOIN material_demands d ON a.demand_id = d.id
    WHERE a.id = ?
  `).get(id)

  const logAction = status === 'signed' ? 'sign_allocation' : (status === 'cancelled' ? 'cancel_allocation' : 'update_allocation')
  logOperation('material', logAction, id, operator || receiver || 'system', req.ip, {
    old_status: existing.status,
    new_status: status,
    receiver,
    signoff_time,
    actual_arrival
  })

  successResponse(res, updated, status === 'signed' ? '签收成功，已更新需求状态' : '更新成功')
})

router.get('/gaps', (req, res) => {
  const list = db.prepare(`
    SELECT d.*, i.item_name, i.category, i.unit, i.total_stock,
      (d.quantity - COALESCE(d.allocated_quantity, 0)) as gap_quantity
    FROM material_demands d
    LEFT JOIN material_items i ON d.item_id = i.id
    WHERE d.status IN ('pending', 'partial')
      AND (d.quantity - COALESCE(d.allocated_quantity, 0)) > 0
    ORDER BY d.urgency = 'urgent' DESC, d.created_at DESC
  `).all()
  successResponse(res, list)
})

module.exports = router

import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { randomUUID } from 'crypto'

const router = Router()

function generateWaybillNo() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `YT${date}${random}`
}

router.get('/', (req: Request, res: Response): void => {
  const { user_id, status, waybill_no, page = '1', pageSize = '10' } = req.query
  const pageNum = parseInt(page as string)
  const pageSizeNum = parseInt(pageSize as string)
  const offset = (pageNum - 1) * pageSizeNum

  let whereClauses: string[] = []
  let params: any[] = []

  if (user_id) {
    whereClauses.push('user_id = ?')
    params.push(user_id)
  }
  if (status) {
    whereClauses.push('status = ?')
    params.push(status)
  }
  if (waybill_no) {
    whereClauses.push('waybill_no LIKE ?')
    params.push(`%${waybill_no}%`)
  }

  const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''

  const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM orders ${whereSql}`)
  const total = totalStmt.get(...params) as { count: number }

  const stmt = db.prepare(`SELECT * FROM orders ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
  const orders = stmt.all(...params, pageSizeNum, offset)

  res.json({
    success: true,
    data: {
      list: orders,
      total: total.count,
      page: pageNum,
      pageSize: pageSizeNum,
    },
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params

  const orderStmt = db.prepare('SELECT * FROM orders WHERE id = ?')
  const order = orderStmt.get(id) as any

  if (!order) {
    res.status(404).json({ success: false, error: '订单不存在' })
    return
  }

  const trackingStmt = db.prepare('SELECT * FROM tracking WHERE order_id = ?')
  const tracking = trackingStmt.get(id) as any

  res.json({
    success: true,
    data: {
      ...order,
      tracking: tracking ? {
        ...tracking,
        nodes: JSON.parse(tracking.nodes),
        current_position: tracking.current_position ? JSON.parse(tracking.current_position) : null,
      } : null,
    },
  })
})

router.post('/', (req: Request, res: Response): void => {
  const {
    user_id, service_type = 'standard', weight = 0, volume = 0, fee = 0,
    sender_name, sender_phone, sender_address,
    receiver_name, receiver_phone, receiver_address,
    package_category, remark = '',
  } = req.body

  if (!user_id || !sender_name || !sender_phone || !sender_address || !receiver_name || !receiver_phone || !receiver_address) {
    res.status(400).json({ success: false, error: '必填参数不能为空' })
    return
  }

  const id = randomUUID()
  const waybill_no = generateWaybillNo()

  const stmt = db.prepare(`
    INSERT INTO orders (id, user_id, waybill_no, status, service_type, weight, volume, fee,
      sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address,
      package_category, remark)
    VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  stmt.run(id, user_id, waybill_no, service_type, weight, volume, fee,
    sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address,
    package_category, remark)

  const trackingId = randomUUID()
  const trackingStmt = db.prepare(`
    INSERT INTO tracking (id, order_id, waybill_no, status, nodes, estimated_delivery)
    VALUES (?, ?, ?, 'pending', '[]', date('now', '+3 days'))
  `)
  trackingStmt.run(trackingId, id, waybill_no)

  const newOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
  res.status(201).json({
    success: true,
    data: newOrder,
  })
})

router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const {
    status, service_type, weight, volume, fee,
    sender_name, sender_phone, sender_address,
    receiver_name, receiver_phone, receiver_address,
    package_category, remark,
  } = req.body

  const orderStmt = db.prepare('SELECT * FROM orders WHERE id = ?')
  const existing = orderStmt.get(id) as any

  if (!existing) {
    res.status(404).json({ success: false, error: '订单不存在' })
    return
  }

  const updateFields: string[] = []
  const updateParams: any[] = []

  if (status !== undefined) {
    updateFields.push('status = ?')
    updateParams.push(status)
  }
  if (service_type !== undefined) {
    updateFields.push('service_type = ?')
    updateParams.push(service_type)
  }
  if (weight !== undefined) {
    updateFields.push('weight = ?')
    updateParams.push(weight)
  }
  if (volume !== undefined) {
    updateFields.push('volume = ?')
    updateParams.push(volume)
  }
  if (fee !== undefined) {
    updateFields.push('fee = ?')
    updateParams.push(fee)
  }
  if (sender_name !== undefined) {
    updateFields.push('sender_name = ?')
    updateParams.push(sender_name)
  }
  if (sender_phone !== undefined) {
    updateFields.push('sender_phone = ?')
    updateParams.push(sender_phone)
  }
  if (sender_address !== undefined) {
    updateFields.push('sender_address = ?')
    updateParams.push(sender_address)
  }
  if (receiver_name !== undefined) {
    updateFields.push('receiver_name = ?')
    updateParams.push(receiver_name)
  }
  if (receiver_phone !== undefined) {
    updateFields.push('receiver_phone = ?')
    updateParams.push(receiver_phone)
  }
  if (receiver_address !== undefined) {
    updateFields.push('receiver_address = ?')
    updateParams.push(receiver_address)
  }
  if (package_category !== undefined) {
    updateFields.push('package_category = ?')
    updateParams.push(package_category)
  }
  if (remark !== undefined) {
    updateFields.push('remark = ?')
    updateParams.push(remark)
  }

  if (updateFields.length > 0) {
    updateFields.push('updated_at = datetime(\'now\')')
    updateParams.push(id)

    const stmt = db.prepare(`UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`)
    stmt.run(...updateParams)

    if (status) {
      const trackingUpdate = db.prepare('UPDATE tracking SET status = ?, updated_at = datetime(\'now\') WHERE order_id = ?')
      trackingUpdate.run(status, id)
    }
  }

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
  res.json({
    success: true,
    data: updated,
  })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params

  const orderStmt = db.prepare('SELECT * FROM orders WHERE id = ?')
  const existing = orderStmt.get(id)

  if (!existing) {
    res.status(404).json({ success: false, error: '订单不存在' })
    return
  }

  const trackingDelete = db.prepare('DELETE FROM tracking WHERE order_id = ?')
  trackingDelete.run(id)

  const stmt = db.prepare('DELETE FROM orders WHERE id = ?')
  stmt.run(id)

  res.json({
    success: true,
    message: '订单已删除',
  })
})

router.get('/statistics/summary', (req: Request, res: Response): void => {
  const { user_id } = req.query

  let whereSql = ''
  let params: any[] = []

  if (user_id) {
    whereSql = 'WHERE user_id = ?'
    params.push(user_id)
  }

  const statusCounts = db.prepare(`
    SELECT status, COUNT(*) as count FROM orders ${whereSql} GROUP BY status
  `).all(...params)

  const total = db.prepare(`SELECT COUNT(*) as count FROM orders ${whereSql}`).get(...params) as { count: number }

  const totalFee = db.prepare(`SELECT COALESCE(SUM(fee), 0) as total FROM orders ${whereSql}`).get(...params) as { total: number }

  const result: Record<string, number> = {}
  for (const item of statusCounts as any[]) {
    result[item.status] = item.count
  }

  res.json({
    success: true,
    data: {
      total: total.count,
      total_fee: totalFee.total,
      status_counts: result,
    },
  })
})

export default router

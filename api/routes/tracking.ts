import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { randomUUID } from 'crypto'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { waybill_no, status, page = '1', pageSize = '10' } = req.query
  const pageNum = parseInt(page as string)
  const pageSizeNum = parseInt(pageSize as string)
  const offset = (pageNum - 1) * pageSizeNum

  let whereClauses: string[] = []
  let params: any[] = []

  if (waybill_no) {
    whereClauses.push('waybill_no LIKE ?')
    params.push(`%${waybill_no}%`)
  }
  if (status) {
    whereClauses.push('status = ?')
    params.push(status)
  }

  const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''

  const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM tracking ${whereSql}`)
  const total = totalStmt.get(...params) as { count: number }

  const stmt = db.prepare(`SELECT * FROM tracking ${whereSql} ORDER BY updated_at DESC LIMIT ? OFFSET ?`)
  const trackings = stmt.all(...params, pageSizeNum, offset)

  const parsed = trackings.map((t: any) => ({
    ...t,
    nodes: JSON.parse(t.nodes),
    current_position: t.current_position ? JSON.parse(t.current_position) : null,
  }))

  res.json({
    success: true,
    data: {
      list: parsed,
      total: total.count,
      page: pageNum,
      pageSize: pageSizeNum,
    },
  })
})

router.get('/:waybillNo', (req: Request, res: Response): void => {
  const { waybillNo } = req.params

  const trackingStmt = db.prepare('SELECT * FROM tracking WHERE waybill_no = ?')
  const tracking = trackingStmt.get(waybillNo) as any

  if (!tracking) {
    res.status(404).json({ success: false, error: '运单不存在' })
    return
  }

  const orderStmt = db.prepare('SELECT * FROM orders WHERE waybill_no = ?')
  const order = orderStmt.get(waybillNo) as any

  res.json({
    success: true,
    data: {
      ...tracking,
      nodes: JSON.parse(tracking.nodes),
      current_position: tracking.current_position ? JSON.parse(tracking.current_position) : null,
      order: order || null,
    },
  })
})

router.post('/', (req: Request, res: Response): void => {
  const { order_id, waybill_no, status = 'pending', nodes = [], current_position, estimated_delivery } = req.body

  if (!order_id || !waybill_no) {
    res.status(400).json({ success: false, error: '订单ID和运单号不能为空' })
    return
  }

  const id = randomUUID()
  const stmt = db.prepare(`
    INSERT INTO tracking (id, order_id, waybill_no, status, nodes, current_position, estimated_delivery)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  stmt.run(id, order_id, waybill_no, status, JSON.stringify(nodes), current_position ? JSON.stringify(current_position) : null, estimated_delivery)

  const newTracking = db.prepare('SELECT * FROM tracking WHERE id = ?').get(id) as any
  res.status(201).json({
    success: true,
    data: {
      ...newTracking,
      nodes: JSON.parse(newTracking.nodes),
      current_position: newTracking.current_position ? JSON.parse(newTracking.current_position) : null,
    },
  })
})

router.put('/:waybillNo', (req: Request, res: Response): void => {
  const { waybillNo } = req.params
  const { status, nodes, current_position, estimated_delivery, exception_type, exception_message } = req.body

  const trackingStmt = db.prepare('SELECT * FROM tracking WHERE waybill_no = ?')
  const existing = trackingStmt.get(waybillNo) as any

  if (!existing) {
    res.status(404).json({ success: false, error: '运单不存在' })
    return
  }

  const updateFields: string[] = []
  const updateParams: any[] = []

  if (status !== undefined) {
    updateFields.push('status = ?')
    updateParams.push(status)
  }
  if (nodes !== undefined) {
    updateFields.push('nodes = ?')
    updateParams.push(JSON.stringify(nodes))
  }
  if (current_position !== undefined) {
    updateFields.push('current_position = ?')
    updateParams.push(JSON.stringify(current_position))
  }
  if (estimated_delivery !== undefined) {
    updateFields.push('estimated_delivery = ?')
    updateParams.push(estimated_delivery)
  }
  if (exception_type !== undefined) {
    updateFields.push('exception_type = ?')
    updateParams.push(exception_type)
  }
  if (exception_message !== undefined) {
    updateFields.push('exception_message = ?')
    updateParams.push(exception_message)
  }

  updateFields.push('updated_at = datetime(\'now\')')
  updateParams.push(waybillNo)

  const stmt = db.prepare(`UPDATE tracking SET ${updateFields.join(', ')} WHERE waybill_no = ?`)
  stmt.run(...updateParams)

  const updated = db.prepare('SELECT * FROM tracking WHERE waybill_no = ?').get(waybillNo) as any
  res.json({
    success: true,
    data: {
      ...updated,
      nodes: JSON.parse(updated.nodes),
      current_position: updated.current_position ? JSON.parse(updated.current_position) : null,
    },
  })
})

router.post('/:waybillNo/nodes', (req: Request, res: Response): void => {
  const { waybillNo } = req.params
  const { location, status: nodeStatus, description } = req.body

  if (!location || !nodeStatus) {
    res.status(400).json({ success: false, error: '位置和状态不能为空' })
    return
  }

  const trackingStmt = db.prepare('SELECT * FROM tracking WHERE waybill_no = ?')
  const tracking = trackingStmt.get(waybillNo) as any

  if (!tracking) {
    res.status(404).json({ success: false, error: '运单不存在' })
    return
  }

  const nodes = JSON.parse(tracking.nodes)
  nodes.push({
    time: new Date().toISOString().replace('T', ' ').slice(0, 16),
    location,
    status: nodeStatus,
    description,
  })

  const stmt = db.prepare('UPDATE tracking SET nodes = ?, status = ?, updated_at = datetime(\'now\') WHERE waybill_no = ?')
  stmt.run(JSON.stringify(nodes), nodeStatus, waybillNo)

  const updated = db.prepare('SELECT * FROM tracking WHERE waybill_no = ?').get(waybillNo) as any
  res.json({
    success: true,
    data: {
      ...updated,
      nodes: JSON.parse(updated.nodes),
      current_position: updated.current_position ? JSON.parse(updated.current_position) : null,
    },
  })
})

export default router

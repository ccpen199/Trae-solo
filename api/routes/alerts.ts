import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { randomUUID } from 'crypto'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { type, level, status, assignee, waybill_no, page = '1', pageSize = '10' } = req.query
  const pageNum = parseInt(page as string)
  const pageSizeNum = parseInt(pageSize as string)
  const offset = (pageNum - 1) * pageSizeNum

  let whereClauses: string[] = []
  let params: any[] = []

  if (type) {
    whereClauses.push('type = ?')
    params.push(type)
  }
  if (level) {
    whereClauses.push('level = ?')
    params.push(level)
  }
  if (status) {
    whereClauses.push('status = ?')
    params.push(status)
  }
  if (assignee) {
    whereClauses.push('assignee = ?')
    params.push(assignee)
  }
  if (waybill_no) {
    whereClauses.push('waybill_no LIKE ?')
    params.push(`%${waybill_no}%`)
  }

  const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''

  const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM alerts ${whereSql}`)
  const total = totalStmt.get(...params) as { count: number }

  const stmt = db.prepare(`SELECT * FROM alerts ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
  const alerts = stmt.all(...params, pageSizeNum, offset)

  const parsed = alerts.map((a: any) => ({
    ...a,
    remarks: JSON.parse(a.remarks),
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

router.get('/statistics', (req: Request, res: Response): void => {
  const { start_date, end_date } = req.query

  let whereClauses: string[] = []
  let params: any[] = []

  if (start_date) {
    whereClauses.push('created_at >= ?')
    params.push(start_date)
  }
  if (end_date) {
    whereClauses.push('created_at <= ?')
    params.push(end_date)
  }

  const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''

  const statusCounts = db.prepare(`
    SELECT status, COUNT(*) as count FROM alerts ${whereSql} GROUP BY status
  `).all(...params)

  const levelCounts = db.prepare(`
    SELECT level, COUNT(*) as count FROM alerts ${whereSql} GROUP BY level
  `).all(...params)

  const typeCounts = db.prepare(`
    SELECT type, COUNT(*) as count FROM alerts ${whereSql} GROUP BY type
  `).all(...params)

  const total = db.prepare(`SELECT COUNT(*) as count FROM alerts ${whereSql}`).get(...params) as { count: number }

  const statusResult: Record<string, number> = {}
  for (const item of statusCounts as any[]) {
    statusResult[item.status] = item.count
  }

  const levelResult: Record<string, number> = {}
  for (const item of levelCounts as any[]) {
    levelResult[item.level] = item.count
  }

  const typeResult: Record<string, number> = {}
  for (const item of typeCounts as any[]) {
    typeResult[item.type] = item.count
  }

  res.json({
    success: true,
    data: {
      total: total.count,
      by_status: statusResult,
      by_level: levelResult,
      by_type: typeResult,
    },
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params

  const stmt = db.prepare('SELECT * FROM alerts WHERE id = ?')
  const alert = stmt.get(id) as any

  if (!alert) {
    res.status(404).json({ success: false, error: '告警不存在' })
    return
  }

  const orderStmt = db.prepare('SELECT * FROM orders WHERE id = ?')
  const order = orderStmt.get(alert.order_id) as any

  const trackingStmt = db.prepare('SELECT * FROM tracking WHERE order_id = ?')
  const tracking = trackingStmt.get(alert.order_id) as any

  res.json({
    success: true,
    data: {
      ...alert,
      remarks: JSON.parse(alert.remarks),
      order: order || null,
      tracking: tracking ? {
        ...tracking,
        nodes: JSON.parse(tracking.nodes),
        current_position: tracking.current_position ? JSON.parse(tracking.current_position) : null,
      } : null,
    },
  })
})

router.post('/', (req: Request, res: Response): void => {
  const { order_id, waybill_no, type, level = 'medium', stagnant_hours = 0, status = 'pending', assignee = null } = req.body

  if (!waybill_no || !type) {
    res.status(400).json({ success: false, error: '运单号和类型不能为空' })
    return
  }

  const id = randomUUID()
  const stmt = db.prepare(`
    INSERT INTO alerts (id, order_id, waybill_no, type, level, stagnant_hours, status, assignee, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, '[]')
  `)
  stmt.run(id, order_id || null, waybill_no, type, level, stagnant_hours, status, assignee)

  const newAlert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id) as any
  res.status(201).json({
    success: true,
    data: {
      ...newAlert,
      remarks: JSON.parse(newAlert.remarks),
    },
  })
})

router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const { status, assignee, level, type, stagnant_hours } = req.body

  const alertStmt = db.prepare('SELECT * FROM alerts WHERE id = ?')
  const existing = alertStmt.get(id) as any

  if (!existing) {
    res.status(404).json({ success: false, error: '告警不存在' })
    return
  }

  const updateFields: string[] = []
  const updateParams: any[] = []

  if (status !== undefined) {
    updateFields.push('status = ?')
    updateParams.push(status)
  }
  if (assignee !== undefined) {
    updateFields.push('assignee = ?')
    updateParams.push(assignee)
  }
  if (level !== undefined) {
    updateFields.push('level = ?')
    updateParams.push(level)
  }
  if (type !== undefined) {
    updateFields.push('type = ?')
    updateParams.push(type)
  }
  if (stagnant_hours !== undefined) {
    updateFields.push('stagnant_hours = ?')
    updateParams.push(stagnant_hours)
  }

  if (updateFields.length > 0) {
    updateFields.push('updated_at = datetime(\'now\')')
    updateParams.push(id)

    const stmt = db.prepare(`UPDATE alerts SET ${updateFields.join(', ')} WHERE id = ?`)
    stmt.run(...updateParams)
  }

  const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id) as any
  res.json({
    success: true,
    data: {
      ...updated,
      remarks: JSON.parse(updated.remarks),
    },
  })
})

router.post('/:id/remarks', (req: Request, res: Response): void => {
  const { id } = req.params
  const { author, content } = req.body

  if (!author || !content) {
    res.status(400).json({ success: false, error: '操作人和内容不能为空' })
    return
  }

  const alertStmt = db.prepare('SELECT * FROM alerts WHERE id = ?')
  const alert = alertStmt.get(id) as any

  if (!alert) {
    res.status(404).json({ success: false, error: '告警不存在' })
    return
  }

  const remarks = JSON.parse(alert.remarks)
  remarks.push({
    author,
    content,
    time: new Date().toISOString().replace('T', ' ').slice(0, 16),
  })

  const stmt = db.prepare('UPDATE alerts SET remarks = ?, updated_at = datetime(\'now\') WHERE id = ?')
  stmt.run(JSON.stringify(remarks), id)

  const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id) as any
  res.json({
    success: true,
    data: {
      ...updated,
      remarks: JSON.parse(updated.remarks),
    },
  })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params

  const alertStmt = db.prepare('SELECT * FROM alerts WHERE id = ?')
  const existing = alertStmt.get(id)

  if (!existing) {
    res.status(404).json({ success: false, error: '告警不存在' })
    return
  }

  const stmt = db.prepare('DELETE FROM alerts WHERE id = ?')
  stmt.run(id)

  res.json({
    success: true,
    message: '告警已删除',
  })
})

export default router

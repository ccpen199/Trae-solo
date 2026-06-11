import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { status, type, priority } = req.query

  let sql = `SELECT c.*, u.name as consumer_name,
    o.status as order_status, d.brand, d.model
    FROM complaints c
    JOIN users u ON c.consumer_id = u.id
    LEFT JOIN orders o ON c.order_id = o.id
    LEFT JOIN devices d ON o.device_id = d.id
    WHERE 1=1`
  const params: any[] = []

  if (status) {
    sql += ` AND c.status = ?`
    params.push(status)
  }
  if (type) {
    sql += ` AND c.type = ?`
    params.push(type)
  }
  if (priority) {
    sql += ` AND c.priority = ?`
    params.push(priority)
  }

  sql += ` ORDER BY CASE c.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, c.created_at DESC`

  const complaints = (db.prepare(sql).all(...params) as any[]).map((c) => {
    const timeline = (db.prepare('SELECT * FROM complaint_timeline WHERE complaint_id = ? ORDER BY created_at ASC').all(c.id) as any[])
      .map((t) => ({
        action: t.action,
        time: t.created_at,
        operator: t.operator_id,
        note: t.note,
      }))

    return {
      id: c.id,
      orderId: c.order_id,
      consumerId: c.consumer_id,
      consumerName: c.consumer_name,
      device: c.brand ? `${c.brand} ${c.model}` : null,
      type: c.type,
      priority: c.priority,
      status: c.status,
      description: c.description,
      result: c.result,
      compensation: c.compensation,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      timeline,
    }
  })

  res.json({
    success: true,
    data: { complaints, total: complaints.length },
  })
})

router.put('/:id/process', (req: Request, res: Response): void => {
  const { action, result, compensation } = req.body
  const complaintId = req.params.id

  if (!action || !['accept', 'investigate', 'resolve', 'arbitrate', 'close'].includes(action)) {
    res.status(400).json({ success: false, error: '无效的操作类型' })
    return
  }

  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId) as any
  if (!complaint) {
    res.status(404).json({ success: false, error: '投诉不存在' })
    return
  }

  const statusMap: Record<string, string> = {
    accept: 'accepted',
    investigate: 'investigating',
    resolve: 'resolved',
    arbitrate: 'arbitrating',
    close: 'closed',
  }

  const newStatus = statusMap[action]
  const now = new Date().toISOString()

  const updateFields = ['status = ?', 'updated_at = ?']
  const updateParams: any[] = [newStatus, now]

  if (result) {
    updateFields.push('result = ?')
    updateParams.push(result)
  }
  if (compensation !== undefined) {
    updateFields.push('compensation = ?')
    updateParams.push(compensation)
  }

  updateParams.push(complaintId)
  db.prepare(`UPDATE complaints SET ${updateFields.join(', ')} WHERE id = ?`).run(...updateParams)

  const noteMap: Record<string, string> = {
    accept: '投诉已受理',
    investigate: '正在调查中',
    resolve: result || '投诉已解决',
    arbitrate: '进入仲裁流程',
    close: result || '投诉已关闭',
  }

  db.prepare('INSERT INTO complaint_timeline (id, complaint_id, action, operator_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    `CTL${Date.now()}`, complaintId, action, 'U999', noteMap[action], now,
  )

  if (action === 'close' && complaint.order_id) {
    const escrow = db.prepare('SELECT * FROM escrows WHERE order_id = ?').get(complaint.order_id) as any
    if (escrow && escrow.status === 'disputed') {
      if (compensation && compensation > 0) {
        db.prepare('UPDATE escrows SET status = ?, released_at = ? WHERE order_id = ?').run('refunded', now, complaint.order_id)
      } else {
        db.prepare('UPDATE escrows SET status = ?, released_at = ? WHERE order_id = ?').run('released', now, complaint.order_id)
      }
    }
  }

  res.json({
    success: true,
    data: {
      id: complaintId,
      status: newStatus,
      result: result || null,
      compensation: compensation || null,
    },
  })
})

export default router

import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { event_type = '', status = '', page = '1', pageSize = '10' } = req.query
    const pageNum = Math.max(1, Number(page))
    const pageSizeNum = Math.max(1, Number(pageSize))
    const offset = (pageNum - 1) * pageSizeNum

    let where = 'WHERE 1=1'
    const params: any[] = []

    if (event_type) {
      where += ' AND e.event_type = ?'
      params.push(event_type)
    }
    if (status) {
      where += ' AND e.status = ?'
      params.push(status)
    }

    const countRow = db.prepare(`
      SELECT COUNT(*) AS total FROM events e ${where}
    `).get(...params) as { total: number }

    const rows = db.prepare(`
      SELECT e.*, v.name AS vessel_name, v.code AS vessel_code
      FROM events e JOIN vessels v ON v.id = e.vessel_id
      ${where} ORDER BY e.occurred_at DESC LIMIT ? OFFSET ?
    `).all(...params, pageSizeNum, offset)

    res.json({ success: true, data: { list: rows, total: countRow.total, page: pageNum, pageSize: pageSizeNum } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const event = db.prepare(`
      SELECT e.*, v.name AS vessel_name, v.code AS vessel_code
      FROM events e JOIN vessels v ON v.id = e.vessel_id WHERE e.id = ?
    `).get(req.params.id)
    if (!event) {
      res.status(404).json({ success: false, error: '事件不存在' })
      return
    }
    const notifications = db.prepare('SELECT * FROM event_notifications WHERE event_id = ? ORDER BY sent_at DESC').all(req.params.id)
    const receipts = db.prepare('SELECT * FROM event_receipts WHERE event_id = ? ORDER BY received_at DESC').all(req.params.id)
    res.json({ success: true, data: { ...(event as any), notifications, receipts } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { vessel_id, event_type, title, description, status, created_by } = req.body
    if (!vessel_id || !event_type || !title) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }
    const result = db.prepare(`
      INSERT INTO events (vessel_id, event_type, title, description, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(vessel_id, event_type, title, description || '', status || '待处置', created_by || '')
    res.json({ success: true, data: { id: Number(result.lastInsertRowid) } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '事件不存在' })
      return
    }
    const { event_type, title, description, status, created_by } = req.body
    db.prepare(`
      UPDATE events SET event_type=?, title=?, description=?, status=?, created_by=?, updated_at=datetime('now','localtime')
      WHERE id=?
    `).run(
      event_type ?? existing.event_type,
      title ?? existing.title,
      description ?? existing.description,
      status ?? existing.status,
      created_by ?? existing.created_by,
      req.params.id
    )
    res.json({ success: true, message: '更新成功' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:id/notify', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id) as any
    if (!event) {
      res.status(404).json({ success: false, error: '事件不存在' })
      return
    }
    const { recipient, method, content } = req.body
    if (!recipient || !method) {
      res.status(400).json({ success: false, error: '缺少收件人或通知方式' })
      return
    }
    const result = db.prepare(`
      INSERT INTO event_notifications (event_id, recipient, method, content) VALUES (?, ?, ?, ?)
    `).run(Number(req.params.id), recipient, method, content || '')

    if (event.status === '待处置') {
      db.prepare(`
        UPDATE events SET status='处置中', updated_at=datetime('now','localtime') WHERE id=?
      `).run(Number(req.params.id))
    }

    res.json({ success: true, data: { id: Number(result.lastInsertRowid) } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:id/receipt', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id)
    if (!event) {
      res.status(404).json({ success: false, error: '事件不存在' })
      return
    }
    const { respondent, content } = req.body
    if (!respondent) {
      res.status(400).json({ success: false, error: '缺少回复人' })
      return
    }
    const result = db.prepare(`
      INSERT INTO event_receipts (event_id, respondent, content) VALUES (?, ?, ?)
    `).run(Number(req.params.id), respondent, content || '')
    res.json({ success: true, data: { id: Number(result.lastInsertRowid) } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:id/resolve', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id) as any
    if (!event) {
      res.status(404).json({ success: false, error: '事件不存在' })
      return
    }
    const { resolution } = req.body
    db.prepare(`
      UPDATE events SET status='已处置', resolution=?, resolved_at=datetime('now','localtime'), updated_at=datetime('now','localtime')
      WHERE id=?
    `).run(resolution || '', req.params.id)
    res.json({ success: true, data: { status: '已处置' } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router

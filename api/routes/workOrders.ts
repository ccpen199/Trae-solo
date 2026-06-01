import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

interface WorkOrderRow {
  id: number
  device_id: number | null
  site_id: number | null
  type: string
  status: string
  priority: string
  description: string | null
  assignee: string | null
  created_at: string
  assigned_at: string | null
  resolved_at: string | null
  resolution: string | null
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { status, type, site_id, device_id } = req.query
    let sql = 'SELECT wo.*, d.name as device_name, s.name as site_name, (SELECT COUNT(*) FROM work_order_photos wop WHERE wop.work_order_id = wo.id) as photo_count FROM work_orders wo LEFT JOIN devices d ON wo.device_id = d.id LEFT JOIN sites s ON wo.site_id = s.id'
    const params: unknown[] = []
    const conditions: string[] = []

    if (status) {
      conditions.push('wo.status = ?')
      params.push(status)
    }
    if (type) {
      conditions.push('wo.type = ?')
      params.push(type)
    }
    if (site_id) {
      conditions.push('wo.site_id = ?')
      params.push(site_id)
    }
    if (device_id) {
      conditions.push('wo.device_id = ?')
      params.push(device_id)
    }
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }
    sql += ' ORDER BY wo.created_at DESC'

    const workOrders = db.prepare(sql).all(...params)
    res.json({ success: true, data: workOrders })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const workOrder = db.prepare(`
      SELECT wo.*, d.name as device_name, s.name as site_name
      FROM work_orders wo
      LEFT JOIN devices d ON wo.device_id = d.id
      LEFT JOIN sites s ON wo.site_id = s.id
      WHERE wo.id = ?
    `).get(req.params.id) as WorkOrderRow & { device_name?: string; site_name?: string } | undefined

    if (!workOrder) {
      res.status(404).json({ success: false, error: 'Work order not found' })
      return
    }

    const photos = db.prepare('SELECT * FROM work_order_photos WHERE work_order_id = ?').all(req.params.id)
    const timeline = [
      workOrder.created_at ? { time: workOrder.created_at, event: '工单创建', actor: '系统' } : null,
      workOrder.assigned_at ? { time: workOrder.assigned_at, event: '工单指派', actor: workOrder.assignee } : null,
      workOrder.resolved_at ? { time: workOrder.resolved_at, event: '工单处理完成', actor: workOrder.assignee } : null,
    ].filter(Boolean)
    res.json({ success: true, data: { ...workOrder, photos, timeline } })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { device_id, site_id, type, priority, description, assignee } = req.body

    if (!type) {
      res.status(400).json({ success: false, error: 'type is required' })
      return
    }

    const result = db.prepare(`
      INSERT INTO work_orders (device_id, site_id, type, status, priority, description, assignee, assigned_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      device_id ?? null,
      site_id ?? null,
      type,
      assignee ? 'assigned' : 'pending',
      priority ?? 'medium',
      description ?? null,
      assignee ?? null,
      assignee ? new Date().toISOString() : null,
    )

    const workOrder = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: workOrder })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.patch('/:id/assign', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.id)

    if (!existing) {
      res.status(404).json({ success: false, error: 'Work order not found' })
      return
    }

    const { assignee } = req.body
    if (!assignee) {
      res.status(400).json({ success: false, error: 'assignee is required' })
      return
    }

    db.prepare(`
      UPDATE work_orders SET assignee = ?, status = 'assigned', assigned_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(assignee, req.params.id)

    const workOrder = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: workOrder })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.patch('/:id/resolve', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.id)

    if (!existing) {
      res.status(404).json({ success: false, error: 'Work order not found' })
      return
    }

    const { resolution } = req.body
    if (!resolution) {
      res.status(400).json({ success: false, error: 'resolution is required' })
      return
    }

    db.prepare(`
      UPDATE work_orders SET resolution = ?, status = 'resolved', resolved_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(resolution, req.params.id)

    const workOrder = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: workOrder })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

router.post('/:id/photos', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(req.params.id)

    if (!existing) {
      res.status(404).json({ success: false, error: 'Work order not found' })
      return
    }

    const { photo_url, description } = req.body
    if (!photo_url) {
      res.status(400).json({ success: false, error: 'photo_url is required' })
      return
    }

    const result = db.prepare(
      'INSERT INTO work_order_photos (work_order_id, photo_url, description) VALUES (?, ?, ?)',
    ).run(req.params.id, photo_url, description ?? null)

    const photo = db.prepare('SELECT * FROM work_order_photos WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: photo })
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) })
  }
})

export default router

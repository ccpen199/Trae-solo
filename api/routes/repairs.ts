import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, category, urgency, page = '1', pageSize = '20' } = req.query
    const p = Number(page)
    const ps = Number(pageSize)
    const conditions: string[] = []
    const params: any[] = []

    if (status) { conditions.push('ro.status = ?'); params.push(status) }
    if (category) { conditions.push('ro.category = ?'); params.push(category) }
    if (urgency) { conditions.push('ro.urgency = ?'); params.push(urgency) }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
    const total = (db.prepare(`SELECT COUNT(*) as c FROM repair_orders ro ${where}`).get(params) as any).c
    const rows = db.prepare(
      `SELECT ro.*, r.name as reporter_name, a.name as assignee_name
       FROM repair_orders ro
       LEFT JOIN users r ON ro.reporter_id = r.id
       LEFT JOIN users a ON ro.assignee_id = a.id
       ${where} ORDER BY ro.updated_at DESC LIMIT ? OFFSET ?`
    ).all(...params, ps, (p - 1) * ps)

    res.json({ success: true, data: { list: rows, total, page: p, pageSize: ps } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, category, urgency, images, location } = req.body
    if (!title) {
      res.status(400).json({ success: false, error: '标题不能为空' })
      return
    }

    const count = (db.prepare("SELECT COUNT(*) as c FROM repair_orders WHERE date(created_at) = date('now','localtime')").get() as any).c
    const orderNo = 'WX' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + String(count + 1).padStart(3, '0')

    const result = db.prepare(
      'INSERT INTO repair_orders (order_no, title, description, category, urgency, reporter_id, organization_id, images, location) VALUES (?,?,?,?,?,?,?,?,?)'
    ).run(orderNo, title, description || null, category || null, urgency || 'normal', req.user!.id, req.user!.organization_id, images ? JSON.stringify(images) : null, location || null)

    const order = db.prepare('SELECT * FROM repair_orders WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: order })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const order = db.prepare(
      `SELECT ro.*, r.name as reporter_name, a.name as assignee_name
       FROM repair_orders ro
       LEFT JOIN users r ON ro.reporter_id = r.id
       LEFT JOIN users a ON ro.assignee_id = a.id
       WHERE ro.id = ?`
    ).get(req.params.id) as any

    if (!order) {
      res.status(404).json({ success: false, error: '工单不存在' })
      return
    }

    const feedback = db.prepare('SELECT rf.*, u.name as user_name FROM repair_feedback rf LEFT JOIN users u ON rf.user_id = u.id WHERE rf.order_id = ? ORDER BY rf.created_at').all(order.id)
    const evaluation = db.prepare('SELECT re.*, u.name as user_name FROM repair_evaluations re LEFT JOIN users u ON re.user_id = u.id WHERE re.order_id = ?').get(order.id) as any

    res.json({ success: true, data: { ...order, feedback, evaluation } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id/dispatch', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignee_id } = req.body
    const order = db.prepare('SELECT id, status FROM repair_orders WHERE id = ?').get(req.params.id) as any
    if (!order) {
      res.status(404).json({ success: false, error: '工单不存在' })
      return
    }

    let assignId = assignee_id
    if (!assignId) {
      const worker = db.prepare("SELECT id FROM users WHERE role_id = 3 AND organization_id = ? LIMIT 1").get(req.user!.organization_id) as any
      assignId = worker ? worker.id : null
    }

    db.prepare(
      "UPDATE repair_orders SET assignee_id = ?, status = 'assigned', updated_at = datetime('now','localtime') WHERE id = ?"
    ).run(assignId, req.params.id)

    const updated = db.prepare('SELECT * FROM repair_orders WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id/feedback', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, images } = req.body
    if (!content) {
      res.status(400).json({ success: false, error: '反馈内容不能为空' })
      return
    }

    const order = db.prepare('SELECT id, status FROM repair_orders WHERE id = ?').get(req.params.id) as any
    if (!order) {
      res.status(404).json({ success: false, error: '工单不存在' })
      return
    }

    db.prepare(
      'INSERT INTO repair_feedback (order_id, user_id, content, images) VALUES (?,?,?,?)'
    ).run(order.id, req.user!.id, content, images ? JSON.stringify(images) : null)

    if (order.status === 'assigned' || order.status === 'processing') {
      db.prepare(
        "UPDATE repair_orders SET status = 'feedback', updated_at = datetime('now','localtime') WHERE id = ?"
      ).run(order.id)
    }

    const updated = db.prepare('SELECT * FROM repair_orders WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:id/evaluate', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { rating, comment } = req.body
    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, error: '评分必须在1-5之间' })
      return
    }

    const order = db.prepare('SELECT id FROM repair_orders WHERE id = ?').get(req.params.id) as any
    if (!order) {
      res.status(404).json({ success: false, error: '工单不存在' })
      return
    }

    const existing = db.prepare('SELECT id FROM repair_evaluations WHERE order_id = ?').get(order.id) as any
    if (existing) {
      res.status(400).json({ success: false, error: '已评价' })
      return
    }

    db.prepare(
      'INSERT INTO repair_evaluations (order_id, user_id, rating, comment) VALUES (?,?,?,?)'
    ).run(order.id, req.user!.id, rating, comment || null)

    db.prepare(
      "UPDATE repair_orders SET status = 'completed', updated_at = datetime('now','localtime') WHERE id = ?"
    ).run(order.id)

    const evaluation = db.prepare('SELECT * FROM repair_evaluations WHERE order_id = ?').get(order.id)
    res.json({ success: true, data: evaluation })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router

import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/orders', (req: Request, res: Response): void => {
  const { status } = req.query

  let whereClause = '1=1'
  const params: any[] = []

  if (status) {
    whereClause += ' AND o.status = ?'
    params.push(status)
  }

  const orders = db.prepare(`
    SELECT o.*, c.failure_reason, c.device_fingerprint
    FROM review_orders o
    LEFT JOIN certifications c ON o.certification_id = c.certification_id
    WHERE ${whereClause}
    ORDER BY CASE WHEN o.status = 'pending' THEN 0 ELSE 1 END, o.review_time DESC
  `).all(...params)

  res.json({ success: true, data: orders })
})

router.get('/orders/:id', (req: Request, res: Response): void => {
  const { id } = req.params

  const order = db.prepare(`
    SELECT o.*, c.failure_reason, c.device_fingerprint, c.social_security_no, c.verify_time
    FROM review_orders o
    LEFT JOIN certifications c ON o.certification_id = c.certification_id
    WHERE o.order_id = ?
  `).get(id) as any

  if (!order) {
    res.status(404).json({ success: false, error: '审核工单不存在' })
    return
  }

  const screenshots = db.prepare(`
    SELECT * FROM screenshots WHERE certification_id = ? ORDER BY frame_order
  `).all(order.certification_id)

  res.json({ success: true, data: { ...order, screenshots } })
})

router.put('/orders/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const { status, review_comment, reviewer } = req.body

  if (!status || !['approved', 'rejected', 'transferred'].includes(status)) {
    res.status(400).json({ success: false, error: '无效的审核状态' })
    return
  }

  const order = db.prepare('SELECT * FROM review_orders WHERE order_id = ?').get(id) as any
  if (!order) {
    res.status(404).json({ success: false, error: '审核工单不存在' })
    return
  }

  const now = new Date().toISOString().replace('T', ' ').substring(0, 19)

  db.prepare(`
    UPDATE review_orders SET status = ?, review_comment = ?, reviewer = ?, review_time = ?
    WHERE order_id = ?
  `).run(status, review_comment || null, reviewer || null, now, id)

  if (status === 'approved' && order.certification_id) {
    db.prepare(`
      UPDATE certifications SET status = 'success', cert_no = ?, verify_time = ?
      WHERE certification_id = ?
    `).run('CERT' + Date.now().toString().padStart(10, '0'), now, order.certification_id)
  }

  if (status === 'rejected' && order.certification_id) {
    db.prepare(`
      UPDATE certifications SET status = 'failed' WHERE certification_id = ?
    `).run(order.certification_id)
  }

  const updated = db.prepare('SELECT * FROM review_orders WHERE order_id = ?').get(id)
  res.json({ success: true, data: updated })
})

export default router

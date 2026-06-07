import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, roleMiddleware } from '../auth.js'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const upload = multer({
  dest: path.resolve(__dirname, '../../uploads'),
  limits: { fileSize: 10 * 1024 * 1024 },
})

const router = Router()

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, category } = req.query
    let sql = `SELECT t.*, tp.name as taxpayer_name FROM tickets t LEFT JOIN taxpayers tp ON t.taxpayer_id = tp.id WHERE 1=1`
    const params: any[] = []
    if (req.user!.role === 'taxpayer' || req.user!.role === 'agent') {
      sql += ' AND t.user_id = ?'
      params.push(req.user!.id)
    }
    if (status) {
      sql += ' AND t.status = ?'
      params.push(status)
    }
    if (category) {
      sql += ' AND t.category = ?'
      params.push(category)
    }
    sql += ' ORDER BY t.created_at DESC'
    const tickets = db.prepare(sql).all(...params)
    res.json({ success: true, data: tickets })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取工单列表失败' })
  }
})

router.post('/', authMiddleware, upload.array('attachments', 5), async (req: Request, res: Response): Promise<void> => {
  try {
    const { taxpayer_id, title, category, priority } = req.body
    if (!title) {
      res.status(400).json({ success: false, error: '缺少工单标题' })
      return
    }
    const files = req.files as Express.Multer.File[] | undefined
    const attachments = files ? JSON.stringify(files.map(f => ({ filename: f.originalname || f.filename, path: f.filename }))) : '[]'
    const result = db.prepare(
      'INSERT INTO tickets (user_id, taxpayer_id, title, category, priority) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user!.id, taxpayer_id || null, title, category || 'general', priority || 1)
    if (attachments !== '[]') {
      db.prepare('INSERT INTO ticket_replies (ticket_id, user_id, content, attachments) VALUES (?, ?, ?, ?)')
        .run(Number(result.lastInsertRowid), req.user!.id, '工单已创建，附件见下方', attachments)
    }
    res.json({ success: true, data: { id: result.lastInsertRowid } })
  } catch (err) {
    res.status(500).json({ success: false, error: '创建工单失败' })
  }
})

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const ticket = db.prepare(
      'SELECT t.*, tp.name as taxpayer_name FROM tickets t LEFT JOIN taxpayers tp ON t.taxpayer_id = tp.id WHERE t.id = ?'
    ).get(req.params.id) as any
    if (!ticket) {
      res.status(404).json({ success: false, error: '工单不存在' })
      return
    }
    const replies = db.prepare(
      'SELECT tr.*, u.real_name, u.role FROM ticket_replies tr JOIN users u ON tr.user_id = u.id WHERE tr.ticket_id = ? ORDER BY tr.created_at ASC'
    ).all(req.params.id) as any[]
    for (const r of replies) {
      if (typeof r.attachments === 'string') {
        try { r.attachments = JSON.parse(r.attachments) } catch { r.attachments = [] }
      }
    }
    res.json({ success: true, data: { ...ticket, replies } })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取工单详情失败' })
  }
})

router.post('/:id/reply', authMiddleware, upload.array('attachments', 5), async (req: Request, res: Response): Promise<void> => {
  try {
    const { content } = req.body
    if (!content) {
      res.status(400).json({ success: false, error: '缺少回复内容' })
      return
    }
    const files = req.files as Express.Multer.File[] | undefined
    const attachments = files ? JSON.stringify(files.map(f => ({ filename: f.originalname || f.filename, path: f.filename }))) : '[]'
    db.prepare('INSERT INTO ticket_replies (ticket_id, user_id, content, attachments) VALUES (?, ?, ?, ?)')
      .run(Number(req.params.id), req.user!.id, content, attachments)
    const newStatus = req.user!.role === 'admin' ? 'replied' : 'processing'
    db.prepare('UPDATE tickets SET status=?, updated_at=datetime(\'now\') WHERE id=?')
      .run(newStatus, req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: '回复工单失败' })
  }
})

router.put('/:id/status', authMiddleware, roleMiddleware('admin'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body
    if (!['open', 'processing', 'replied', 'closed'].includes(status)) {
      res.status(400).json({ success: false, error: '无效状态' })
      return
    }
    db.prepare('UPDATE tickets SET status=?, updated_at=datetime(\'now\') WHERE id=?')
      .run(status, req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: '更新工单状态失败' })
  }
})

export default router

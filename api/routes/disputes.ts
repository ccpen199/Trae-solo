import express, { type Request, type Response } from 'express'
import db from '../db.js'

const router = express.Router()

router.get('/', (req: Request, res: Response) => {
  const {
    franchiseeId,
    complainantId,
    respondentId,
    mediatorId,
    status,
    priority,
    category,
    page = 1,
    pageSize = 20,
  } = req.query

  let whereClause: string[] = []
  let params: any[] = []

  if (franchiseeId) {
    whereClause.push('franchisee_id = ?')
    params.push(parseInt(franchiseeId as string))
  }

  if (complainantId) {
    whereClause.push('complainant_id = ?')
    params.push(parseInt(complainantId as string))
  }

  if (respondentId) {
    whereClause.push('respondent_id = ?')
    params.push(parseInt(respondentId as string))
  }

  if (mediatorId) {
    whereClause.push('mediator_id = ?')
    params.push(parseInt(mediatorId as string))
  }

  if (status) {
    whereClause.push('status = ?')
    params.push(status)
  }

  if (priority) {
    whereClause.push('priority = ?')
    params.push(priority)
  }

  if (category) {
    whereClause.push('category = ?')
    params.push(category)
  }

  const whereSql = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : ''

  const countSql = `SELECT COUNT(*) as total FROM dispute_tickets ${whereSql}`
  const totalResult = db.prepare(countSql).get(...params) as { total: number }

  const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string)
  const limit = parseInt(pageSize as string)

  const sql = `
    SELECT dt.*, 
           p.name as project_name,
           u1.name as complainant_name,
           u2.name as respondent_name,
           u3.name as mediator_name
    FROM dispute_tickets dt
    LEFT JOIN franchisee_lifecycle fl ON dt.franchisee_id = fl.id
    LEFT JOIN projects p ON fl.project_id = p.id
    LEFT JOIN users u1 ON dt.complainant_id = u1.id
    LEFT JOIN users u2 ON dt.respondent_id = u2.id
    LEFT JOIN users u3 ON dt.mediator_id = u3.id
    ${whereSql}
    ORDER BY dt.created_at DESC
    LIMIT ? OFFSET ?
  `

  const tickets = db.prepare(sql).all(...params, limit, offset)

  res.json({
    success: true,
    data: {
      list: tickets,
      total: totalResult.total,
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    },
  })
})

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params

  const ticket = db
    .prepare(
      `SELECT dt.*, 
              p.name as project_name,
              u1.name as complainant_name,
              u2.name as respondent_name,
              u3.name as mediator_name
       FROM dispute_tickets dt
       LEFT JOIN franchisee_lifecycle fl ON dt.franchisee_id = fl.id
       LEFT JOIN projects p ON fl.project_id = p.id
       LEFT JOIN users u1 ON dt.complainant_id = u1.id
       LEFT JOIN users u2 ON dt.respondent_id = u2.id
       LEFT JOIN users u3 ON dt.mediator_id = u3.id
       WHERE dt.id = ?`
    )
    .get(id)

  if (!ticket) {
    return res.status(404).json({
      success: false,
      error: '工单不存在',
    })
  }

  const messages = db
    .prepare(
      `SELECT tm.*, u.name as sender_name
       FROM ticket_messages tm
       LEFT JOIN users u ON tm.sender_id = u.id
       WHERE tm.ticket_id = ?
       ORDER BY tm.created_at ASC`
    )
    .all(id)

  res.json({
    success: true,
    data: Object.assign({}, ticket, { messages }),
  })
})

router.post('/', (req: Request, res: Response) => {
  const {
    franchisee_id,
    title,
    description,
    category,
    priority,
    complainant_id,
    respondent_id,
  } = req.body

  if (!franchisee_id || !title || !description || !complainant_id || !respondent_id) {
    return res.status(400).json({
      success: false,
      error: '必填字段不能为空',
    })
  }

  const result = db
    .prepare(
      `INSERT INTO dispute_tickets (franchisee_id, title, description, category, priority, complainant_id, respondent_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      franchisee_id,
      title,
      description,
      category || 'other',
      priority || 'normal',
      complainant_id,
      respondent_id
    )

  res.json({
    success: true,
    data: {
      id: result.lastInsertRowid,
    },
  })
})

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params
  const { status, priority, mediator_id, resolution } = req.body

  const existing = db.prepare('SELECT * FROM dispute_tickets WHERE id = ?').get(id)
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: '工单不存在',
    })
  }

  db.prepare(
    `UPDATE dispute_tickets 
     SET status = ?, priority = ?, mediator_id = ?, resolution = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(
    status || (existing as any).status,
    priority || (existing as any).priority,
    mediator_id !== undefined ? mediator_id : (existing as any).mediator_id,
    resolution !== undefined ? resolution : (existing as any).resolution,
    id
  )

  res.json({
    success: true,
    data: { id },
  })
})

router.post('/:id/messages', (req: Request, res: Response) => {
  const { id } = req.params
  const { sender_id, content, attachments } = req.body

  if (!sender_id || !content) {
    return res.status(400).json({
      success: false,
      error: '发送人ID和内容不能为空',
    })
  }

  const result = db
    .prepare(
      'INSERT INTO ticket_messages (ticket_id, sender_id, content, attachments) VALUES (?, ?, ?, ?)'
    )
    .run(id, sender_id, content, attachments || '')

  res.json({
    success: true,
    data: {
      id: result.lastInsertRowid,
    },
  })
})

router.get('/stats', (req: Request, res: Response) => {
  const statusStats = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM dispute_tickets
    GROUP BY status
  `).all()

  const priorityStats = db.prepare(`
    SELECT priority, COUNT(*) as count
    FROM dispute_tickets
    GROUP BY priority
  `).all()

  const total = db.prepare('SELECT COUNT(*) as count FROM dispute_tickets').get() as { count: number }

  res.json({
    success: true,
    data: {
      total: total.count,
      statusStats,
      priorityStats,
    },
  })
})

export default router

import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { randomUUID } from 'crypto'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { user_id, status, page = '1', pageSize = '10' } = req.query
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

  const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''

  const totalStmt = db.prepare(`SELECT COUNT(*) as count FROM tickets ${whereSql}`)
  const total = totalStmt.get(...params) as { count: number }

  const stmt = db.prepare(`SELECT * FROM tickets ${whereSql} ORDER BY updated_at DESC LIMIT ? OFFSET ?`)
  const tickets = stmt.all(...params, pageSizeNum, offset)

  const parsed = tickets.map((t: any) => ({
    ...t,
    messages: JSON.parse(t.messages),
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
  const statusCounts = db.prepare(`
    SELECT status, COUNT(*) as count FROM tickets GROUP BY status
  `).all()

  const total = db.prepare('SELECT COUNT(*) as count FROM tickets').get() as { count: number }

  const result: Record<string, number> = {}
  for (const item of statusCounts as any[]) {
    result[item.status] = item.count
  }

  res.json({
    success: true,
    data: {
      total: total.count,
      by_status: result,
    },
  })
})

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params

  const stmt = db.prepare('SELECT * FROM tickets WHERE id = ?')
  const ticket = stmt.get(id) as any

  if (!ticket) {
    res.status(404).json({ success: false, error: '工单不存在' })
    return
  }

  res.json({
    success: true,
    data: {
      ...ticket,
      messages: JSON.parse(ticket.messages),
    },
  })
})

router.post('/', (req: Request, res: Response): void => {
  const { user_id, subject, content } = req.body

  if (!subject || !content) {
    res.status(400).json({ success: false, error: '标题和内容不能为空' })
    return
  }

  const id = randomUUID()
  const messages = JSON.stringify([
    {
      role: 'user',
      content,
      time: new Date().toISOString().replace('T', ' ').slice(0, 16),
    },
  ])

  const stmt = db.prepare(`
    INSERT INTO tickets (id, user_id, subject, status, messages)
    VALUES (?, ?, ?, 'open', ?)
  `)
  stmt.run(id, user_id || null, subject, messages)

  const newTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as any
  res.status(201).json({
    success: true,
    data: {
      ...newTicket,
      messages: JSON.parse(newTicket.messages),
    },
  })
})

router.post('/:id/messages', (req: Request, res: Response): void => {
  const { id } = req.params
  const { role = 'user', content } = req.body

  if (!content) {
    res.status(400).json({ success: false, error: '消息内容不能为空' })
    return
  }

  const ticketStmt = db.prepare('SELECT * FROM tickets WHERE id = ?')
  const ticket = ticketStmt.get(id) as any

  if (!ticket) {
    res.status(404).json({ success: false, error: '工单不存在' })
    return
  }

  const messages = JSON.parse(ticket.messages)
  messages.push({
    role,
    content,
    time: new Date().toISOString().replace('T', ' ').slice(0, 16),
  })

  let newStatus = ticket.status
  if (role === 'user' && ticket.status === 'resolved') {
    newStatus = 'reopened'
  } else if (role === 'agent' && ticket.status === 'open') {
    newStatus = 'in_progress'
  }

  const stmt = db.prepare('UPDATE tickets SET messages = ?, status = ?, updated_at = datetime(\'now\') WHERE id = ?')
  stmt.run(JSON.stringify(messages), newStatus, id)

  const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as any
  res.json({
    success: true,
    data: {
      ...updated,
      messages: JSON.parse(updated.messages),
    },
  })
})

router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params
  const { status, subject } = req.body

  const ticketStmt = db.prepare('SELECT * FROM tickets WHERE id = ?')
  const existing = ticketStmt.get(id) as any

  if (!existing) {
    res.status(404).json({ success: false, error: '工单不存在' })
    return
  }

  const updateFields: string[] = []
  const updateParams: any[] = []

  if (status !== undefined) {
    updateFields.push('status = ?')
    updateParams.push(status)
  }
  if (subject !== undefined) {
    updateFields.push('subject = ?')
    updateParams.push(subject)
  }

  if (updateFields.length > 0) {
    updateFields.push('updated_at = datetime(\'now\')')
    updateParams.push(id)

    const stmt = db.prepare(`UPDATE tickets SET ${updateFields.join(', ')} WHERE id = ?`)
    stmt.run(...updateParams)
  }

  const updated = db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as any
  res.json({
    success: true,
    data: {
      ...updated,
      messages: JSON.parse(updated.messages),
    },
  })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params

  const ticketStmt = db.prepare('SELECT * FROM tickets WHERE id = ?')
  const existing = ticketStmt.get(id)

  if (!existing) {
    res.status(404).json({ success: false, error: '工单不存在' })
    return
  }

  const stmt = db.prepare('DELETE FROM tickets WHERE id = ?')
  stmt.run(id)

  res.json({
    success: true,
    message: '工单已删除',
  })
})

export default router

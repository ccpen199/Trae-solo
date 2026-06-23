import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { status = 'active' } = req.query
  const db = getDb()

  let sql = `
    SELECT e.*, COUNT(er.id) as registered_count
    FROM events e
    LEFT JOIN event_registrations er ON e.id = er.event_id
    WHERE e.status = ?
    GROUP BY e.id
    ORDER BY e.created_at DESC
  `

  const rows = db.prepare(sql).all(status)
  res.json({ success: true, data: rows })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(Number(req.params.id)) as any
  if (!event) {
    res.status(404).json({ success: false, error: '活动不存在' })
    return
  }

  const registeredCount = (db.prepare('SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ?').get(Number(req.params.id)) as any).count
  const registeredUsers = db.prepare(`
    SELECT u.*
    FROM event_registrations er
    LEFT JOIN users u ON er.user_id = u.id
    WHERE er.event_id = ?
    ORDER BY er.registered_at DESC
  `).all(Number(req.params.id))

  res.json({
    success: true,
    data: {
      ...event,
      registered_count: registeredCount,
      registrations: registeredUsers,
    },
  })
})

router.post('/', (req: Request, res: Response): void => {
  const { organizer_id, title, description, location, event_time, max_participants } = req.body
  if (!organizer_id || !title) {
    res.status(400).json({ success: false, error: 'organizer_id和title为必填项' })
    return
  }

  const db = getDb()
  const result = db.prepare(
    'INSERT INTO events (organizer_id, title, description, location, event_time, max_participants, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(organizer_id, title, description || null, location || null, event_time || null, max_participants || null, 'active')

  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: event })
})

router.post('/:id/register', (req: Request, res: Response): void => {
  const { user_id } = req.body
  if (!user_id) {
    res.status(400).json({ success: false, error: 'user_id为必填项' })
    return
  }

  const db = getDb()
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(Number(req.params.id)) as any
  if (!event) {
    res.status(404).json({ success: false, error: '活动不存在' })
    return
  }

  const existing = db.prepare('SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?').get(Number(req.params.id), user_id)
  if (existing) {
    res.status(409).json({ success: false, error: '已报名该活动' })
    return
  }

  const registeredCount = (db.prepare('SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ?').get(Number(req.params.id)) as any).count
  if (event.max_participants && registeredCount >= event.max_participants) {
    res.status(400).json({ success: false, error: '活动名额已满' })
    return
  }

  db.prepare('INSERT INTO event_registrations (event_id, user_id) VALUES (?, ?)').run(Number(req.params.id), user_id)
  res.json({ success: true, data: { message: '报名成功' } })
})

export default router

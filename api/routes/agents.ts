import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { store_id, certified, page = '1', pageSize = '20' } = req.query
  const p = Number(page)
  const ps = Number(pageSize)
  const offset = (p - 1) * ps

  let where = 'WHERE 1=1'
  const params: any[] = []
  if (store_id) { where += ' AND a.store_id = ?'; params.push(store_id) }
  if (certified) { where += ' AND a.certified = ?'; params.push(Number(certified)) }

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM agents a ${where}`).get(...params) as any).cnt
  const rows = db.prepare(
    `SELECT a.*, s.name as store_name, s.address as store_address
    FROM agents a LEFT JOIN stores s ON a.store_id = s.id ${where} ORDER BY a.rating DESC LIMIT ? OFFSET ?`
  ).all(...params, ps, offset)

  res.json({ success: true, data: { list: rows, total, page: p, pageSize: ps } })
})

router.get('/stores', (req: Request, res: Response): void => {
  const db = getDb()
  const rows = db.prepare('SELECT s.*, (SELECT COUNT(*) FROM agents a WHERE a.store_id = s.id) as agent_count FROM stores s').all()
  res.json({ success: true, data: rows })
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const agent = db.prepare(
    `SELECT a.*, s.name as store_name, s.address as store_address, s.phone as store_phone
    FROM agents a LEFT JOIN stores s ON a.store_id = s.id WHERE a.id = ?`
  ).get(req.params.id) as Record<string, unknown> | undefined
  if (!agent) {
    res.status(404).json({ success: false, error: '经纪人不存在' })
    return
  }
  const recentViewings = db.prepare(
    `SELECT v.*, p.title as property_title, p.type as property_type, p.price, p.area
    FROM viewings v LEFT JOIN properties p ON v.property_id = p.id
    WHERE v.agent_id = ? ORDER BY v.viewed_at DESC LIMIT 10`
  ).all(req.params.id)
  const activeProperties = db.prepare(
    "SELECT * FROM properties WHERE agent_id = ? AND status = 'active' LIMIT 20"
  ).all(req.params.id)

  res.json({ success: true, data: { ...agent, recentViewings, activeProperties } })
})

router.get('/:id/contacts', (req: Request, res: Response): void => {
  const db = getDb()
  const agent = db.prepare('SELECT id FROM agents WHERE id = ?').get(req.params.id)
  if (!agent) {
    res.status(404).json({ success: false, error: '经纪人不存在' })
    return
  }
  const records = db.prepare(
    `SELECT r.*, s.name as store_name,
      (SELECT COUNT(*) FROM viewings v WHERE v.agent_id = r.agent_id AND v.customer_id = r.customer_id) as assigned_viewings_count
     FROM agent_contact_records r
     LEFT JOIN agents a ON r.agent_id = a.id
     LEFT JOIN stores s ON a.store_id = s.id
     WHERE r.agent_id = ?
     ORDER BY r.created_at DESC
     LIMIT 50`
  ).all(req.params.id)
  res.json({ success: true, data: records })
})

router.get('/:id/exclusive', (req: Request, res: Response): void => {
  const db = getDb()
  const { customer_id = '5' } = req.query
  const agent = db.prepare('SELECT id, store_id FROM agents WHERE id = ?').get(req.params.id) as any
  if (!agent) {
    res.status(404).json({ success: false, error: '经纪人不存在' })
    return
  }
  let assignment = db.prepare(
    `SELECT e.*, s.name as store_name
     FROM exclusive_assignments e
     LEFT JOIN stores s ON e.store_id = s.id
     WHERE e.agent_id = ? AND e.customer_id = ? AND e.status = 'active'
     ORDER BY e.assigned_at DESC
     LIMIT 1`
  ).get(req.params.id, customer_id)
  if (!assignment) {
    const hasContact = db.prepare(
      'SELECT COUNT(*) as cnt FROM agent_contact_records WHERE agent_id = ? AND customer_id = ? AND has_shared = 1'
    ).get(req.params.id, customer_id) as any
    if (hasContact.cnt > 0) {
      const result = db.prepare(
        `INSERT INTO exclusive_assignments (agent_id, customer_id, store_id, status, assigned_at)
         VALUES (?, ?, ?, 'active', datetime('now','localtime'))`
      ).run(req.params.id, customer_id, agent.store_id)
      assignment = db.prepare(
        `SELECT e.*, s.name as store_name
         FROM exclusive_assignments e
         LEFT JOIN stores s ON e.store_id = s.id
         WHERE e.id = ?`
      ).get(result.lastInsertRowid)
    }
  }
  res.json({ success: true, data: assignment || null })
})

router.post('/:id/contact', (req: Request, res: Response): void => {
  const db = getDb()
  const agent = db.prepare('SELECT id, store_id FROM agents WHERE id = ?').get(req.params.id) as any
  if (!agent) {
    res.status(404).json({ success: false, error: '经纪人不存在' })
    return
  }
  const { contact_type, content, status = 'pending', next_follow_up, customer_id = 5, has_shared = 1, auto_assign_viewings = 1 } = req.body
  if (!contact_type || !['phone', 'im', 'viewing'].includes(contact_type)) {
    res.status(400).json({ success: false, error: '请选择有效的联系方式' })
    return
  }
  const result = db.prepare(
    `INSERT INTO agent_contact_records (agent_id, customer_id, contact_type, content, status, next_follow_up, has_shared)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    req.params.id,
    customer_id,
    contact_type,
    content || '',
    status || 'pending',
    next_follow_up || null,
    has_shared
  )
  if (auto_assign_viewings) {
    db.prepare(
      `UPDATE viewings SET agent_id = ? WHERE customer_id = ? AND agent_id IS NULL`
    ).run(req.params.id, customer_id)
  }
  const record = db.prepare(
    `SELECT r.*, s.name as store_name,
      (SELECT COUNT(*) FROM viewings v WHERE v.agent_id = r.agent_id AND v.customer_id = r.customer_id) as assigned_viewings_count
     FROM agent_contact_records r
     LEFT JOIN agents a ON r.agent_id = a.id
     LEFT JOIN stores s ON a.store_id = s.id
     WHERE r.id = ?`
  ).get(result.lastInsertRowid)
  res.json({ success: true, data: record, message: '联系记录已保存' })
})

export default router

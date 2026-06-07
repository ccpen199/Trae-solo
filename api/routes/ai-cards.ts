import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { user_id } = req.query
  let where = 'WHERE 1=1'
  const params: any[] = []
  if (user_id) { where += ' AND ac.user_id = ?'; params.push(user_id) }

  const rows = db.prepare(
    `SELECT ac.*, 
      (SELECT COUNT(*) FROM properties p WHERE p.status = 'active') as total_matching
    FROM ai_property_cards ac ${where} ORDER BY ac.created_at DESC`
  ).all(...params)
  res.json({ success: true, data: rows })
})

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { user_id, name, filters_json } = req.body
  if (!user_id || !filters_json) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }
  const r = db.prepare(
    'INSERT INTO ai_property_cards (user_id, name, filters_json) VALUES (?, ?, ?)'
  ).run(user_id, name || '我的房卡', typeof filters_json === 'string' ? filters_json : JSON.stringify(filters_json))
  res.json({ success: true, data: { id: r.lastInsertRowid } })
})

router.put('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const { name, filters_json, active } = req.body
  const updates: string[] = []
  const params: any[] = []
  if (name !== undefined) { updates.push('name = ?'); params.push(name) }
  if (filters_json !== undefined) { updates.push('filters_json = ?'); params.push(typeof filters_json === 'string' ? filters_json : JSON.stringify(filters_json)) }
  if (active !== undefined) { updates.push('active = ?'); params.push(active) }
  if (updates.length === 0) { res.json({ success: true }); return }
  updates.push("updated_at = datetime('now','localtime')")
  params.push(req.params.id)
  db.prepare(`UPDATE ai_property_cards SET ${updates.join(', ')} WHERE id = ?`).run(...params)
  res.json({ success: true })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  db.prepare('DELETE FROM ai_property_cards WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

router.post('/:id/match', (req: Request, res: Response): void => {
  const db = getDb()
  const card = db.prepare('SELECT * FROM ai_property_cards WHERE id = ?').get(req.params.id) as any
  if (!card) {
    res.status(404).json({ success: false, error: '房卡不存在' })
    return
  }

  const filters = JSON.parse(card.filters_json || '{}')
  let where = "WHERE p.status = 'active'"
  const params: any[] = []

  if (filters.type) { where += ' AND p.type = ?'; params.push(filters.type) }
  if (filters.min_price) { where += ' AND p.price >= ?'; params.push(Number(filters.min_price)) }
  if (filters.max_price) { where += ' AND p.price <= ?'; params.push(Number(filters.max_price)) }
  if (filters.rooms) { where += ' AND p.rooms = ?'; params.push(Number(filters.rooms)) }
  if (filters.district) { where += ' AND c.district = ?'; params.push(filters.district) }
  if (filters.min_area) { where += ' AND p.area >= ?'; params.push(Number(filters.min_area)) }
  if (filters.max_area) { where += ' AND p.area <= ?'; params.push(Number(filters.max_area)) }

  const matched = db.prepare(
    `SELECT p.*, c.name as community_name, c.district FROM properties p LEFT JOIN communities c ON p.community_id = c.id ${where} ORDER BY p.created_at DESC LIMIT 20`
  ).all(...params)

  db.prepare("UPDATE ai_property_cards SET push_count = push_count + 1, last_pushed_at = datetime('now','localtime') WHERE id = ?").run(req.params.id)

  res.json({ success: true, data: matched })
})

export default router

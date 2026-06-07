import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/collaborations', (req: Request, res: Response): void => {
  const db = getDb()
  const { agent_id, page = '1', pageSize = '20' } = req.query
  const p = Number(page)
  const ps = Number(pageSize)
  const offset = (p - 1) * ps

  let where = "WHERE ac.status = 'active'"
  const params: any[] = []
  if (agent_id) { where += ' AND (ac.from_agent_id = ? OR ac.to_agent_id = ?)'; params.push(agent_id, agent_id) }

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM agent_collaborations ac ${where}`).get(...params) as any).cnt
  const rows = db.prepare(
    `SELECT ac.*, 
      fa.name as from_agent_name, fs.name as from_store_name,
      ta.name as to_agent_name, ts.name as to_store_name
    FROM agent_collaborations ac
    LEFT JOIN agents fa ON ac.from_agent_id = fa.id
    LEFT JOIN stores fs ON fa.store_id = fs.id
    LEFT JOIN agents ta ON ac.to_agent_id = ta.id
    LEFT JOIN stores ts ON ta.store_id = ts.id
    ${where} ORDER BY ac.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, ps, offset)

  res.json({ success: true, data: { list: rows, total, page: p, pageSize: ps } })
})

router.post('/collaborations', (req: Request, res: Response): void => {
  const db = getDb()
  const { from_agent_id, to_agent_id, customer_name, permission_level } = req.body
  if (!from_agent_id || !to_agent_id) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }
  const r = db.prepare(
    'INSERT INTO agent_collaborations (from_agent_id, to_agent_id, customer_name, permission_level) VALUES (?, ?, ?, ?)'
  ).run(from_agent_id, to_agent_id, customer_name || '', permission_level || 'view')
  res.json({ success: true, data: { id: r.lastInsertRowid } })
})

router.put('/collaborations/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const { permission_level, status } = req.body
  const updates: string[] = []
  const params: any[] = []
  if (permission_level) { updates.push('permission_level = ?'); params.push(permission_level) }
  if (status) { updates.push('status = ?'); params.push(status) }
  if (updates.length === 0) { res.json({ success: true }); return }
  params.push(req.params.id)
  db.prepare(`UPDATE agent_collaborations SET ${updates.join(', ')} WHERE id = ?`).run(...params)
  res.json({ success: true })
})

router.get('/viewings', (req: Request, res: Response): void => {
  const db = getDb()
  const { agent_id, property_id, page = '1', pageSize = '20' } = req.query
  const p = Number(page)
  const ps = Number(pageSize)
  const offset = (p - 1) * ps

  let where = 'WHERE 1=1'
  const params: any[] = []
  if (agent_id) { where += ' AND v.agent_id = ?'; params.push(agent_id) }
  if (property_id) { where += ' AND v.property_id = ?'; params.push(property_id) }

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM viewings v ${where}`).get(...params) as any).cnt
  const rows = db.prepare(
    `SELECT v.*, a.name as agent_name, p.title as property_title, p.type as property_type, p.price
    FROM viewings v
    LEFT JOIN agents a ON v.agent_id = a.id
    LEFT JOIN properties p ON v.property_id = p.id
    ${where} ORDER BY v.viewed_at DESC LIMIT ? OFFSET ?`
  ).all(...params, ps, offset)

  res.json({ success: true, data: { list: rows, total, page: p, pageSize: ps } })
})

router.post('/viewings', (req: Request, res: Response): void => {
  const db = getDb()
  const { property_id, agent_id, viewer_name, viewer_phone, viewed_at, type, notes, rating } = req.body
  if (!property_id || !agent_id) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }
  const r = db.prepare(
    'INSERT INTO viewings (property_id, agent_id, viewer_name, viewer_phone, viewed_at, type, notes, rating, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(property_id, agent_id, viewer_name || '', viewer_phone || '', viewed_at || new Date().toISOString().slice(0, 19).replace('T', ' '), type || 'offline', notes || '', rating || 0, 'completed')
  res.json({ success: true, data: { id: r.lastInsertRowid } })
})

router.get('/verifications', (req: Request, res: Response): void => {
  const db = getDb()
  const { status, page = '1', pageSize = '20' } = req.query
  const p = Number(page)
  const ps = Number(pageSize)
  const offset = (p - 1) * ps

  let where = 'WHERE 1=1'
  const params: any[] = []
  if (status) { where += ' AND pv.verification_status = ?'; params.push(status) }

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM property_verifications pv ${where}`).get(...params) as any).cnt
  const rows = db.prepare(
    `SELECT pv.*, p.title as property_title, p.community_id, c.name as community_name,
      a.name as inspector_name
    FROM property_verifications pv
    LEFT JOIN properties p ON pv.property_id = p.id
    LEFT JOIN communities c ON p.community_id = c.id
    LEFT JOIN agents a ON pv.inspector_id = a.id
    ${where} ORDER BY pv.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, ps, offset)

  res.json({ success: true, data: { list: rows, total, page: p, pageSize: ps } })
})

router.post('/verifications', (req: Request, res: Response): void => {
  const db = getDb()
  const { property_id, inspector_id, inspection_photos_json, ai_match_score, address_verified, verification_status, notes } = req.body
  if (!property_id) {
    res.status(400).json({ success: false, error: '缺少房源ID' })
    return
  }
  const r = db.prepare(
    `INSERT INTO property_verifications (property_id, inspector_id, inspection_photos_json, ai_match_score, address_verified, verification_status, verified_at, notes) VALUES (?, ?, ?, ?, ?, ?, datetime('now','localtime'), ?)`
  ).run(property_id, inspector_id || null, inspection_photos_json || '[]', ai_match_score || 0, address_verified || 0, verification_status || 'pending', notes || '')
  res.json({ success: true, data: { id: r.lastInsertRowid } })
})

router.put('/verifications/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const { verification_status, ai_match_score, address_verified, notes } = req.body
  const updates: string[] = []
  const params: any[] = []
  if (verification_status) { updates.push('verification_status = ?'); params.push(verification_status) }
  if (ai_match_score !== undefined) { updates.push('ai_match_score = ?'); params.push(ai_match_score) }
  if (address_verified !== undefined) { updates.push('address_verified = ?'); params.push(address_verified) }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes) }
  if (updates.length === 0) { res.json({ success: true }); return }
  updates.push("verified_at = datetime('now','localtime')")
  params.push(req.params.id)
  db.prepare(`UPDATE property_verifications SET ${updates.join(', ')} WHERE id = ?`).run(...params)
  res.json({ success: true })
})

router.post('/renovation', (req: Request, res: Response): void => {
  const db = getDb()
  const { user_id, property_id, floor_plan_url, style } = req.body
  if (!user_id) {
    res.status(400).json({ success: false, error: '缺少用户ID' })
    return
  }
  const r = db.prepare(
    'INSERT INTO renovation_simulations (user_id, property_id, floor_plan_url, style) VALUES (?, ?, ?, ?)'
  ).run(user_id, property_id || null, floor_plan_url || '', style || 'modern')
  setTimeout(() => {
    const resultUrl = `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern+interior+design+${style || 'modern'}&image_size=landscape_16_9`
    db.prepare("UPDATE renovation_simulations SET result_url = ?, status = 'completed' WHERE id = ?").run(resultUrl, r.lastInsertRowid)
  }, 2000)
  res.json({ success: true, data: { id: r.lastInsertRowid, status: 'processing' } })
})

router.get('/renovation/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM renovation_simulations WHERE id = ?').get(req.params.id)
  if (!row) {
    res.status(404).json({ success: false, error: '记录不存在' })
    return
  }
  res.json({ success: true, data: row })
})

export default router

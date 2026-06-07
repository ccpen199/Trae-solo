import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { owner_id, status, page = '1', pageSize = '20' } = req.query
  const p = Number(page)
  const ps = Number(pageSize)
  const offset = (p - 1) * ps

  let where = 'WHERE 1=1'
  const params: any[] = []
  if (owner_id) { where += ' AND d.owner_id = ?'; params.push(owner_id) }
  if (status) { where += ' AND d.status = ?'; params.push(status) }

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM owner_delegations d ${where}`).get(...params) as any).cnt
  const rows = db.prepare(
    `SELECT d.*, a.name as agent_name, a.store_id, s.name as store_name,
      p.title as property_title, p.price as property_price, p.type as property_type
    FROM owner_delegations d
    LEFT JOIN agents a ON d.agent_id = a.id
    LEFT JOIN stores s ON a.store_id = s.id
    LEFT JOIN properties p ON d.property_id = p.id
    ${where} ORDER BY d.created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, ps, offset)

  const list = rows.map((row: any) => {
    const history = db.prepare(
      `SELECT h.*, a.name as agent_name FROM delegation_status_history h
       LEFT JOIN agents a ON h.agent_id = a.id
       WHERE h.delegation_id = ? ORDER BY h.created_at ASC`
    ).all(row.id)
    return { ...row, status_history: history }
  })

  res.json({ success: true, data: { list, total, page: p, pageSize: ps } })
})

router.post('/', (req: Request, res: Response): void => {
  const db = getDb()
  const { owner_id, property_id, title, description, expected_price } = req.body
  if (!owner_id || !title) {
    res.status(400).json({ success: false, error: '缺少必填字段' })
    return
  }
  const r = db.prepare(
    'INSERT INTO owner_delegations (owner_id, property_id, title, description, expected_price) VALUES (?, ?, ?, ?, ?)'
  ).run(owner_id, property_id || null, title, description || '', expected_price || 0)
  
  db.prepare(
    'INSERT INTO delegation_status_history (delegation_id, from_status, to_status, remark) VALUES (?, ?, ?, ?)'
  ).run(r.lastInsertRowid, null, 'pending', '业主发布委托')
  
  res.json({ success: true, data: { id: r.lastInsertRowid } })
})

router.put('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const { agent_id, status, description, expected_price, remark } = req.body
  const updates: string[] = []
  const params: any[] = []
  
  const current = db.prepare('SELECT status, agent_id FROM owner_delegations WHERE id = ?').get(req.params.id) as any
  if (!current) {
    res.status(404).json({ success: false, error: '委托不存在' })
    return
  }
  
  if (agent_id !== undefined) { updates.push('agent_id = ?'); params.push(agent_id) }
  if (status) { updates.push('status = ?'); params.push(status) }
  if (description !== undefined) { updates.push('description = ?'); params.push(description) }
  if (expected_price !== undefined) { updates.push('expected_price = ?'); params.push(expected_price) }
  
  if (updates.length === 0) { res.json({ success: true }); return }
  
  updates.push("updated_at = datetime('now','localtime')")
  params.push(req.params.id)
  db.prepare(`UPDATE owner_delegations SET ${updates.join(', ')} WHERE id = ?`).run(...params)
  
  if (status && status !== current.status) {
    const statusRemarks: any = {
      'assigned': '经纪人已分配',
      'active': '经纪人确认接单，开始服务',
      'completed': '委托完成',
      'cancelled': '委托已取消'
    }
    db.prepare(
      'INSERT INTO delegation_status_history (delegation_id, from_status, to_status, agent_id, remark) VALUES (?, ?, ?, ?, ?)'
    ).run(req.params.id, current.status, status, agent_id || current.agent_id, remark || statusRemarks[status] || '状态变更')
  } else if (agent_id !== undefined && agent_id !== current.agent_id) {
    db.prepare(
      'INSERT INTO delegation_status_history (delegation_id, from_status, to_status, agent_id, remark) VALUES (?, ?, ?, ?, ?)'
    ).run(req.params.id, current.status, current.status, agent_id, remark || '更换专属经纪人')
  }
  
  res.json({ success: true })
})

export default router

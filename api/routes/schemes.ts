import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

function parseSchemeJsonFields(row: any) {
  if (row.user_roles) row.user_roles = JSON.parse(row.user_roles)
  if (row.key_flows) row.key_flows = JSON.parse(row.key_flows)
  return row
}

router.get('/', (_req: Request, res: Response): void => {
  const db = getDb()
  const schemes = db.prepare(`
    SELECT s.*, u.username as created_by_username
    FROM schemes s
    LEFT JOIN users u ON s.created_by = u.id
    ORDER BY s.created_at DESC
  `).all() as any[]
  res.json(schemes.map(parseSchemeJsonFields))
})

router.post('/', (req: Request, res: Response): void => {
  const name = req.body.name
  const business_goal = req.body.business_goal || req.body.businessGoal
  const user_roles = req.body.user_roles || req.body.userRoles
  const key_flows = req.body.key_flows || req.body.keyFlows
  const prototype_link = req.body.prototype_link || req.body.prototypeLink
  const state_diagram = req.body.state_diagram || req.body.stateDiagram
  const review_scope = req.body.review_scope || req.body.reviewScope
  const status = req.body.status
  const created_by = req.body.created_by || req.body.createdBy
  if (!name) {
    res.status(400).json({ error: 'name is required' })
    return
  }
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO schemes (name, business_goal, user_roles, key_flows, prototype_link, state_diagram, review_scope, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    business_goal || null,
    JSON.stringify(user_roles || []),
    JSON.stringify(key_flows || []),
    prototype_link || null,
    state_diagram || null,
    review_scope || null,
    status || 'draft',
    created_by || null
  )
  const scheme = db.prepare('SELECT * FROM schemes WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(parseSchemeJsonFields(scheme))
})

router.get('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const scheme = db.prepare(`
    SELECT s.*, u.username as created_by_username
    FROM schemes s
    LEFT JOIN users u ON s.created_by = u.id
    WHERE s.id = ?
  `).get(req.params.id) as any
  if (!scheme) {
    res.status(404).json({ error: 'scheme not found' })
    return
  }
  const stepCount = db.prepare('SELECT COUNT(*) as count FROM steps WHERE scheme_id = ?').get(scheme.id) as { count: number }
  const commentCount = db.prepare(`
    SELECT COUNT(*) as count FROM comments c
    JOIN steps st ON c.step_id = st.id
    WHERE st.scheme_id = ?
  `).get(scheme.id) as { count: number }
  parseSchemeJsonFields(scheme)
  res.json({ ...scheme, step_count: stepCount.count, comment_count: commentCount.count })
})

router.put('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM schemes WHERE id = ?').get(req.params.id) as any
  if (!existing) {
    res.status(404).json({ error: 'scheme not found' })
    return
  }
  const name = req.body.name
  const business_goal = req.body.business_goal ?? req.body.businessGoal
  const user_roles = req.body.user_roles ?? req.body.userRoles
  const key_flows = req.body.key_flows ?? req.body.keyFlows
  const prototype_link = req.body.prototype_link ?? req.body.prototypeLink
  const state_diagram = req.body.state_diagram ?? req.body.stateDiagram
  const review_scope = req.body.review_scope ?? req.body.reviewScope
  const status = req.body.status
  db.prepare(`
    UPDATE schemes SET
      name = COALESCE(?, name),
      business_goal = COALESCE(?, business_goal),
      user_roles = COALESCE(?, user_roles),
      key_flows = COALESCE(?, key_flows),
      prototype_link = COALESCE(?, prototype_link),
      state_diagram = COALESCE(?, state_diagram),
      review_scope = COALESCE(?, review_scope),
      status = COALESCE(?, status),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name ?? null,
    business_goal ?? null,
    user_roles !== undefined ? JSON.stringify(user_roles) : null,
    key_flows !== undefined ? JSON.stringify(key_flows) : null,
    prototype_link ?? null,
    state_diagram ?? null,
    review_scope ?? null,
    status ?? null,
    req.params.id
  )
  const scheme = db.prepare('SELECT * FROM schemes WHERE id = ?').get(req.params.id)
  res.json(parseSchemeJsonFields(scheme))
})

router.delete('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM schemes WHERE id = ?').get(req.params.id)
  if (!existing) {
    res.status(404).json({ error: 'scheme not found' })
    return
  }
  db.prepare('DELETE FROM schemes WHERE id = ?').run(req.params.id)
  res.json({ success: true })
})

export default router

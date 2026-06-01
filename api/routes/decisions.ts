import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

function parseDecisionJsonFields(row: any) {
  if (row.alternatives) row.alternatives = JSON.parse(row.alternatives)
  if (row.affected_pages) row.affected_pages = JSON.parse(row.affected_pages)
  return row
}

router.get('/schemes/:schemeId/decisions', (req: Request, res: Response): void => {
  const db = getDb()
  const decisions = db.prepare(`
    SELECT d.*, u.username as created_by_username
    FROM decisions d
    LEFT JOIN users u ON d.created_by = u.id
    WHERE d.scheme_id = ?
    ORDER BY d.created_at DESC
  `).all(req.params.schemeId)
  res.json(decisions.map(parseDecisionJsonFields))
})

router.post('/schemes/:schemeId/decisions', (req: Request, res: Response): void => {
  const dispute_point = req.body.dispute_point || req.body.disputePoint
  const alternatives = req.body.alternatives
  const chosen_index = req.body.chosen_index || req.body.chosenIndex
  const reason = req.body.reason
  const affected_pages = req.body.affected_pages || req.body.affectedPages
  const verification_method = req.body.verification_method || req.body.verificationMethod
  const created_by = req.body.created_by || req.body.createdBy
  if (!dispute_point) {
    res.status(400).json({ error: 'dispute_point is required' })
    return
  }
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO decisions (scheme_id, dispute_point, alternatives, chosen_index, reason, affected_pages, verification_method, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.schemeId,
    dispute_point,
    JSON.stringify(alternatives || []),
    chosen_index || 0,
    reason || null,
    JSON.stringify(affected_pages || []),
    verification_method || null,
    created_by || null
  )
  const decision = db.prepare('SELECT * FROM decisions WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(parseDecisionJsonFields(decision))
})

router.put('/decisions/:decisionId', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM decisions WHERE id = ?').get(req.params.decisionId) as any
  if (!existing) {
    res.status(404).json({ error: 'decision not found' })
    return
  }
  const dispute_point = req.body.dispute_point ?? req.body.disputePoint
  const alternatives = req.body.alternatives
  const chosen_index = req.body.chosen_index ?? req.body.chosenIndex
  const reason = req.body.reason
  const affected_pages = req.body.affected_pages ?? req.body.affectedPages
  const verification_method = req.body.verification_method ?? req.body.verificationMethod
  db.prepare(`
    UPDATE decisions SET
      dispute_point = COALESCE(?, dispute_point),
      alternatives = COALESCE(?, alternatives),
      chosen_index = COALESCE(?, chosen_index),
      reason = COALESCE(?, reason),
      affected_pages = COALESCE(?, affected_pages),
      verification_method = COALESCE(?, verification_method),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    dispute_point ?? null,
    alternatives !== undefined ? JSON.stringify(alternatives) : null,
    chosen_index ?? null,
    reason ?? null,
    affected_pages !== undefined ? JSON.stringify(affected_pages) : null,
    verification_method ?? null,
    req.params.decisionId
  )
  const decision = db.prepare('SELECT * FROM decisions WHERE id = ?').get(req.params.decisionId)
  res.json(parseDecisionJsonFields(decision))
})

router.delete('/decisions/:decisionId', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM decisions WHERE id = ?').get(req.params.decisionId)
  if (!existing) {
    res.status(404).json({ error: 'decision not found' })
    return
  }
  db.prepare('DELETE FROM decisions WHERE id = ?').run(req.params.decisionId)
  res.json({ success: true })
})

export default router

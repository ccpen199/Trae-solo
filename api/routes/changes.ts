import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

function parseChangeJsonFields(row: any) {
  if (row.related_requirements) row.related_requirements = JSON.parse(row.related_requirements)
  if (row.pending_sync) row.pending_sync = JSON.parse(row.pending_sync)
  return row
}

router.get('/schemes/:schemeId/changes', (req: Request, res: Response): void => {
  const db = getDb()
  const changes = db.prepare(`
    SELECT * FROM changes
    WHERE scheme_id = ?
    ORDER BY created_at DESC
  `).all(req.params.schemeId)
  res.json(changes.map(parseChangeJsonFields))
})

router.post('/schemes/:schemeId/changes', (req: Request, res: Response): void => {
  const version = req.body.version
  const summary = req.body.summary
  const related_requirements = req.body.related_requirements || req.body.relatedRequirements
  const pending_sync = req.body.pending_sync || req.body.pendingSync
  const sync_status = req.body.sync_status || req.body.syncStatus
  const created_by = req.body.created_by || req.body.createdBy
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO changes (scheme_id, version, summary, related_requirements, pending_sync, sync_status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.schemeId,
    version || null,
    summary || null,
    JSON.stringify(related_requirements || []),
    JSON.stringify(pending_sync || []),
    sync_status || 'pending',
    created_by || null
  )
  const change = db.prepare('SELECT * FROM changes WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(parseChangeJsonFields(change))
})

router.put('/changes/:changeId', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM changes WHERE id = ?').get(req.params.changeId)
  if (!existing) {
    res.status(404).json({ error: 'change not found' })
    return
  }
  const version = req.body.version
  const summary = req.body.summary
  const related_requirements = req.body.related_requirements ?? req.body.relatedRequirements
  const pending_sync = req.body.pending_sync ?? req.body.pendingSync
  const sync_status = req.body.sync_status ?? req.body.syncStatus
  db.prepare(`
    UPDATE changes SET
      version = COALESCE(?, version),
      summary = COALESCE(?, summary),
      related_requirements = COALESCE(?, related_requirements),
      pending_sync = COALESCE(?, pending_sync),
      sync_status = COALESCE(?, sync_status),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    version ?? null,
    summary ?? null,
    related_requirements !== undefined ? JSON.stringify(related_requirements) : null,
    pending_sync !== undefined ? JSON.stringify(pending_sync) : null,
    sync_status ?? null,
    req.params.changeId
  )
  const change = db.prepare('SELECT * FROM changes WHERE id = ?').get(req.params.changeId)
  res.json(parseChangeJsonFields(change))
})

router.delete('/changes/:changeId', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM changes WHERE id = ?').get(req.params.changeId)
  if (!existing) {
    res.status(404).json({ error: 'change not found' })
    return
  }
  db.prepare('DELETE FROM changes WHERE id = ?').run(req.params.changeId)
  res.json({ success: true })
})

export default router

import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/schemes/:schemeId/steps', (req: Request, res: Response): void => {
  const db = getDb()
  const steps = db.prepare(
    'SELECT * FROM steps WHERE scheme_id = ? ORDER BY step_order ASC, id ASC'
  ).all(req.params.schemeId)
  res.json(steps)
})

router.post('/schemes/:schemeId/steps', (req: Request, res: Response): void => {
  const title = req.body.title
  const description = req.body.description
  const step_order = req.body.step_order || req.body.stepOrder
  const entry_condition = req.body.entry_condition || req.body.entryCondition
  const expected_result = req.body.expected_result || req.body.expectedResult
  const status = req.body.status
  if (!title) {
    res.status(400).json({ error: 'title is required' })
    return
  }
  const db = getDb()
  const result = db.prepare(`
    INSERT INTO steps (scheme_id, title, description, step_order, entry_condition, expected_result, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.schemeId,
    title,
    description || null,
    step_order || 0,
    entry_condition || null,
    expected_result || null,
    status || 'pending'
  )
  const step = db.prepare('SELECT * FROM steps WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json(step)
})

router.put('/schemes/:schemeId/steps/:stepId', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM steps WHERE id = ? AND scheme_id = ?').get(req.params.stepId, req.params.schemeId)
  if (!existing) {
    res.status(404).json({ error: 'step not found' })
    return
  }
  const title = req.body.title
  const description = req.body.description
  const step_order = req.body.step_order ?? req.body.stepOrder
  const entry_condition = req.body.entry_condition ?? req.body.entryCondition
  const expected_result = req.body.expected_result ?? req.body.expectedResult
  const status = req.body.status
  db.prepare(`
    UPDATE steps SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      step_order = COALESCE(?, step_order),
      entry_condition = COALESCE(?, entry_condition),
      expected_result = COALESCE(?, expected_result),
      status = COALESCE(?, status),
      updated_at = datetime('now')
    WHERE id = ? AND scheme_id = ?
  `).run(
    title ?? null,
    description ?? null,
    step_order ?? null,
    entry_condition ?? null,
    expected_result ?? null,
    status ?? null,
    req.params.stepId,
    req.params.schemeId
  )
  const step = db.prepare('SELECT * FROM steps WHERE id = ?').get(req.params.stepId)
  res.json(step)
})

router.delete('/schemes/:schemeId/steps/:stepId', (req: Request, res: Response): void => {
  const db = getDb()
  const existing = db.prepare('SELECT id FROM steps WHERE id = ? AND scheme_id = ?').get(req.params.stepId, req.params.schemeId)
  if (!existing) {
    res.status(404).json({ error: 'step not found' })
    return
  }
  db.prepare('DELETE FROM steps WHERE id = ?').run(req.params.stepId)
  res.json({ success: true })
})

export default router

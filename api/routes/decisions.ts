import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { status, decision_type, keyword } = req.query

    const conditions: string[] = []
    const params: Record<string, string> = {}

    if (status) {
      conditions.push('status = @status')
      params.status = String(status)
    }
    if (decision_type) {
      conditions.push('decision_type = @decision_type')
      params.decision_type = String(decision_type)
    }
    if (keyword) {
      conditions.push('topic LIKE @keyword')
      params.keyword = `%${String(keyword)}%`
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const stmt = db.prepare(`SELECT * FROM decisions ${where} ORDER BY created_at DESC`)
    const rows = stmt.all(params)

    res.json({ success: true, data: rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM decisions WHERE id = ?')
    const row = stmt.get(Number(req.params.id))

    if (!row) {
      res.status(404).json({ success: false, error: 'Decision not found' })
      return
    }

    res.json({ success: true, data: row })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT INTO decisions (topic, content, decision_type, vote_result, vote_count, total_voters, publish_start, publish_end, objection, handling_opinion, status)
      VALUES (@topic, @content, @decision_type, @vote_result, @vote_count, @total_voters, @publish_start, @publish_end, @objection, @handling_opinion, @status)
    `)
    const result = stmt.run({
      topic: req.body.topic,
      content: req.body.content ?? '',
      decision_type: req.body.decision_type ?? 'vote',
      vote_result: req.body.vote_result ?? '',
      vote_count: req.body.vote_count ?? 0,
      total_voters: req.body.total_voters ?? 0,
      publish_start: req.body.publish_start ?? '',
      publish_end: req.body.publish_end ?? '',
      objection: req.body.objection ?? '',
      handling_opinion: req.body.handling_opinion ?? '',
      status: req.body.status ?? 'pending',
    })

    const newRow = db.prepare('SELECT * FROM decisions WHERE id = ?').get(result.lastInsertRowid)
    res.json({ success: true, data: newRow })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM decisions WHERE id = ?').get(Number(req.params.id))

    if (!existing) {
      res.status(404).json({ success: false, error: 'Decision not found' })
      return
    }

    const stmt = db.prepare(`
      UPDATE decisions SET
        topic = @topic,
        content = @content,
        decision_type = @decision_type,
        vote_result = @vote_result,
        vote_count = @vote_count,
        total_voters = @total_voters,
        publish_start = @publish_start,
        publish_end = @publish_end,
        objection = @objection,
        handling_opinion = @handling_opinion,
        status = @status,
        updated_at = datetime('now','localtime')
      WHERE id = @id
    `)
    stmt.run({
      id: Number(req.params.id),
      topic: req.body.topic ?? (existing as Record<string, unknown>).topic,
      content: req.body.content ?? (existing as Record<string, unknown>).content,
      decision_type: req.body.decision_type ?? (existing as Record<string, unknown>).decision_type,
      vote_result: req.body.vote_result ?? (existing as Record<string, unknown>).vote_result,
      vote_count: req.body.vote_count ?? (existing as Record<string, unknown>).vote_count,
      total_voters: req.body.total_voters ?? (existing as Record<string, unknown>).total_voters,
      publish_start: req.body.publish_start ?? (existing as Record<string, unknown>).publish_start,
      publish_end: req.body.publish_end ?? (existing as Record<string, unknown>).publish_end,
      objection: req.body.objection ?? (existing as Record<string, unknown>).objection,
      handling_opinion: req.body.handling_opinion ?? (existing as Record<string, unknown>).handling_opinion,
      status: req.body.status ?? (existing as Record<string, unknown>).status,
    })

    const updated = db.prepare('SELECT * FROM decisions WHERE id = ?').get(Number(req.params.id))
    res.json({ success: true, data: updated })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM decisions WHERE id = ?')
    stmt.run(Number(req.params.id))
    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

export default router

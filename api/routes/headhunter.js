import { Router } from 'express'
import { db } from '../database.js'

const router = Router()

router.get('/clients', (req, res) => {
  try {
    const candidates = db.prepare('SELECT * FROM candidates ORDER BY created_at DESC').all()

    const result = candidates.map(c => {
      const communications = db.prepare(
        'SELECT * FROM communications WHERE candidate_id = ? ORDER BY created_at DESC'
      ).all(c.id)

      const followups = db.prepare(
        'SELECT * FROM followups WHERE candidate_id = ? ORDER BY scheduled_at DESC'
      ).all(c.id)

      return { ...c, communications, followups }
    })

    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/communications', (req, res) => {
  try {
    const communications = db.prepare(`
      SELECT c.*, ca.name AS candidate_name, h.name AS headhunter_name
      FROM communications c
      LEFT JOIN candidates ca ON c.candidate_id = ca.id
      LEFT JOIN headhunters h ON c.headhunter_id = h.id
      ORDER BY c.created_at DESC
    `).all()
    res.json(communications)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/communications', (req, res) => {
  try {
    const { headhunter_id, candidate_id, comm_type, content, sentiment } = req.body

    if (!headhunter_id || !candidate_id || !comm_type || !content) {
      return res.status(400).json({ error: 'headhunter_id, candidate_id, comm_type, and content are required' })
    }

    const summary = content.length > 50 ? content.substring(0, 50) + '...' : content

    const result = db.prepare(`
      INSERT INTO communications (headhunter_id, candidate_id, comm_type, content, summary, sentiment)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(headhunter_id, candidate_id, comm_type, content, summary, sentiment || null)

    const communication = db.prepare('SELECT * FROM communications WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(communication)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/followups', (req, res) => {
  try {
    let query = `
      SELECT f.*, ca.name AS candidate_name, j.title AS job_title
      FROM followups f
      LEFT JOIN candidates ca ON f.candidate_id = ca.id
      LEFT JOIN jobs j ON f.job_id = j.id
    `
    let params = []

    if (req.query.status) {
      query += ' WHERE f.status = ?'
      params.push(req.query.status)
    }

    query += ' ORDER BY f.scheduled_at DESC'

    const followups = db.prepare(query).all(...params)
    res.json(followups)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/followups', (req, res) => {
  try {
    const { headhunter_id, candidate_id, job_id, plan_text, scheduled_at, status } = req.body

    if (!headhunter_id || !candidate_id || !plan_text || !scheduled_at) {
      return res.status(400).json({ error: 'headhunter_id, candidate_id, plan_text, and scheduled_at are required' })
    }

    const result = db.prepare(`
      INSERT INTO followups (headhunter_id, candidate_id, job_id, plan_text, scheduled_at, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(headhunter_id, candidate_id, job_id || null, plan_text, scheduled_at, status || 'pending')

    const followup = db.prepare('SELECT * FROM followups WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(followup)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/followups/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM followups WHERE id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Followup not found' })

    const { status } = req.body
    const completed_at = status === 'completed' ? new Date().toISOString() : existing.completed_at

    db.prepare('UPDATE followups SET status = ?, completed_at = ? WHERE id = ?')
      .run(status ?? existing.status, completed_at, req.params.id)

    const followup = db.prepare('SELECT * FROM followups WHERE id = ?').get(req.params.id)
    res.json(followup)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

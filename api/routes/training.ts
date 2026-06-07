import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/scenarios', (req: Request, res: Response): void => {
  try {
    let query = 'SELECT * FROM training_scenarios'
    const params: any[] = []

    if (req.query.category) {
      query += ' WHERE category = ?'
      params.push(req.query.category)
    }

    query += ' ORDER BY id ASC'
    const scenarios = db.prepare(query).all(...params)
    res.json({ success: true, data: scenarios })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/scenarios/:id', (req: Request, res: Response): void => {
  try {
    const scenario = db.prepare('SELECT * FROM training_scenarios WHERE id = ?').get(req.params.id)
    if (!scenario) {
      res.status(404).json({ success: false, error: 'Scenario not found' })
      return
    }

    const recordCount = (db.prepare('SELECT COUNT(*) as count FROM training_records WHERE scenario_id = ?').get(req.params.id) as any).count
    const passCount = (db.prepare('SELECT COUNT(*) as count FROM training_records WHERE scenario_id = ? AND passed = 1').get(req.params.id) as any).count

    res.json({
      success: true,
      data: { ...scenario, stats: { total_attempts: recordCount, pass_count: passCount, pass_rate: recordCount > 0 ? passCount / recordCount : 0 } }
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/scenarios', (req: Request, res: Response): void => {
  try {
    const { title, category, content, difficulty, video_url, pass_score } = req.body
    if (!title || !content) {
      res.status(400).json({ success: false, error: 'title and content are required' })
      return
    }

    const result = db.prepare(
      `INSERT INTO training_scenarios (title, category, content, difficulty, video_url, pass_score) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(title, category || null, content, difficulty || 'easy', video_url || null, pass_score ?? 60)

    const scenario = db.prepare('SELECT * FROM training_scenarios WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: scenario })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/records', (req: Request, res: Response): void => {
  try {
    let query = `SELECT tr.*, r.name as rider_name, ts.title as scenario_title, ts.category as scenario_category
                 FROM training_records tr
                 JOIN riders r ON tr.rider_id = r.id
                 JOIN training_scenarios ts ON tr.scenario_id = ts.id`
    const params: any[] = []

    if (req.query.rider_id) {
      query += ' WHERE tr.rider_id = ?'
      params.push(Number(req.query.rider_id))
    }

    query += ' ORDER BY tr.completed_at DESC'
    const records = db.prepare(query).all(...params)
    res.json({ success: true, data: records })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/records', (req: Request, res: Response): void => {
  try {
    const { rider_id, scenario_id, score, passed } = req.body
    if (!rider_id || !scenario_id) {
      res.status(400).json({ success: false, error: 'rider_id and scenario_id are required' })
      return
    }

    const result = db.prepare(
      `INSERT INTO training_records (rider_id, scenario_id, score, passed) VALUES (?, ?, ?, ?)`
    ).run(rider_id, scenario_id, score ?? 0, passed ?? 0)

    const record = db.prepare('SELECT * FROM training_records WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: record })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router

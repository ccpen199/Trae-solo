import { Router } from 'express'
import { db } from '../database.js'

const router = Router()

router.get('/', (req, res) => {
  try {
    const interviews = db.prepare(`
      SELECT i.*, ca.name AS candidate_name, j.title AS job_title,
        e.technical_skill, e.communication, e.project_experience, e.cultural_fit,
        e.overall_score, e.recommendation, e.detailed_feedback
      FROM interviews i
      LEFT JOIN candidates ca ON i.candidate_id = ca.id
      LEFT JOIN jobs j ON i.job_id = j.id
      LEFT JOIN evaluations e ON e.interview_id = i.id
      ORDER BY i.scheduled_at DESC
    `).all()
    res.json(interviews)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', (req, res) => {
  try {
    const interview = db.prepare(`
      SELECT i.*, ca.name AS candidate_name, j.title AS job_title
      FROM interviews i
      LEFT JOIN candidates ca ON i.candidate_id = ca.id
      LEFT JOIN jobs j ON i.job_id = j.id
      WHERE i.id = ?
    `).get(req.params.id)
    if (!interview) return res.status(404).json({ error: 'Interview not found' })

    const evaluation = db.prepare('SELECT * FROM evaluations WHERE interview_id = ?').get(req.params.id)
    res.json({ ...interview, evaluation: evaluation || null })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', (req, res) => {
  try {
    const { candidate_id, job_id, interviewer_name, interview_type, scheduled_at, status, location, notes } = req.body

    if (!candidate_id || !job_id || !scheduled_at) {
      return res.status(400).json({ error: 'candidate_id, job_id, and scheduled_at are required' })
    }

    const result = db.prepare(`
      INSERT INTO interviews (candidate_id, job_id, interviewer_name, interview_type, scheduled_at, status, location, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      candidate_id, job_id, interviewer_name || null, interview_type || null,
      scheduled_at, status || 'scheduled', location || null, notes || null
    )

    const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(interview)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM interviews WHERE id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Interview not found' })

    const { candidate_id, job_id, interviewer_name, interview_type, scheduled_at,
      status, location, notes, evaluation } = req.body

    db.transaction(() => {
      db.prepare(`
        UPDATE interviews SET candidate_id = ?, job_id = ?, interviewer_name = ?,
          interview_type = ?, scheduled_at = ?, status = ?, location = ?, notes = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `).run(
        candidate_id ?? existing.candidate_id, job_id ?? existing.job_id,
        interviewer_name ?? existing.interviewer_name, interview_type ?? existing.interview_type,
        scheduled_at ?? existing.scheduled_at, status ?? existing.status,
        location ?? existing.location, notes ?? existing.notes, req.params.id
      )

      if (evaluation) {
        const existingEval = db.prepare('SELECT * FROM evaluations WHERE interview_id = ?').get(req.params.id)

        if (existingEval) {
          db.prepare(`
            UPDATE evaluations SET technical_skill = ?, communication = ?, project_experience = ?,
              cultural_fit = ?, overall_score = ?, recommendation = ?, detailed_feedback = ?
            WHERE interview_id = ?
          `).run(
            evaluation.technical_skill ?? existingEval.technical_skill,
            evaluation.communication ?? existingEval.communication,
            evaluation.project_experience ?? existingEval.project_experience,
            evaluation.cultural_fit ?? existingEval.cultural_fit,
            evaluation.overall_score ?? existingEval.overall_score,
            evaluation.recommendation ?? existingEval.recommendation,
            evaluation.detailed_feedback ?? existingEval.detailed_feedback,
            req.params.id
          )
        } else {
          db.prepare(`
            INSERT INTO evaluations (interview_id, technical_skill, communication, project_experience, cultural_fit, overall_score, recommendation, detailed_feedback)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            req.params.id,
            evaluation.technical_skill || 0,
            evaluation.communication || 0,
            evaluation.project_experience || 0,
            evaluation.cultural_fit || 0,
            evaluation.overall_score || 0,
            evaluation.recommendation || null,
            evaluation.detailed_feedback || null
          )
        }
      }
    })()

    const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(req.params.id)
    const evalResult = db.prepare('SELECT * FROM evaluations WHERE interview_id = ?').get(req.params.id)
    res.json({ ...interview, evaluation: evalResult || null })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM interviews WHERE id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Interview not found' })

    const { status, evaluation } = req.body

    if (status) {
      db.prepare('UPDATE interviews SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, req.params.id)
    }

    if (evaluation) {
      const existingEval = db.prepare('SELECT * FROM evaluations WHERE interview_id = ?').get(req.params.id)
      if (existingEval) {
        db.prepare(`
          UPDATE evaluations SET technical_skill = COALESCE(?, technical_skill), communication = COALESCE(?, communication),
            project_experience = COALESCE(?, project_experience), cultural_fit = COALESCE(?, cultural_fit),
            overall_score = COALESCE(?, overall_score), recommendation = COALESCE(?, recommendation),
            detailed_feedback = COALESCE(?, detailed_feedback)
          WHERE interview_id = ?
        `).run(
          evaluation.technical_skill ?? null, evaluation.communication ?? null,
          evaluation.project_experience ?? null, evaluation.cultural_fit ?? null,
          evaluation.overall_score ?? null, evaluation.recommendation ?? null,
          evaluation.detailed_feedback ?? null, req.params.id
        )
      } else {
        db.prepare(`
          INSERT INTO evaluations (interview_id, technical_skill, communication, project_experience, cultural_fit, overall_score, recommendation, detailed_feedback)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          req.params.id,
          evaluation.technical_skill || 0,
          evaluation.communication || 0,
          evaluation.project_experience || 0,
          evaluation.cultural_fit || 0,
          evaluation.overall_score || 0,
          evaluation.recommendation || null,
          evaluation.detailed_feedback || null
        )
      }
    }

    const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(req.params.id)
    const evalResult = db.prepare('SELECT * FROM evaluations WHERE interview_id = ?').get(req.params.id)
    res.json({ ...interview, evaluation: evalResult || null })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

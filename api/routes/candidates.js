import { Router } from 'express'
import { db } from '../database.js'
import { matchCandidateToJobs } from '../services/matching.js'

const router = Router()

router.get('/', (req, res) => {
  try {
    const { search, industry, career_level, job_status, page = 1, limit = 20 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    let where = []
    let params = []

    if (search) {
      where.push('(name LIKE ? OR current_title LIKE ? OR current_company LIKE ?)')
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    if (industry) {
      where.push('industry = ?')
      params.push(industry)
    }
    if (career_level) {
      where.push('career_level = ?')
      params.push(career_level)
    }
    if (job_status) {
      where.push('job_status = ?')
      params.push(job_status)
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : ''

    const total = db.prepare(
      `SELECT COUNT(*) AS count FROM candidates ${whereClause}`
    ).get(...params).count

    const items = db.prepare(
      `SELECT * FROM candidates ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, Number(limit), offset)

    res.json({ items, total, page: Number(page), limit: Number(limit) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', (req, res) => {
  try {
    const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id)
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' })

    const skills = db.prepare('SELECT * FROM candidate_skills WHERE candidate_id = ?').all(req.params.id)
    const projects = db.prepare('SELECT * FROM candidate_projects WHERE candidate_id = ?').all(req.params.id)

    res.json({ ...candidate, skills, projects })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', (req, res) => {
  try {
    const { name, email, phone, current_title, current_company, industry, experience_years,
      career_level, expected_salary_min, expected_salary_max, education, location,
      job_status, skills_vector, summary, privacy_mode, skills, projects } = req.body

    if (!name) return res.status(400).json({ error: 'name is required' })

    const insertCandidate = db.prepare(`
      INSERT INTO candidates (name, email, phone, current_title, current_company, industry,
        experience_years, career_level, expected_salary_min, expected_salary_max, education,
        location, job_status, skills_vector, summary, privacy_mode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const result = db.transaction(() => {
      const r = insertCandidate.run(
        name, email || null, phone || null, current_title || null, current_company || null,
        industry || null, experience_years || 0, career_level || null,
        expected_salary_min || null, expected_salary_max || null, education || null,
        location || null, job_status || 'open', skills_vector || null,
        summary || null, privacy_mode || 'normal'
      )

      const candidateId = r.lastInsertRowid

      if (Array.isArray(skills)) {
        const insertSkill = db.prepare(`
          INSERT INTO candidate_skills (candidate_id, skill_name, category, proficiency, years_used, weight)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        for (const s of skills) {
          insertSkill.run(candidateId, s.skill_name, s.category || null, s.proficiency || 3, s.years_used || 0, s.weight || 1.0)
        }
      }

      if (Array.isArray(projects)) {
        const insertProject = db.prepare(`
          INSERT INTO candidate_projects (candidate_id, project_name, role, tech_stack, start_date, end_date, description, quantified_outcome, revenue_impact, efficiency_gain)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        for (const p of projects) {
          insertProject.run(candidateId, p.project_name, p.role || null, p.tech_stack || null,
            p.start_date || null, p.end_date || null, p.description || null,
            p.quantified_outcome || null, p.revenue_impact || null, p.efficiency_gain || null)
        }
      }

      return candidateId
    })()

    const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(result)
    res.status(201).json(candidate)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Candidate not found' })

    const { name, email, phone, current_title, current_company, industry, experience_years,
      career_level, expected_salary_min, expected_salary_max, education, location,
      job_status, skills_vector, summary, privacy_mode, skills, projects } = req.body

    db.transaction(() => {
      db.prepare(`
        UPDATE candidates SET name = ?, email = ?, phone = ?, current_title = ?, current_company = ?,
          industry = ?, experience_years = ?, career_level = ?, expected_salary_min = ?,
          expected_salary_max = ?, education = ?, location = ?, job_status = ?, skills_vector = ?,
          summary = ?, privacy_mode = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(
        name ?? existing.name, email ?? existing.email, phone ?? existing.phone,
        current_title ?? existing.current_title, current_company ?? existing.current_company,
        industry ?? existing.industry, experience_years ?? existing.experience_years,
        career_level ?? existing.career_level, expected_salary_min ?? existing.expected_salary_min,
        expected_salary_max ?? existing.expected_salary_max, education ?? existing.education,
        location ?? existing.location, job_status ?? existing.job_status,
        skills_vector ?? existing.skills_vector, summary ?? existing.summary,
        privacy_mode ?? existing.privacy_mode, req.params.id
      )

      if (Array.isArray(skills)) {
        db.prepare('DELETE FROM candidate_skills WHERE candidate_id = ?').run(req.params.id)
        const insertSkill = db.prepare(`
          INSERT INTO candidate_skills (candidate_id, skill_name, category, proficiency, years_used, weight)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        for (const s of skills) {
          insertSkill.run(req.params.id, s.skill_name, s.category || null, s.proficiency || 3, s.years_used || 0, s.weight || 1.0)
        }
      }

      if (Array.isArray(projects)) {
        db.prepare('DELETE FROM candidate_projects WHERE candidate_id = ?').run(req.params.id)
        const insertProject = db.prepare(`
          INSERT INTO candidate_projects (candidate_id, project_name, role, tech_stack, start_date, end_date, description, quantified_outcome, revenue_impact, efficiency_gain)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        for (const p of projects) {
          insertProject.run(req.params.id, p.project_name, p.role || null, p.tech_stack || null,
            p.start_date || null, p.end_date || null, p.description || null,
            p.quantified_outcome || null, p.revenue_impact || null, p.efficiency_gain || null)
        }
      }
    })()

    const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id)
    res.json(candidate)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM candidates WHERE id = ?').run(req.params.id)
    if (result.changes === 0) return res.status(404).json({ error: 'Candidate not found' })
    res.json({ message: 'Candidate deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id/matches', (req, res) => {
  try {
    const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id)
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' })

    const results = matchCandidateToJobs(Number(req.params.id))
    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

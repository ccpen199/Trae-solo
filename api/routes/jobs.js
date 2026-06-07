import { Router } from 'express'
import { db } from '../database.js'
import { matchJobToCandidates } from '../services/matching.js'

const router = Router()

router.get('/', (req, res) => {
  try {
    const { search, industry, status, function_type, page = 1, limit = 20 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    let where = []
    let params = []

    if (search) {
      where.push('(j.title LIKE ? OR e.name LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }
    if (industry) {
      where.push('j.industry = ?')
      params.push(industry)
    }
    if (status) {
      where.push('j.status = ?')
      params.push(status)
    }
    if (function_type) {
      where.push('j.function_type = ?')
      params.push(function_type)
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : ''

    const total = db.prepare(
      `SELECT COUNT(*) AS count FROM jobs j LEFT JOIN enterprises e ON j.enterprise_id = e.id ${whereClause}`
    ).get(...params).count

    const items = db.prepare(`
      SELECT j.*, e.name AS enterprise_name
      FROM jobs j
      LEFT JOIN enterprises e ON j.enterprise_id = e.id
      ${whereClause}
      ORDER BY j.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset)

    res.json({ items, total, page: Number(page), limit: Number(limit) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id', (req, res) => {
  try {
    const job = db.prepare(`
      SELECT j.*, e.name AS enterprise_name, e.industry AS enterprise_industry, e.scale, e.location AS enterprise_location
      FROM jobs j
      LEFT JOIN enterprises e ON j.enterprise_id = e.id
      WHERE j.id = ?
    `).get(req.params.id)
    if (!job) return res.status(404).json({ error: 'Job not found' })
    res.json(job)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', (req, res) => {
  try {
    const { enterprise_id, title, department, industry, function_type, required_level,
      min_experience_years, salary_min, salary_max, location, tech_stack, description,
      requirements, benefits, deadline } = req.body

    if (!enterprise_id || !title) return res.status(400).json({ error: 'enterprise_id and title are required' })

    const result = db.prepare(`
      INSERT INTO jobs (enterprise_id, title, department, industry, function_type, required_level,
        min_experience_years, salary_min, salary_max, location, tech_stack, description,
        requirements, benefits, deadline)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      enterprise_id, title, department || null, industry || null, function_type || null,
      required_level || null, min_experience_years || 0, salary_min || null,
      salary_max || null, location || null, tech_stack || null, description || null,
      requirements || null, benefits || null, deadline || null
    )

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(job)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Job not found' })

    const { enterprise_id, title, department, industry, function_type, required_level,
      min_experience_years, salary_min, salary_max, location, tech_stack, description,
      requirements, benefits, deadline, status } = req.body

    db.prepare(`
      UPDATE jobs SET enterprise_id = ?, title = ?, department = ?, industry = ?,
        function_type = ?, required_level = ?, min_experience_years = ?, salary_min = ?,
        salary_max = ?, location = ?, tech_stack = ?, description = ?, requirements = ?,
        benefits = ?, deadline = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      enterprise_id ?? existing.enterprise_id, title ?? existing.title,
      department ?? existing.department, industry ?? existing.industry,
      function_type ?? existing.function_type, required_level ?? existing.required_level,
      min_experience_years ?? existing.min_experience_years, salary_min ?? existing.salary_min,
      salary_max ?? existing.salary_max, location ?? existing.location,
      tech_stack ?? existing.tech_stack, description ?? existing.description,
      requirements ?? existing.requirements, benefits ?? existing.benefits,
      deadline ?? existing.deadline, status ?? existing.status, req.params.id
    )

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id)
    res.json(job)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id)
    if (result.changes === 0) return res.status(404).json({ error: 'Job not found' })
    res.json({ message: 'Job deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:id/status', (req, res) => {
  try {
    const { status } = req.body
    if (!status) return res.status(400).json({ error: 'status is required' })

    const existing = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Job not found' })

    const published_at = status === 'published' ? new Date().toISOString() : existing.published_at
    db.prepare('UPDATE jobs SET status = ?, published_at = ?, updated_at = datetime(\'now\') WHERE id = ?')
      .run(status, published_at, req.params.id)

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id)
    res.json(job)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id/matches', (req, res) => {
  try {
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id)
    if (!job) return res.status(404).json({ error: 'Job not found' })

    const results = matchJobToCandidates(Number(req.params.id))
    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

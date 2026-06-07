import { Router } from 'express'
import { db } from '../database.js'

const router = Router()

router.get('/enterprises', (req, res) => {
  try {
    const enterprises = db.prepare('SELECT * FROM enterprises ORDER BY created_at DESC').all()
    res.json(enterprises)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/enterprises/:id/credit', (req, res) => {
  try {
    const { credit_score, credit_level, action_type, score_change, reason } = req.body

    const existing = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Enterprise not found' })

    db.transaction(() => {
      db.prepare(`
        UPDATE enterprises SET credit_score = ?, credit_level = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(credit_score ?? existing.credit_score, credit_level ?? existing.credit_level, req.params.id)

      if (action_type) {
        db.prepare(`
          INSERT INTO credit_records (enterprise_id, action_type, score_change, reason)
          VALUES (?, ?, ?, ?)
        `).run(req.params.id, action_type, score_change || 0, reason || null)
      }
    })()

    const enterprise = db.prepare('SELECT * FROM enterprises WHERE id = ?').get(req.params.id)
    res.json(enterprise)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/privacy-rules', (req, res) => {
  try {
    const rules = db.prepare('SELECT * FROM privacy_rules ORDER BY id').all()
    res.json(rules)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/privacy-rules', (req, res) => {
  try {
    const { rules } = req.body
    if (!Array.isArray(rules)) return res.status(400).json({ error: 'rules array is required' })

    db.transaction(() => {
      const update = db.prepare('UPDATE privacy_rules SET enabled = ? WHERE id = ?')
      for (const rule of rules) {
        if (rule.id != null && rule.enabled != null) {
          update.run(rule.enabled ? 1 : 0, rule.id)
        }
      }
    })()

    const updated = db.prepare('SELECT * FROM privacy_rules ORDER BY id').all()
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/ai-datasets', (req, res) => {
  try {
    const datasets = db.prepare('SELECT * FROM ai_datasets ORDER BY created_at DESC').all()
    res.json(datasets)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/ai-datasets', (req, res) => {
  try {
    const { name, description, category, record_count, quality_score, status, data_scope } = req.body

    if (!name) return res.status(400).json({ error: 'name is required' })

    const result = db.prepare(`
      INSERT INTO ai_datasets (name, description, category, record_count, quality_score, status, data_scope)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, description || null, category || null, record_count || 0, quality_score || 0, status || 'active', data_scope || null)

    const dataset = db.prepare('SELECT * FROM ai_datasets WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(dataset)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/ai-datasets/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM ai_datasets WHERE id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Dataset not found' })

    const { name, description, category, record_count, quality_score, status, data_scope } = req.body

    db.prepare(`
      UPDATE ai_datasets SET name = ?, description = ?, category = ?, record_count = ?,
        quality_score = ?, status = ?, data_scope = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name ?? existing.name, description ?? existing.description, category ?? existing.category,
      record_count ?? existing.record_count, quality_score ?? existing.quality_score,
      status ?? existing.status, data_scope ?? existing.data_scope, req.params.id
    )

    const dataset = db.prepare('SELECT * FROM ai_datasets WHERE id = ?').get(req.params.id)
    res.json(dataset)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/salary-benchmarks', (req, res) => {
  try {
    const { industry, function_type, career_level, location } = req.query

    let where = []
    let params = []

    if (industry) { where.push('industry = ?'); params.push(industry) }
    if (function_type) { where.push('function_type = ?'); params.push(function_type) }
    if (career_level) { where.push('career_level = ?'); params.push(career_level) }
    if (location) { where.push('location = ?'); params.push(location) }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : ''

    const benchmarks = db.prepare(
      `SELECT * FROM salary_benchmarks ${whereClause} ORDER BY id`
    ).all(...params)

    res.json(benchmarks)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/salary-benchmarks', (req, res) => {
  try {
    const { industry, function_type, career_level, location, p25, p50, p75, p90, effective_date, source } = req.body

    if (!industry || !function_type || !career_level) {
      return res.status(400).json({ error: 'industry, function_type, and career_level are required' })
    }

    const result = db.prepare(`
      INSERT INTO salary_benchmarks (industry, function_type, career_level, location, p25, p50, p75, p90, effective_date, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      industry, function_type, career_level, location || null,
      p25 || null, p50 || null, p75 || null, p90 || null,
      effective_date || null, source || null
    )

    const benchmark = db.prepare('SELECT * FROM salary_benchmarks WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(benchmark)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.put('/salary-benchmarks/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM salary_benchmarks WHERE id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Benchmark not found' })

    const { industry, function_type, career_level, location, p25, p50, p75, p90, effective_date, source } = req.body

    db.prepare(`
      UPDATE salary_benchmarks SET industry = ?, function_type = ?, career_level = ?,
        location = ?, p25 = ?, p50 = ?, p75 = ?, p90 = ?, effective_date = ?, source = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      industry ?? existing.industry, function_type ?? existing.function_type,
      career_level ?? existing.career_level, location ?? existing.location,
      p25 ?? existing.p25, p50 ?? existing.p50, p75 ?? existing.p75, p90 ?? existing.p90,
      effective_date ?? existing.effective_date, source ?? existing.source, req.params.id
    )

    const benchmark = db.prepare('SELECT * FROM salary_benchmarks WHERE id = ?').get(req.params.id)
    res.json(benchmark)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

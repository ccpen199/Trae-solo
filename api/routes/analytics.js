import { Router } from 'express'
import { db } from '../database.js'

const router = Router()

router.get('/funnel', (req, res) => {
  try {
    const { jobId } = req.query

    if (jobId) {
      const stages = db.prepare(
        'SELECT * FROM funnel_stages WHERE job_id = ? ORDER BY id'
      ).all(jobId)
      return res.json(stages)
    }

    const stages = db.prepare(`
      SELECT fs.*, j.title AS job_title
      FROM funnel_stages fs
      LEFT JOIN jobs j ON fs.job_id = j.id
      ORDER BY j.id, fs.id
    `).all()
    res.json(stages)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/conversion', (req, res) => {
  try {
    const stages = db.prepare(`
      SELECT stage_name, AVG(conversion_rate) AS avg_conversion_rate, AVG(avg_days_in_stage) AS avg_days
      FROM funnel_stages
      GROUP BY stage_name
      ORDER BY MIN(id)
    `).all()

    const totalCandidates = db.prepare(
      "SELECT SUM(candidate_count) AS total FROM funnel_stages WHERE stage_name = '职位发布'"
    ).get().total || 0

    const totalHired = db.prepare(
      "SELECT SUM(candidate_count) AS total FROM funnel_stages WHERE stage_name = '入职确认'"
    ).get().total || 0

    const overallConversion = totalCandidates > 0 ? (totalHired / totalCandidates) * 100 : 0

    res.json({
      stages,
      overall_conversion_rate: Math.round(overallConversion * 100) / 100,
      total_candidates: totalCandidates,
      total_hired: totalHired
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/attribution', (req, res) => {
  try {
    const rows = db.prepare(
      "SELECT stage_name, drop_reason FROM funnel_stages WHERE drop_reason IS NOT NULL AND drop_reason != ''"
    ).all()

    const dropReasons = []
    for (const row of rows) {
      const reasons = row.drop_reason.split(',').map(r => r.trim()).filter(Boolean)
      for (const reason of reasons) {
        const match = reason.match(/^(.+?)(\d+)%$/)
        if (match) {
          dropReasons.push({
            stage_name: row.stage_name,
            reason: match[1].trim(),
            percentage: Number(match[2])
          })
        }
      }
    }

    const aggregated = {}
    for (const d of dropReasons) {
      const key = d.reason
      if (!aggregated[key]) {
        aggregated[key] = { reason: key, total_percentage: 0, stages: [] }
      }
      aggregated[key].total_percentage += d.percentage
      if (!aggregated[key].stages.includes(d.stage_name)) {
        aggregated[key].stages.push(d.stage_name)
      }
    }

    const result = Object.values(aggregated).sort((a, b) => b.total_percentage - a.total_percentage)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

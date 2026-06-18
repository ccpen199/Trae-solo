import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db/database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { field, status, search, q } = req.query
  const searchTerm = search || q
  let sql = 'SELECT * FROM jobs WHERE 1=1'
  const params: any[] = []

  if (field) {
    sql += ' AND field = ?'
    params.push(field)
  }
  if (status) {
    sql += ' AND status = ?'
    params.push(status)
  }
  if (searchTerm) {
    sql += ' AND (title LIKE ? OR company LIKE ?)'
    params.push(`%${searchTerm}%`, `%${searchTerm}%`)
  }

  sql += ' ORDER BY created_at DESC'

  const jobs = db.prepare(sql).all(...params) as any[]

  const result = jobs.map(j => {
    const skillCount = db.prepare('SELECT COUNT(*) as count FROM skill_requirements WHERE job_id = ?').get(j.id) as any
    const constraintCount = db.prepare('SELECT COUNT(*) as count FROM hard_constraints WHERE job_id = ?').get(j.id) as any
    return {
      ...j,
      skill_requirement_count: skillCount.count,
      hard_constraint_count: constraintCount.count,
    }
  })

  res.json({ success: true, data: result })
})

router.get('/:id', (req: Request, res: Response): void => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id) as any
  if (!job) {
    res.status(404).json({ success: false, error: '职位不存在' })
    return
  }

  const skillRequirements = db.prepare('SELECT * FROM skill_requirements WHERE job_id = ?').all(job.id)
  const hardConstraints = db.prepare('SELECT * FROM hard_constraints WHERE job_id = ?').all(job.id)
  const funnel = db.prepare('SELECT * FROM funnel_data WHERE job_id = ?').get(job.id)

  res.json({
    success: true,
    data: {
      ...job,
      skill_requirements: skillRequirements,
      hard_constraints: hardConstraints,
      funnel,
    },
  })
})

router.post('/', (req: Request, res: Response): void => {
  const id = uuidv4()
  const { title, company, field, location, salary_min, salary_max, description, status,
    requiredSkills, hardConstraints, skillRequirements } = req.body
  const salaryMin = salary_min
  const salaryMax = salary_max

  try {
    db.prepare(`
      INSERT INTO jobs (id, title, company, field, location, salary_min, salary_max, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, company, field, location, salaryMin, salaryMax, description, status || '草稿')

    const skills = requiredSkills || skillRequirements || []
    for (const s of skills) {
      const srId = uuidv4()
      db.prepare('INSERT INTO skill_requirements (id, job_id, name, category, required, preferred_level) VALUES (?, ?, ?, ?, ?, ?)')
        .run(srId, id, s.name, s.category, s.required ? 1 : 0, s.preferredLevel || s.preferred_level || '中级')
    }

    const constraints = hardConstraints || []
    for (const c of constraints) {
      const hcId = uuidv4()
      db.prepare('INSERT INTO hard_constraints (id, job_id, type, value, required) VALUES (?, ?, ?, ?, ?)')
        .run(hcId, id, c.type, c.value, c.required ? 1 : 0)
    }

    db.prepare('INSERT INTO funnel_data (id, job_id, total_resumes, screened, interviewed, offered) VALUES (?, ?, 0, 0, 0, 0)')
      .run(uuidv4(), id)

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id)
    res.status(201).json({ success: true, data: job })
  } catch (err: any) {
    res.status(500).json({ success: false, error: '创建失败' })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id) as any
  if (!job) {
    res.status(404).json({ success: false, error: '职位不存在' })
    return
  }

  const { title, company, field, location, salary_min, salary_max, description, status } = req.body

  try {
    db.prepare(`
      UPDATE jobs SET title = ?, company = ?, field = ?, location = ?, salary_min = ?, salary_max = ?, description = ?, status = ?
      WHERE id = ?
    `).run(
      title ?? job.title,
      company ?? job.company,
      field ?? job.field,
      location ?? job.location,
      salary_min ?? job.salary_min,
      salary_max ?? job.salary_max,
      description ?? job.description,
      status ?? job.status,
      req.params.id
    )

    const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: '更新失败' })
  }
})

router.get('/:id/candidates', (req: Request, res: Response): void => {
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id) as any
  if (!job) {
    res.status(404).json({ success: false, error: '职位不存在' })
    return
  }

  const matches = db.prepare(`
    SELECT m.*, t.name, t.current_company, t.field, t.location
    FROM match_results m
    JOIN talents t ON m.talent_id = t.id
    WHERE m.job_id = ?
    ORDER BY m.overall_score DESC
  `).all(req.params.id) as any[]

  const result = matches.map(m => ({
    id: m.id,
    talentId: m.talent_id,
    jobId: m.job_id,
    talentName: m.name,
    talentField: m.field,
    talentLocation: m.location,
    talentCompany: m.current_company,
    overallScore: Math.round(m.overall_score * 100),
    semanticScore: Math.round(m.semantic_score * 100),
    networkScore: Math.round(m.network_score * 100),
    regionScore: Math.round(m.region_score * 100),
  }))

  res.json({ success: true, data: result })
})

export default router

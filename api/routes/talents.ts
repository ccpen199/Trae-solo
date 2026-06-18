import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db/database.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { field, location, search, page, pageSize } = req.query
  let sql = 'SELECT * FROM talents WHERE 1=1'
  const params: any[] = []

  if (field) {
    sql += ' AND field = ?'
    params.push(field)
  }
  if (location) {
    sql += ' AND location = ?'
    params.push(location)
  }
  if (search) {
    sql += ' AND (name LIKE ? OR current_company LIKE ? OR email LIKE ?)'
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }

  sql += ' ORDER BY created_at DESC'

  const pageNum = parseInt(page as string) || 1
  const size = parseInt(pageSize as string) || 12
  const offset = (pageNum - 1) * size
  sql += ' LIMIT ? OFFSET ?'
  params.push(size, offset)

  const talents = db.prepare(sql).all(...params) as any[]

  const result = talents.map(t => {
    const skills = db.prepare('SELECT * FROM skills WHERE talent_id = ?').all(t.id)
    return {
      ...t,
      alumni_network: JSON.parse(t.alumni_network || '[]'),
      previous_companies: JSON.parse(t.previous_companies || '[]'),
      skills,
    }
  })

  res.json({ success: true, data: result })
})

router.get('/:id', (req: Request, res: Response): void => {
  const talent = db.prepare('SELECT * FROM talents WHERE id = ?').get(req.params.id) as any
  if (!talent) {
    res.status(404).json({ success: false, error: '人才不存在' })
    return
  }

  const skills = db.prepare('SELECT * FROM skills WHERE talent_id = ?').all(talent.id)
  const certifications = db.prepare('SELECT * FROM certifications WHERE talent_id = ?').all(talent.id)
  const projects = db.prepare('SELECT * FROM project_experiences WHERE talent_id = ?').all(talent.id) as any[]

  const result = {
    ...talent,
    alumni_network: JSON.parse(talent.alumni_network || '[]'),
    previous_companies: JSON.parse(talent.previous_companies || '[]'),
    skills,
    certifications,
    project_experiences: projects.map(p => ({
      ...p,
      skills: JSON.parse(p.skills || '[]'),
    })),
  }

  res.json({ success: true, data: result })
})

router.post('/', (req: Request, res: Response): void => {
  const id = uuidv4()
  const { name, email, phone, current_company, experience, field, location, alumni_network, previous_companies } = req.body

  try {
    db.prepare(`
      INSERT INTO talents (id, name, email, phone, current_company, experience, field, location, alumni_network, previous_companies)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, email, phone, current_company, experience || 0, field, location,
      JSON.stringify(alumni_network || []),
      JSON.stringify(previous_companies || [])
    )

    const talent = db.prepare('SELECT * FROM talents WHERE id = ?').get(id) as any
    res.status(201).json({
      success: true,
      data: {
        ...talent,
        alumni_network: JSON.parse(talent.alumni_network || '[]'),
        previous_companies: JSON.parse(talent.previous_companies || '[]'),
      },
    })
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) {
      res.status(400).json({ success: false, error: '邮箱已存在' })
      return
    }
    res.status(500).json({ success: false, error: '创建失败' })
  }
})

router.get('/:id/gap-analysis', (req: Request, res: Response): void => {
  const { id } = req.params
  const { jobId } = req.query

  if (!jobId) {
    res.status(400).json({ success: false, error: '缺少jobId参数' })
    return
  }

  const talent = db.prepare('SELECT * FROM talents WHERE id = ?').get(id) as any
  if (!talent) {
    res.status(404).json({ success: false, error: '人才不存在' })
    return
  }

  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as any
  if (!job) {
    res.status(404).json({ success: false, error: '职位不存在' })
    return
  }

  const talentSkills = db.prepare('SELECT name, category, level FROM skills WHERE talent_id = ?').all(id) as any[]
  const jobRequirements = db.prepare('SELECT name, category, required, preferred_level FROM skill_requirements WHERE job_id = ?').all(jobId) as any[]

  const talentSkillNames = new Set(talentSkills.map(s => s.name))
  const levelRank: Record<string, number> = { '初级': 1, '中级': 2, '高级': 3, '专家': 4 }

  const matched: any[] = []
  const unmatched: any[] = []
  const gapItems: any[] = []

  for (const req of jobRequirements) {
    if (talentSkillNames.has(req.name)) {
      const ts = talentSkills.find(s => s.name === req.name)
      matched.push({
        skill: req.name,
        category: req.category,
        required: req.required,
        preferred_level: req.preferred_level,
        current_level: ts?.level,
        level_met: (levelRank[ts?.level] || 0) >= (levelRank[req.preferred_level] || 0),
      })
    } else {
      unmatched.push({
        skill: req.name,
        category: req.category,
        required: req.required,
        preferred_level: req.preferred_level,
      })
    }
  }

  for (const m of matched) {
    if (!m.level_met) {
      gapItems.push({
        skill: m.skill,
        category: m.category,
        preferred_level: m.preferred_level,
        current_level: m.current_level,
        gap: `${m.current_level} → ${m.preferred_level}`,
      })
    }
  }

  for (const u of unmatched) {
    if (u.required) {
      gapItems.push({
        skill: u.skill,
        category: u.category,
        preferred_level: u.preferred_level,
        current_level: null,
        gap: `缺失 → ${u.preferred_level}`,
      })
    }
  }

  const totalRequired = jobRequirements.filter(r => r.required).length
  const matchedRequired = matched.filter(m => m.required && m.level_met).length
  const coverageRate = totalRequired > 0 ? matchedRequired / totalRequired : 0

  res.json({
    success: true,
    data: {
      talent_id: id,
      job_id: jobId,
      matched,
      unmatched,
      gap_items: gapItems,
      coverage_rate: Math.round(coverageRate * 100) / 100,
    },
  })
})

export default router

import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, status, org_id, keyword, page = '1', pageSize = '10' } = req.query
    const db = getDb()

    let sql = `SELECT j.*, o.name as org_name FROM jobs j LEFT JOIN organizations o ON j.org_id = o.id WHERE 1=1`
    const params: any[] = []

    if (type) {
      sql += ` AND j.type = ?`
      params.push(normalizeJobType(String(type)))
    }
    if (status && status !== 'all') {
      sql += ` AND j.status = ?`
      params.push(status)
    }
    if (org_id) {
      sql += ` AND j.org_id = ?`
      params.push(org_id)
    }
    if (keyword) {
      sql += ` AND (j.title LIKE ? OR j.description LIKE ? OR o.name LIKE ?)`
      const like = `%${String(keyword)}%`
      params.push(like, like, like)
    }

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM (${sql})`).get(...params) as { total: number }
    const total = countResult.total

    const offset = (Number(page) - 1) * Number(pageSize)
    sql += ` ORDER BY j.created_at DESC LIMIT ? OFFSET ?`
    params.push(Number(pageSize), offset)

    const jobs = db.prepare(sql).all(...params) as any[]

    for (const job of jobs) {
      job.requirements = JSON.parse(job.requirements || '{}')
      const appStats = db.prepare(`
        SELECT
          COUNT(*) as count,
          COALESCE(SUM(CASE WHEN status = 'shortlisted' THEN 1 ELSE 0 END), 0) as shortlisted,
          COALESCE(SUM(CASE WHEN status = 'interviewed' THEN 1 ELSE 0 END), 0) as interviewed,
          MAX(created_at) as latest_application_at
        FROM applications
        WHERE job_id = ?
      `).get(job.id) as { count: number; shortlisted: number; interviewed: number; latest_application_at: string | null }
      const headcount = Number(job.headcount || 0)
      job.application_count = appStats.count
      job.shortlisted_count = appStats.shortlisted
      job.interviewed_count = appStats.interviewed
      job.match_progress = headcount > 0 ? Math.min(100, Math.round((appStats.count / headcount) * 100)) : 0
      job.latest_application_at = appStats.latest_application_at
    }

    res.json({
      success: true,
      data: {
        items: jobs,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取岗位列表失败' })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, type, description, requirements, salary_min, salary_max, org_id, status, settlement_cycle, headcount } = req.body

    if (!title || !type) {
      res.status(400).json({ success: false, error: '岗位名称和类型不能为空' })
      return
    }

    const db = getDb()
    const result = db.prepare(
      `INSERT INTO jobs (title, type, description, requirements, salary_min, salary_max, org_id, status, settlement_cycle, headcount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(title, normalizeJobType(String(type)), description || '', JSON.stringify(requirements || {}), salary_min, salary_max, org_id, status || 'draft', settlement_cycle, headcount)

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid) as any
    if (job) job.requirements = JSON.parse(job.requirements || '{}')

    res.status(201).json({ success: true, data: job })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建岗位失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const job = db.prepare(`SELECT j.*, o.name as org_name FROM jobs j LEFT JOIN organizations o ON j.org_id = o.id WHERE j.id = ?`).get(req.params.id) as any

    if (!job) {
      res.status(404).json({ success: false, error: '岗位不存在' })
      return
    }

    job.requirements = JSON.parse(job.requirements || '{}')

    const appCount = db.prepare('SELECT COUNT(*) as count FROM applications WHERE job_id = ?').get(job.id) as { count: number }
    job.application_count = appCount.count

    res.json({ success: true, data: job })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取岗位详情失败' })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '岗位不存在' })
      return
    }

    const { title, type, description, requirements, salary_min, salary_max, org_id, status, settlement_cycle, headcount } = req.body

    db.prepare(
      `UPDATE jobs SET title = ?, type = ?, description = ?, requirements = ?, salary_min = ?, salary_max = ?, org_id = ?, status = ?, settlement_cycle = ?, headcount = ? WHERE id = ?`
    ).run(
      title || existing.title,
      type ? normalizeJobType(String(type)) : existing.type,
      description !== undefined ? description : existing.description,
      requirements ? JSON.stringify(requirements) : existing.requirements,
      salary_min !== undefined ? salary_min : existing.salary_min,
      salary_max !== undefined ? salary_max : existing.salary_max,
      org_id !== undefined ? org_id : existing.org_id,
      status || existing.status,
      settlement_cycle || existing.settlement_cycle,
      headcount !== undefined ? headcount : existing.headcount,
      req.params.id
    )

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id) as any
    if (job) job.requirements = JSON.parse(job.requirements || '{}')

    res.json({ success: true, data: job })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新岗位失败' })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '岗位不存在' })
      return
    }

    db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id)
    res.json({ success: true, data: { message: '岗位已删除' } })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除岗位失败' })
  }
})

router.get('/:id/matches', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id) as any
    if (!job) {
      res.status(404).json({ success: false, error: '岗位不存在' })
      return
    }

    const requirements = JSON.parse(job.requirements || '{}')
    const requiredSkills: string[] = requirements.skills || []

    const students = db.prepare(`
      SELECT sp.*, u.name, u.email, u.credit_score, u.avatar
      FROM student_profiles sp
      JOIN users u ON sp.user_id = u.id
    `).all() as any[]

    const scored = students.map(student => {
      const studentSkills: string[] = JSON.parse(student.skills || '[]')
      const studentCerts: string[] = JSON.parse(student.certificates || '[]')

      let skillMatch = 0
      if (requiredSkills.length > 0) {
        const overlap = requiredSkills.filter(s => studentSkills.includes(s) || studentCerts.includes(s))
        skillMatch = overlap.length / requiredSkills.length
      }

      const ratingScore = student.rating / 5.0
      const creditScore = student.credit_score / 100.0

      const matchScore = Math.round((skillMatch * 0.6 + ratingScore * 0.25 + creditScore * 0.15) * 100)

      return {
        ...student,
        skills: studentSkills,
        certificates: studentCerts,
        matchScore,
        match_score: matchScore,
        matchedSkills: requiredSkills.filter(s => studentSkills.includes(s) || studentCerts.includes(s)),
        matched_skills: requiredSkills.filter(s => studentSkills.includes(s) || studentCerts.includes(s))
      }
    })

    scored.sort((a, b) => b.matchScore - a.matchScore)

    const { page = '1', pageSize = '10' } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)
    const paged = scored.slice(offset, offset + Number(pageSize))

    res.json({
      success: true,
      data: {
        items: paged,
        total: scored.length,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取匹配学生失败' })
  }
})

export default router

function normalizeJobType(type: string): string {
  return type === 'online' ? 'online_task' : type
}

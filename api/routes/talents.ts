import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { university, major, grade, skill, page = '1', pageSize = '10' } = req.query
    const db = getDb()

    let sql = `SELECT sp.*, u.name, u.email, u.credit_score, u.avatar, u.org_id FROM student_profiles sp JOIN users u ON sp.user_id = u.id WHERE 1=1`
    const params: any[] = []

    if (university) {
      sql += ` AND sp.university LIKE ?`
      params.push(`%${university}%`)
    }
    if (major) {
      sql += ` AND sp.major LIKE ?`
      params.push(`%${major}%`)
    }
    if (grade) {
      sql += ` AND sp.grade = ?`
      params.push(grade)
    }

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM (${sql})`).get(...params) as { total: number }
    const total = countResult.total

    const offset = (Number(page) - 1) * Number(pageSize)
    sql += ` ORDER BY sp.rating DESC LIMIT ? OFFSET ?`
    params.push(Number(pageSize), offset)

    const students = db.prepare(sql).all(...params) as any[]

    let filtered = students
    if (skill) {
      filtered = students.filter(s => {
        const skills: string[] = JSON.parse(s.skills || '[]')
        return skills.includes(String(skill))
      })
    }

    for (const s of filtered) {
      s.skills = JSON.parse(s.skills || '[]')
      s.certificates = JSON.parse(s.certificates || '[]')
    }

    res.json({
      success: true,
      data: {
        items: filtered,
        total: skill ? filtered.length : total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取学生列表失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const student = db.prepare(`
      SELECT sp.*, u.name, u.email, u.credit_score, u.avatar, u.org_id, u.created_at as user_created_at
      FROM student_profiles sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.id = ?
    `).get(req.params.id) as any

    if (!student) {
      res.status(404).json({ success: false, error: '学生不存在' })
      return
    }

    student.skills = JSON.parse(student.skills || '[]')
    student.certificates = JSON.parse(student.certificates || '[]')

    const applications = db.prepare(`
      SELECT a.*, j.title as job_title, j.type as job_type, j.salary_min, j.salary_max
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.student_id = ?
      ORDER BY a.created_at DESC
      LIMIT 10
    `).all(req.params.id)

    const evaluations = db.prepare(`
      SELECT e.*, u.name as from_user_name
      FROM evaluations e
      JOIN users u ON e.from_user_id = u.id
      WHERE e.to_user_id = ?
      ORDER BY e.created_at DESC
      LIMIT 10
    `).all(student.user_id)

    for (const e of evaluations as any[]) {
      e.tags = JSON.parse(e.tags || '[]')
    }

    res.json({
      success: true,
      data: { ...student, applications, evaluations }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取学生详情失败' })
  }
})

router.put('/:id/tags', async (req: Request, res: Response): Promise<void> => {
  try {
    const { skills, certificates } = req.body
    const db = getDb()

    const student = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(req.params.id) as any
    if (!student) {
      res.status(404).json({ success: false, error: '学生不存在' })
      return
    }

    if (skills) {
      db.prepare('UPDATE student_profiles SET skills = ? WHERE id = ?').run(JSON.stringify(skills), req.params.id)
    }
    if (certificates) {
      db.prepare('UPDATE student_profiles SET certificates = ? WHERE id = ?').run(JSON.stringify(certificates), req.params.id)
    }

    const updated = db.prepare('SELECT sp.*, u.name, u.email, u.credit_score, u.avatar FROM student_profiles sp JOIN users u ON sp.user_id = u.id WHERE sp.id = ?').get(req.params.id) as any
    if (updated) {
      updated.skills = JSON.parse(updated.skills || '[]')
      updated.certificates = JSON.parse(updated.certificates || '[]')
    }

    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新标签失败' })
  }
})

router.get('/:id/matches', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDb()
    const student = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(req.params.id) as any
    if (!student) {
      res.status(404).json({ success: false, error: '学生不存在' })
      return
    }

    const studentSkills: string[] = JSON.parse(student.skills || '[]')
    const studentCerts: string[] = JSON.parse(student.certificates || '[]')
    const allStudentTokens = [...studentSkills, ...studentCerts]

    const jobs = db.prepare(`SELECT j.*, o.name as org_name FROM jobs j LEFT JOIN organizations o ON j.org_id = o.id WHERE j.status = 'published'`).all() as any[]

    const scored = jobs.map(job => {
      const requirements = JSON.parse(job.requirements || '{}')
      const requiredSkills: string[] = requirements.skills || []

      let skillMatch = 0
      if (requiredSkills.length > 0) {
        const overlap = requiredSkills.filter(s => allStudentTokens.includes(s))
        skillMatch = overlap.length / requiredSkills.length
      }

      const matchScore = Math.round(skillMatch * 100)
      return { ...job, requirements, matchScore, matchedSkills: requiredSkills.filter(s => allStudentTokens.includes(s)) }
    })

    scored.sort((a, b) => b.matchScore - a.matchScore)

    res.json({
      success: true,
      data: {
        items: scored,
        total: scored.length
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取匹配岗位失败' })
  }
})

export default router

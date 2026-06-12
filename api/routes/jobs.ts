import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

function calculateRiskScore(job: any): number {
  let score = 0
  if (job.salary_max && job.salary_min && (job.salary_max - job.salary_min) > 30000) score += 30
  if (job.salary_max && job.salary_max > 80000) score += 25
  if (!job.description || job.description.length < 20) score += 20
  if (!job.requirements || job.requirements.length < 10) score += 15
  if (!job.required_title && !job.required_category) score += 10
  return Math.min(score, 100)
}

const VERIFIED_LEVEL_MAP: Record<number, string> = {
  0: '未认证',
  1: '基础认证',
  2: '高级认证',
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { department, location, title, category, salary_min, salary_max, status, page = '1', limit = '10' } = req.query
    const conditions: string[] = []
    const params: any[] = []

    if (department) { conditions.push('j.department = ?'); params.push(department) }
    if (location) { conditions.push('j.location = ?'); params.push(location) }
    if (title) { conditions.push('j.title LIKE ?'); params.push(`%${title}%`) }
    if (category) { conditions.push('j.required_category = ?'); params.push(category) }
    if (salary_min) { conditions.push('j.salary_max >= ?'); params.push(Number(salary_min)) }
    if (salary_max) { conditions.push('j.salary_min <= ?'); params.push(Number(salary_max)) }
    if (status) { conditions.push('j.status = ?'); params.push(status) }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
    const pageNum = Math.max(1, Number(page))
    const limitNum = Math.max(1, Math.min(100, Number(limit)))
    const offset = (pageNum - 1) * limitNum

    const totalResult = db.prepare(`SELECT COUNT(*) as count FROM jobs j ${whereClause}`).get(...params) as { count: number }
    const jobs = db.prepare(`
      SELECT j.*, ip.institution_name, ip.institution_type, ip.location as institution_location,
             ip.verified_level, ip.license_expiry, ip.review_status,
             ua.name as approved_by_name
      FROM jobs j
      JOIN institution_profiles ip ON j.institution_id = ip.id
      LEFT JOIN users ua ON j.approved_by = ua.id
      ${whereClause}
      ORDER BY j.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limitNum, offset) as any[]

    const jobsWithVerified = jobs.map(job => ({
      ...job,
      verified_level_text: VERIFIED_LEVEL_MAP[job.verified_level] || '未知',
    }))

    res.json({
      success: true,
      data: {
        items: jobsWithVerified,
        total: totalResult.count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalResult.count / limitNum),
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const job = db.prepare(`
      SELECT j.*, ip.institution_name, ip.institution_type, ip.location as institution_location, ip.description as institution_description,
             ip.verified_level, ip.license_expiry, ip.review_status,
             ua.name as approved_by_name, uc.name as closed_by_name
      FROM jobs j
      JOIN institution_profiles ip ON j.institution_id = ip.id
      LEFT JOIN users ua ON j.approved_by = ua.id
      LEFT JOIN users uc ON j.closed_by = uc.id
      WHERE j.id = ?
    `).get(req.params.id) as any
    if (!job) {
      res.status(404).json({ success: false, error: '职位不存在' })
      return
    }
    job.verified_level_text = VERIFIED_LEVEL_MAP[job.verified_level] || '未知'
    res.json({ success: true, data: job })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    const userRole = req.headers['x-user-role']
    if (!userId) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }
    const { status, closed_reason } = req.body
    if (!status) {
      res.status(400).json({ success: false, error: '请提供状态' })
      return
    }
    const existing = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '职位不存在' })
      return
    }
    if (userRole !== 'admin') {
      const instProfile = db.prepare('SELECT id FROM institution_profiles WHERE user_id = ?').get(userId) as any
      if (!instProfile || instProfile.id !== existing.institution_id) {
        res.status(403).json({ success: false, error: '无权修改此职位状态' })
        return
      }
    }
    const now = new Date().toISOString()
    if (status === 'closed') {
      if (!closed_reason) {
        res.status(400).json({ success: false, error: '请提供关闭原因' })
        return
      }
      db.prepare(`
        UPDATE jobs SET status = 'closed', closed_reason = ?, closed_at = ?, closed_by = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(closed_reason, now, userId, req.params.id)
    } else {
      db.prepare(`
        UPDATE jobs SET status = ?, updated_at = datetime('now') WHERE id = ?
      `).run(status, req.params.id)
    }
    const job = db.prepare(`
      SELECT j.*, ip.institution_name, ip.verified_level,
             ua.name as approved_by_name, uc.name as closed_by_name
      FROM jobs j
      JOIN institution_profiles ip ON j.institution_id = ip.id
      LEFT JOIN users ua ON j.approved_by = ua.id
      LEFT JOIN users uc ON j.closed_by = uc.id
      WHERE j.id = ?
    `).get(req.params.id) as any
    if (job) {
      job.verified_level_text = VERIFIED_LEVEL_MAP[job.verified_level as number] || '未知'
    }
    res.json({ success: true, data: job })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id/close', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    const userRole = req.headers['x-user-role']
    if (!userId) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }
    const { close_reason } = req.body
    if (!close_reason) {
      res.status(400).json({ success: false, error: '请提供关闭原因' })
      return
    }
    const existing = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '职位不存在' })
      return
    }
    if (userRole !== 'admin') {
      const instProfile = db.prepare('SELECT id FROM institution_profiles WHERE user_id = ?').get(userId) as any
      if (!instProfile || instProfile.id !== existing.institution_id) {
        res.status(403).json({ success: false, error: '无权关闭此职位' })
        return
      }
    }
    const now = new Date().toISOString()
    db.prepare(`
      UPDATE jobs SET status = 'closed', closed_reason = ?, closed_at = ?, closed_by = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(close_reason, now, userId, req.params.id)
    const job = db.prepare(`
      SELECT j.*, u.name as closed_by_name
      FROM jobs j
      LEFT JOIN users u ON j.closed_by = u.id
      WHERE j.id = ?
    `).get(req.params.id)
    res.json({ success: true, data: job })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    const userRole = req.headers['x-user-role']
    if (!userId || userRole !== 'institution') {
      res.status(403).json({ success: false, error: '仅机构用户可发布职位' })
      return
    }
    const instProfile = db.prepare('SELECT id FROM institution_profiles WHERE user_id = ?').get(userId) as any
    if (!instProfile) {
      res.status(404).json({ success: false, error: '机构资料不存在' })
      return
    }
    const { title, department, required_title, required_category, location, salary_min, salary_max, description, requirements } = req.body
    if (!title || !department) {
      res.status(400).json({ success: false, error: '缺少职位名称或科室' })
      return
    }
    const riskScore = calculateRiskScore(req.body)
    const result = db.prepare(`
      INSERT INTO jobs (institution_id, title, department, required_title, required_category, location, salary_min, salary_max, description, requirements, status, ai_risk_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(instProfile.id, title, department, required_title, required_category, location, salary_min, salary_max, description, requirements, riskScore)
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: job })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    const userRole = req.headers['x-user-role']
    const existing = db.prepare(`
      SELECT j.*, ip.verified_level, ip.institution_name
      FROM jobs j
      JOIN institution_profiles ip ON j.institution_id = ip.id
      WHERE j.id = ?
    `).get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '职位不存在' })
      return
    }
    if (userRole !== 'admin') {
      const instProfile = db.prepare('SELECT id FROM institution_profiles WHERE user_id = ?').get(userId) as any
      if (!instProfile || instProfile.id !== existing.institution_id) {
        res.status(403).json({ success: false, error: '无权修改此职位' })
        return
      }
    }
    const { title, department, required_title, required_category, location, salary_min, salary_max, description, requirements, status } = req.body
    if (status === 'active' && (existing.verified_level || 0) < 2 && userRole !== 'admin') {
      const levelText = (existing.verified_level || 0) === 1 ? '基础认证' : '未认证'
      res.status(400).json({ success: false, error: `机构"${existing.institution_name}"当前为${levelText}，需完成高级认证后方可上架职位。`, code: 'INSTITUTION_NOT_FULLY_VERIFIED' })
      return
    }
    db.prepare(`
      UPDATE jobs SET title = COALESCE(?, title), department = COALESCE(?, department),
      required_title = COALESCE(?, required_title), required_category = COALESCE(?, required_category),
      location = COALESCE(?, location), salary_min = COALESCE(?, salary_min), salary_max = COALESCE(?, salary_max),
      description = COALESCE(?, description), requirements = COALESCE(?, requirements),
      status = COALESCE(?, status), updated_at = datetime('now') WHERE id = ?
    `).run(title, department, required_title, required_category, location, salary_min, salary_max, description, requirements, status, req.params.id)
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: job })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    const userRole = req.headers['x-user-role']
    const existing = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '职位不存在' })
      return
    }
    if (userRole !== 'admin') {
      const instProfile = db.prepare('SELECT id FROM institution_profiles WHERE user_id = ?').get(userId) as any
      if (!instProfile || instProfile.id !== existing.institution_id) {
        res.status(403).json({ success: false, error: '无权删除此职位' })
        return
      }
    }
    db.prepare('DELETE FROM jobs WHERE id = ?').run(req.params.id)
    res.json({ success: true, data: null })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router

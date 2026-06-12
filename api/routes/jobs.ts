import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'
import { auth, requireRole, optionalAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 10, type, city, keyword, salary_min, salary_max, enterprise_id } = req.query
  const db = getDb()

  let sql = `
    SELECT j.*, ep.company_name, ep.logo_url, ep.verified
    FROM jobs j
    LEFT JOIN enterprise_profiles ep ON j.enterprise_id = ep.id
    WHERE j.status = 'open'
  `
  const params: Array<string | number> = []

  if (type) {
    sql += ' AND j.type = ?'
    params.push(type as string)
  }
  if (city) {
    sql += ' AND j.city LIKE ?'
    params.push(`%${city}%`)
  }
  if (keyword) {
    sql += ' AND (j.title LIKE ? OR j.description LIKE ? OR j.department LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
  }
  if (salary_min) {
    sql += ' AND j.salary_min >= ?'
    params.push(Number(salary_min))
  }
  if (salary_max) {
    sql += ' AND j.salary_max <= ?'
    params.push(Number(salary_max))
  }
  if (enterprise_id) {
    sql += ' AND j.enterprise_id = ?'
    params.push(Number(enterprise_id))
  }

  const total = db.prepare(sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM')).get(...params) as { 'COUNT(*)': number }

  sql += ' ORDER BY j.created_at DESC LIMIT ? OFFSET ?'
  params.push(Number(limit), (Number(page) - 1) * Number(limit))

  const jobs = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data: {
      list: jobs,
      total: total['COUNT(*)'],
      page: Number(page),
      limit: Number(limit),
    },
  })
})

router.get('/hot', async (_req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const jobs = db.prepare(`
    SELECT j.*, ep.company_name, ep.logo_url, ep.verified
    FROM jobs j
    LEFT JOIN enterprise_profiles ep ON j.enterprise_id = ep.id
    WHERE j.status = 'open'
    ORDER BY j.views_count DESC, j.applications_count DESC
    LIMIT 10
  `).all()

  res.json({
    success: true,
    data: jobs,
  })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const job = db.prepare(`
    SELECT j.*, ep.company_name, ep.industry, ep.scale, ep.logo_url, ep.website, ep.description as company_description, ep.verified
    FROM jobs j
    LEFT JOIN enterprise_profiles ep ON j.enterprise_id = ep.id
    WHERE j.id = ?
  `).get(Number(req.params.id))

  if (!job) {
    res.status(404).json({ success: false, error: '岗位不存在' })
    return
  }

  db.prepare('UPDATE jobs SET views_count = views_count + 1 WHERE id = ?').run(Number(req.params.id))

  const similarJobs = db.prepare(`
    SELECT j.*, ep.company_name, ep.logo_url
    FROM jobs j
    LEFT JOIN enterprise_profiles ep ON j.enterprise_id = ep.id
    WHERE j.status = 'open' AND j.id != ? AND (j.type = ? OR j.city = ?)
    ORDER BY j.views_count DESC
    LIMIT 6
  `).all(Number(req.params.id), (job as { type: string }).type, (job as { city: string }).city)

  res.json({
    success: true,
    data: {
      ...(job as Record<string, unknown>),
      similar_jobs: similarJobs,
    },
  })
})

router.post('/', auth, requireRole('enterprise'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT id FROM enterprise_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
  if (!profile) {
    res.status(404).json({ success: false, error: '企业信息不存在' })
    return
  }

  const { title, type, department, city, salary_min, salary_max, description, requirements, benefits } = req.body

  if (!title || !type || !city || !description) {
    res.status(400).json({ success: false, error: '缺少必要字段：title, type, city, description' })
    return
  }

  const result = db.prepare(`
    INSERT INTO jobs (enterprise_id, title, type, department, city, salary_min, salary_max, description, requirements, benefits)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    profile.id, title, type, department ?? null, city,
    salary_min ?? null, salary_max ?? null, description, requirements ?? null, benefits ?? null
  )

  const job = db.prepare(`
    SELECT j.*, ep.company_name, ep.logo_url
    FROM jobs j
    LEFT JOIN enterprise_profiles ep ON j.enterprise_id = ep.id
    WHERE j.id = ?
  `).get(result.lastInsertRowid)

  res.status(201).json({
    success: true,
    message: '岗位发布成功',
    data: job,
  })
})

router.put('/:id', auth, requireRole('enterprise'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT id FROM enterprise_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
  if (!profile) {
    res.status(404).json({ success: false, error: '企业信息不存在' })
    return
  }

  const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND enterprise_id = ?').get(Number(req.params.id), profile.id)
  if (!job) {
    res.status(404).json({ success: false, error: '岗位不存在或无权限编辑' })
    return
  }

  const { title, type, department, city, salary_min, salary_max, description, requirements, benefits, status } = req.body

  db.prepare(`
    UPDATE jobs SET
      title = COALESCE(?, title),
      type = COALESCE(?, type),
      department = COALESCE(?, department),
      city = COALESCE(?, city),
      salary_min = COALESCE(?, salary_min),
      salary_max = COALESCE(?, salary_max),
      description = COALESCE(?, description),
      requirements = COALESCE(?, requirements),
      benefits = COALESCE(?, benefits),
      status = COALESCE(?, status),
      updated_at = datetime('now')
    WHERE id = ? AND enterprise_id = ?
  `).run(
    title ?? null, type ?? null, department ?? null, city ?? null,
    salary_min ?? null, salary_max ?? null, description ?? null,
    requirements ?? null, benefits ?? null, status ?? null,
    Number(req.params.id), profile.id
  )

  const updated = db.prepare(`
    SELECT j.*, ep.company_name, ep.logo_url
    FROM jobs j
    LEFT JOIN enterprise_profiles ep ON j.enterprise_id = ep.id
    WHERE j.id = ?
  `).get(Number(req.params.id))

  res.json({
    success: true,
    message: '岗位更新成功',
    data: updated,
  })
})

router.delete('/:id', auth, requireRole('enterprise'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT id FROM enterprise_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
  if (!profile) {
    res.status(404).json({ success: false, error: '企业信息不存在' })
    return
  }

  db.prepare('DELETE FROM jobs WHERE id = ? AND enterprise_id = ?').run(Number(req.params.id), profile.id)
  res.json({ success: true, message: '岗位删除成功' })
})

export default router

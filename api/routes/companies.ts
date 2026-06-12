import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'

const router = Router()

router.get('/radars', async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 15, industry, keyword, sort_by = 'overall_score' } = req.query
  const db = getDb()

  let sql = 'SELECT * FROM company_radars WHERE 1=1'
  const params: Array<string | number> = []

  if (industry) {
    sql += ' AND industry LIKE ?'
    params.push(`%${industry}%`)
  }
  if (keyword) {
    sql += ' AND (company_name LIKE ? OR description LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`)
  }

  const total = db.prepare(sql.replace('SELECT *', 'SELECT COUNT(*)')).get(...params) as { 'COUNT(*)': number }

  const validSort = ['overall_score', 'culture_score', 'growth_score', 'salary_score', 'work_life_score', 'reviews_count']
  const sortBy = validSort.includes(sort_by as string) ? sort_by : 'overall_score'
  sql += ` ORDER BY ${sortBy} DESC LIMIT ? OFFSET ?`
  params.push(Number(limit), (Number(page) - 1) * Number(limit))

  const radars = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data: {
      list: radars,
      total: total['COUNT(*)'],
      page: Number(page),
      limit: Number(limit),
    },
  })
})

router.get('/radars/rankings', async (_req: Request, res: Response): Promise<void> => {
  const db = getDb()

  const overall = db.prepare('SELECT id, company_name, overall_score, reviews_count FROM company_radars ORDER BY overall_score DESC LIMIT 10').all()
  const salary = db.prepare('SELECT id, company_name, salary_score, reviews_count FROM company_radars ORDER BY salary_score DESC LIMIT 10').all()
  const culture = db.prepare('SELECT id, company_name, culture_score, reviews_count FROM company_radars ORDER BY culture_score DESC LIMIT 10').all()
  const growth = db.prepare('SELECT id, company_name, growth_score, reviews_count FROM company_radars ORDER BY growth_score DESC LIMIT 10').all()
  const workLife = db.prepare('SELECT id, company_name, work_life_score, reviews_count FROM company_radars ORDER BY work_life_score DESC LIMIT 10').all()

  res.json({
    success: true,
    data: {
      overall_rank: overall,
      salary_rank: salary,
      culture_rank: culture,
      growth_rank: growth,
      work_life_rank: workLife,
    },
  })
})

router.get('/radar/:id', async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const radar = db.prepare('SELECT * FROM company_radars WHERE id = ?').get(Number(req.params.id))

  if (!radar) {
    res.status(404).json({ success: false, error: '公司雷达数据不存在' })
    return
  }

  const r = radar as { industry: string; id: number }
  const similar = db.prepare(`
    SELECT id, company_name, overall_score, culture_score, growth_score, salary_score, work_life_score, reviews_count
    FROM company_radars
    WHERE industry = ? AND id != ?
    ORDER BY overall_score DESC
    LIMIT 5
  `).all(r.industry, r.id)

  res.json({
    success: true,
    data: {
      ...(radar as Record<string, unknown>),
      similar_companies: similar,
    },
  })
})

router.get('/industries', async (_req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const industries = db.prepare(`
    SELECT DISTINCT industry,
           COUNT(*) as company_count,
           AVG(overall_score) as avg_score
    FROM company_radars
    WHERE industry IS NOT NULL AND industry != ''
    GROUP BY industry
    ORDER BY company_count DESC
  `).all()

  res.json({
    success: true,
    data: industries,
  })
})

router.get('/stats/overview', async (_req: Request, res: Response): Promise<void> => {
  const db = getDb()

  const enterpriseCount = db.prepare("SELECT COUNT(*) as c FROM enterprise_profiles WHERE verified = 1").get() as { c: number }
  const jobCount = db.prepare("SELECT COUNT(*) as c FROM jobs WHERE status = 'open'").get() as { c: number }
  const studentCount = db.prepare('SELECT COUNT(*) as c FROM student_profiles').get() as { c: number }
  const applicationCount = db.prepare('SELECT COUNT(*) as c FROM applications').get() as { c: number }
  const mentorCount = db.prepare('SELECT COUNT(*) as c FROM mentors').get() as { c: number }
  const referralCount = db.prepare("SELECT COUNT(*) as c FROM referrals WHERE status = 'available'").get() as { c: number }

  const recentJobs = db.prepare(`
    SELECT j.id, j.title, j.type, j.city, ep.company_name, ep.logo_url, j.created_at
    FROM jobs j
    LEFT JOIN enterprise_profiles ep ON j.enterprise_id = ep.id
    WHERE j.status = 'open'
    ORDER BY j.created_at DESC
    LIMIT 6
  `).all()

  const hotJobs = db.prepare(`
    SELECT j.id, j.title, j.type, j.city, j.views_count, j.applications_count, ep.company_name, ep.logo_url
    FROM jobs j
    LEFT JOIN enterprise_profiles ep ON j.enterprise_id = ep.id
    WHERE j.status = 'open'
    ORDER BY j.applications_count DESC, j.views_count DESC
    LIMIT 6
  `).all()

  res.json({
    success: true,
    data: {
      counts: {
        enterprise: enterpriseCount.c,
        jobs: jobCount.c,
        students: studentCount.c,
        applications: applicationCount.c,
        mentors: mentorCount.c,
        referrals: referralCount.c,
      },
      recent_jobs: recentJobs,
      hot_jobs: hotJobs,
    },
  })
})

export default router

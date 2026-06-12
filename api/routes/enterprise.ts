import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'
import { auth, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/profiles', async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 10, industry, keyword } = req.query
  const db = getDb()

  let sql = 'SELECT * FROM enterprise_profiles WHERE 1=1'
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

  sql += ' ORDER BY verified DESC, created_at DESC LIMIT ? OFFSET ?'
  params.push(Number(limit), (Number(page) - 1) * Number(limit))

  const profiles = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data: {
      list: profiles,
      total: total['COUNT(*)'],
      page: Number(page),
      limit: Number(limit),
    },
  })
})

router.get('/profile/:id', async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT * FROM enterprise_profiles WHERE id = ?').get(Number(req.params.id))

  if (!profile) {
    res.status(404).json({ success: false, error: '企业信息不存在' })
    return
  }

  const jobs = db.prepare("SELECT * FROM jobs WHERE enterprise_id = ? AND status = 'open' ORDER BY created_at DESC").all(Number(req.params.id))
  const radar = db.prepare('SELECT * FROM company_radars WHERE company_id = ?').get(Number(req.params.id))

  res.json({
    success: true,
    data: {
      ...(profile as Record<string, unknown>),
      jobs,
      radar,
    },
  })
})

router.get('/my/profile', auth, requireRole('enterprise'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT * FROM enterprise_profiles WHERE user_id = ?').get(req.user!.userId) as (Record<string, unknown> & { id: number }) | undefined

  if (!profile) {
    res.status(404).json({ success: false, error: '企业信息不存在' })
    return
  }

  const jobCount = db.prepare('SELECT COUNT(*) as c FROM jobs WHERE enterprise_id = ?').get(profile.id) as { c: number }
  const appCount = db.prepare('SELECT COUNT(*) as c FROM applications WHERE enterprise_id = ?').get(profile.id) as { c: number }

  res.json({
    success: true,
    data: {
      ...profile,
      stats: {
        job_count: jobCount.c,
        application_count: appCount.c,
      },
    },
  })
})

router.put('/my/profile', auth, requireRole('enterprise'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT id FROM enterprise_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined

  if (!profile) {
    res.status(404).json({ success: false, error: '企业信息不存在' })
    return
  }

  const { company_name, industry, scale, logo_url, website, description, address, contact_name, contact_phone } = req.body

  db.prepare(`
    UPDATE enterprise_profiles SET
      company_name = COALESCE(?, company_name),
      industry = COALESCE(?, industry),
      scale = COALESCE(?, scale),
      logo_url = COALESCE(?, logo_url),
      website = COALESCE(?, website),
      description = COALESCE(?, description),
      address = COALESCE(?, address),
      contact_name = COALESCE(?, contact_name),
      contact_phone = COALESCE(?, contact_phone),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    company_name ?? null, industry ?? null, scale ?? null, logo_url ?? null, website ?? null,
    description ?? null, address ?? null, contact_name ?? null, contact_phone ?? null, profile.id
  )

  const updated = db.prepare('SELECT * FROM enterprise_profiles WHERE id = ?').get(profile.id)
  res.json({ success: true, message: '企业信息更新成功', data: updated })
})

router.get('/my/jobs', auth, requireRole('enterprise'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT id FROM enterprise_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined

  if (!profile) {
    res.status(404).json({ success: false, error: '企业信息不存在' })
    return
  }

  const { page = 1, limit = 10, status } = req.query
  let sql = 'SELECT * FROM jobs WHERE enterprise_id = ?'
  const params: Array<string | number> = [profile.id]

  if (status) {
    sql += ' AND status = ?'
    params.push(status as string)
  }

  const total = db.prepare(sql.replace('SELECT *', 'SELECT COUNT(*)')).get(...params) as { 'COUNT(*)': number }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
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

router.get('/my/applications', auth, requireRole('enterprise'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT id FROM enterprise_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined

  if (!profile) {
    res.status(404).json({ success: false, error: '企业信息不存在' })
    return
  }

  const { page = 1, limit = 10, status, job_id } = req.query
  let sql = `
    SELECT a.*, j.title as job_title, sp.real_name as student_name, sp.school, sp.major, u.avatar as student_avatar
    FROM applications a
    LEFT JOIN jobs j ON a.job_id = j.id
    LEFT JOIN student_profiles sp ON a.student_id = sp.id
    LEFT JOIN users u ON sp.user_id = u.id
    WHERE a.enterprise_id = ?
  `
  const params: Array<string | number> = [profile.id]

  if (status) {
    sql += ' AND a.status = ?'
    params.push(status as string)
  }
  if (job_id) {
    sql += ' AND a.job_id = ?'
    params.push(Number(job_id))
  }

  const total = db.prepare(sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM')).get(...params) as { 'COUNT(*)': number }

  sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?'
  params.push(Number(limit), (Number(page) - 1) * Number(limit))

  const applications = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data: {
      list: applications,
      total: total['COUNT(*)'],
      page: Number(page),
      limit: Number(limit),
    },
  })
})

router.get('/mentors', async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 10, expertise, keyword } = req.query
  const db = getDb()

  let sql = 'SELECT m.*, u.avatar, u.email FROM mentors m LEFT JOIN users u ON m.user_id = u.id WHERE 1=1'
  const params: Array<string | number> = []

  if (expertise) {
    sql += ' AND m.expertise LIKE ?'
    params.push(`%${expertise}%`)
  }
  if (keyword) {
    sql += ' AND (m.real_name LIKE ? OR m.company LIKE ? OR m.position LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
  }

  const total = db.prepare(sql.replace('SELECT m.*, u.avatar, u.email', 'SELECT COUNT(*)')).get(...params) as { 'COUNT(*)': number }

  sql += ' ORDER BY m.rating DESC LIMIT ? OFFSET ?'
  params.push(Number(limit), (Number(page) - 1) * Number(limit))

  const mentors = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data: {
      list: mentors,
      total: total['COUNT(*)'],
      page: Number(page),
      limit: Number(limit),
    },
  })
})

router.get('/mentor/:id', async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const mentor = db.prepare('SELECT m.*, u.avatar, u.email FROM mentors m LEFT JOIN users u ON m.user_id = u.id WHERE m.id = ?').get(Number(req.params.id))

  if (!mentor) {
    res.status(404).json({ success: false, error: '导师信息不存在' })
    return
  }

  const referrals = db.prepare('SELECT * FROM referrals WHERE mentor_id = ? ORDER BY created_at DESC').all(Number(req.params.id))

  res.json({
    success: true,
    data: {
      ...(mentor as Record<string, unknown>),
      referrals,
    },
  })
})

export default router

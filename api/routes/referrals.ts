import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'
import { auth, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 10, company, position, status } = req.query
  const db = getDb()

  let sql = `
    SELECT r.*, m.real_name as mentor_name, m.avatar_url as mentor_avatar, m.company as mentor_company, m.position as mentor_position, m.rating as mentor_rating
    FROM referrals r
    LEFT JOIN mentors m ON r.mentor_id = m.id
    WHERE 1=1
  `
  const params: Array<string | number> = []

  if (company) {
    sql += ' AND r.company_name LIKE ?'
    params.push(`%${company}%`)
  }
  if (position) {
    sql += ' AND r.position LIKE ?'
    params.push(`%${position}%`)
  }
  if (status) {
    sql += ' AND r.status = ?'
    params.push(status as string)
  } else {
    sql += " AND r.status = 'available'"
  }

  const total = db.prepare(sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM')).get(...params) as { 'COUNT(*)': number }

  sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?'
  params.push(Number(limit), (Number(page) - 1) * Number(limit))

  const referrals = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data: {
      list: referrals,
      total: total['COUNT(*)'],
      page: Number(page),
      limit: Number(limit),
    },
  })
})

router.get('/my', auth, requireRole('mentor'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const mentor = db.prepare('SELECT id FROM mentors WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
  if (!mentor) {
    res.status(404).json({ success: false, error: '导师信息不存在' })
    return
  }

  const { page = 1, limit = 10, status } = req.query
  let sql = 'SELECT * FROM referrals WHERE mentor_id = ?'
  const params: Array<string | number> = [mentor.id]

  if (status) {
    sql += ' AND status = ?'
    params.push(status as string)
  }

  const total = db.prepare(sql.replace('SELECT *', 'SELECT COUNT(*)')).get(...params) as { 'COUNT(*)': number }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(Number(limit), (Number(page) - 1) * Number(limit))

  const referrals = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data: {
      list: referrals,
      total: total['COUNT(*)'],
      page: Number(page),
      limit: Number(limit),
    },
  })
})

router.get('/my-claimed', auth, requireRole('student'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
  if (!profile) {
    res.status(404).json({ success: false, error: '学生档案不存在' })
    return
  }

  const referrals = db.prepare(`
    SELECT r.*, m.real_name as mentor_name, m.avatar_url as mentor_avatar, m.company as mentor_company, m.position as mentor_position
    FROM referrals r
    LEFT JOIN mentors m ON r.mentor_id = m.id
    WHERE r.claimed_by = ?
    ORDER BY r.updated_at DESC
  `).all(profile.id)

  res.json({
    success: true,
    data: referrals,
  })
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const referral = db.prepare(`
    SELECT r.*, m.real_name as mentor_name, m.avatar_url as mentor_avatar, m.company as mentor_company,
           m.position as mentor_position, m.expertise as mentor_expertise, m.bio as mentor_bio, m.rating as mentor_rating
    FROM referrals r
    LEFT JOIN mentors m ON r.mentor_id = m.id
    WHERE r.id = ?
  `).get(Number(req.params.id))

  if (!referral) {
    res.status(404).json({ success: false, error: '内推信息不存在' })
    return
  }

  const otherReferrals = db.prepare(`
    SELECT r.*, m.real_name as mentor_name, m.avatar_url as mentor_avatar
    FROM referrals r
    LEFT JOIN mentors m ON r.mentor_id = m.id
    WHERE r.status = 'available' AND r.id != ? AND (r.company_name = ? OR r.position LIKE ?)
    ORDER BY r.created_at DESC
    LIMIT 5
  `).all(
    Number(req.params.id),
    (referral as { company_name: string }).company_name,
    `%${(referral as { position: string }).position.split('工程师')[0] || ''}%`
  )

  res.json({
    success: true,
    data: {
      ...(referral as Record<string, unknown>),
      other_referrals: otherReferrals,
    },
  })
})

router.post('/', auth, requireRole('mentor'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const mentor = db.prepare('SELECT id FROM mentors WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
  if (!mentor) {
    res.status(404).json({ success: false, error: '导师信息不存在' })
    return
  }

  const { company_id, company_name, position, bonus, description } = req.body

  if (!company_name || !position) {
    res.status(400).json({ success: false, error: '缺少必要字段：company_name, position' })
    return
  }

  const result = db.prepare(`
    INSERT INTO referrals (mentor_id, company_id, company_name, position, bonus, description, status)
    VALUES (?, ?, ?, ?, ?, ?, 'available')
  `).run(mentor.id, company_id ?? null, company_name, position, bonus ?? null, description ?? null)

  const referral = db.prepare('SELECT * FROM referrals WHERE id = ?').get(result.lastInsertRowid)

  res.status(201).json({
    success: true,
    message: '内推信息发布成功',
    data: referral,
  })
})

router.post('/:id/claim', auth, requireRole('student'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
  if (!profile) {
    res.status(404).json({ success: false, error: '学生档案不存在' })
    return
  }

  const referralId = Number(req.params.id)
  const referral = db.prepare("SELECT * FROM referrals WHERE id = ? AND status = 'available'").get(referralId)
  if (!referral) {
    res.status(404).json({ success: false, error: '该内推不存在或已被领取' })
    return
  }

  const existing = db.prepare("SELECT id FROM referrals WHERE status = 'claimed' AND claimed_by = ?").get(profile.id)
  if (existing) {
    res.status(409).json({ success: false, error: '您已领取过内推，请等待结果' })
    return
  }

  db.prepare("UPDATE referrals SET status = 'claimed', claimed_by = ?, updated_at = datetime('now') WHERE id = ?").run(profile.id, referralId)

  const updated = db.prepare(`
    SELECT r.*, m.real_name as mentor_name, m.avatar_url as mentor_avatar, m.company as mentor_company, m.position as mentor_position
    FROM referrals r
    LEFT JOIN mentors m ON r.mentor_id = m.id
    WHERE r.id = ?
  `).get(referralId)

  res.json({
    success: true,
    message: '内推领取成功！导师会尽快与您联系',
    data: updated,
  })
})

router.put('/:id', auth, requireRole('mentor'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const mentor = db.prepare('SELECT id FROM mentors WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
  if (!mentor) {
    res.status(404).json({ success: false, error: '导师信息不存在' })
    return
  }

  const referralId = Number(req.params.id)
  const referral = db.prepare('SELECT * FROM referrals WHERE id = ? AND mentor_id = ?').get(referralId, mentor.id)
  if (!referral) {
    res.status(404).json({ success: false, error: '内推信息不存在或无权限操作' })
    return
  }

  const { company_name, position, bonus, description, status } = req.body

  db.prepare(`
    UPDATE referrals SET
      company_name = COALESCE(?, company_name),
      position = COALESCE(?, position),
      bonus = COALESCE(?, bonus),
      description = COALESCE(?, description),
      status = COALESCE(?, status),
      updated_at = datetime('now')
    WHERE id = ? AND mentor_id = ?
  `).run(company_name ?? null, position ?? null, bonus ?? null, description ?? null, status ?? null, referralId, mentor.id)

  const updated = db.prepare('SELECT * FROM referrals WHERE id = ?').get(referralId)

  res.json({
    success: true,
    message: '内推信息更新成功',
    data: updated,
  })
})

router.delete('/:id', auth, requireRole('mentor'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const mentor = db.prepare('SELECT id FROM mentors WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
  if (!mentor) {
    res.status(404).json({ success: false, error: '导师信息不存在' })
    return
  }

  const referralId = Number(req.params.id)
  db.prepare('DELETE FROM referrals WHERE id = ? AND mentor_id = ?').run(referralId, mentor.id)

  res.json({
    success: true,
    message: '内推信息删除成功',
  })
})

export default router

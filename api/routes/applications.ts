import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'
import { auth, requireRole } from '../middleware/auth.js'

const router = Router()

router.post('/:jobId', auth, requireRole('student'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
  if (!profile) {
    res.status(404).json({ success: false, error: '学生档案不存在' })
    return
  }

  const jobId = Number(req.params.jobId)
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as { id: number; enterprise_id: number; title: string } | undefined
  if (!job) {
    res.status(404).json({ success: false, error: '岗位不存在' })
    return
  }

  const existing = db.prepare('SELECT id FROM applications WHERE job_id = ? AND student_id = ?').get(jobId, profile.id)
  if (existing) {
    res.status(409).json({ success: false, error: '您已经申请过该岗位' })
    return
  }

  const { cover_letter, resume_snapshot } = req.body

  const result = db.prepare(`
    INSERT INTO applications (job_id, student_id, enterprise_id, status, cover_letter, resume_snapshot)
    VALUES (?, ?, ?, 'pending', ?, ?)
  `).run(jobId, profile.id, job.enterprise_id, cover_letter ?? null, resume_snapshot ?? null)

  db.prepare('UPDATE jobs SET applications_count = applications_count + 1 WHERE id = ?').run(jobId)

  const application = db.prepare(`
    SELECT a.*, j.title as job_title, ep.company_name
    FROM applications a
    LEFT JOIN jobs j ON a.job_id = j.id
    LEFT JOIN enterprise_profiles ep ON a.enterprise_id = ep.id
    WHERE a.id = ?
  `).get(result.lastInsertRowid)

  res.status(201).json({
    success: true,
    message: '申请提交成功',
    data: application,
  })
})

router.get('/my', auth, requireRole('student'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
  if (!profile) {
    res.status(404).json({ success: false, error: '学生档案不存在' })
    return
  }

  const { page = 1, limit = 10, status } = req.query
  let sql = `
    SELECT a.*, j.title as job_title, j.type as job_type, j.city as job_city,
           ep.company_name, ep.logo_url as company_logo
    FROM applications a
    LEFT JOIN jobs j ON a.job_id = j.id
    LEFT JOIN enterprise_profiles ep ON a.enterprise_id = ep.id
    WHERE a.student_id = ?
  `
  const params: Array<string | number> = [profile.id]

  if (status) {
    sql += ' AND a.status = ?'
    params.push(status as string)
  }

  const total = db.prepare(sql.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM')).get(...params) as { 'COUNT(*)': number }

  sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?'
  params.push(Number(limit), (Number(page) - 1) * Number(limit))

  const applications = db.prepare(sql).all(...params)

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed,
      SUM(CASE WHEN status = 'interview' THEN 1 ELSE 0 END) as interview,
      SUM(CASE WHEN status = 'offer' THEN 1 ELSE 0 END) as offer,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
    FROM applications WHERE student_id = ?
  `).get(profile.id)

  res.json({
    success: true,
    data: {
      list: applications,
      total: total['COUNT(*)'],
      page: Number(page),
      limit: Number(limit),
      stats,
    },
  })
})

router.get('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const application = db.prepare(`
    SELECT a.*,
           j.title as job_title, j.type as job_type, j.city as job_city, j.salary_min, j.salary_max,
           j.description as job_description, j.requirements as job_requirements, j.benefits as job_benefits,
           ep.company_name, ep.industry, ep.scale, ep.logo_url as company_logo, ep.website,
           sp.real_name as student_name, sp.school, sp.major, sp.grade, sp.gpa, sp.skills, sp.self_intro,
           sp.target_position, sp.target_city, sp.expected_salary, sp.resume_url,
           u.avatar as student_avatar, u.email as student_email, u.phone as student_phone
    FROM applications a
    LEFT JOIN jobs j ON a.job_id = j.id
    LEFT JOIN enterprise_profiles ep ON a.enterprise_id = ep.id
    LEFT JOIN student_profiles sp ON a.student_id = sp.id
    LEFT JOIN users u ON sp.user_id = u.id
    WHERE a.id = ?
  `).get(Number(req.params.id))

  if (!application) {
    res.status(404).json({ success: false, error: '申请记录不存在' })
    return
  }

  const app = application as { student_id: number; enterprise_id: number }
  let canView = false

  if (req.user) {
    if (req.user.role === 'student') {
      const studentProfile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(req.user.userId) as { id: number } | undefined
      if (studentProfile && studentProfile.id === app.student_id) canView = true
    } else if (req.user.role === 'enterprise') {
      const enterpriseProfile = db.prepare('SELECT id FROM enterprise_profiles WHERE user_id = ?').get(req.user.userId) as { id: number } | undefined
      if (enterpriseProfile && enterpriseProfile.id === app.enterprise_id) canView = true
    } else if (req.user.role === 'admin') {
      canView = true
    }
  }

  if (!canView) {
    res.status(403).json({ success: false, error: '无权限查看此申请' })
    return
  }

  const projects = db.prepare('SELECT * FROM projects WHERE student_id = ?').all(app.student_id)
  const certificates = db.prepare('SELECT * FROM certificates WHERE student_id = ?').all(app.student_id)

  res.json({
    success: true,
    data: {
      ...(application as Record<string, unknown>),
      projects,
      certificates,
    },
  })
})

router.put('/:id/status', auth, requireRole('enterprise'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT id FROM enterprise_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
  if (!profile) {
    res.status(404).json({ success: false, error: '企业信息不存在' })
    return
  }

  const applicationId = Number(req.params.id)
  const application = db.prepare('SELECT * FROM applications WHERE id = ? AND enterprise_id = ?').get(applicationId, profile.id)
  if (!application) {
    res.status(404).json({ success: false, error: '申请记录不存在或无权限操作' })
    return
  }

  const { status } = req.body
  const validStatuses = ['pending', 'reviewed', 'interview', 'offer', 'rejected']
  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, error: `状态必须是: ${validStatuses.join(', ')}` })
    return
  }

  db.prepare("UPDATE applications SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, applicationId)

  const updated = db.prepare(`
    SELECT a.*, j.title as job_title, sp.real_name as student_name
    FROM applications a
    LEFT JOIN jobs j ON a.job_id = j.id
    LEFT JOIN student_profiles sp ON a.student_id = sp.id
    WHERE a.id = ?
  `).get(applicationId)

  res.json({
    success: true,
    message: '申请状态更新成功',
    data: updated,
  })
})

router.delete('/:id', auth, requireRole('student'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
  if (!profile) {
    res.status(404).json({ success: false, error: '学生档案不存在' })
    return
  }

  const applicationId = Number(req.params.id)
  const application = db.prepare('SELECT * FROM applications WHERE id = ? AND student_id = ?').get(applicationId, profile.id) as { id: number; job_id: number; status: string } | undefined
  if (!application) {
    res.status(404).json({ success: false, error: '申请记录不存在或无权限操作' })
    return
  }

  if (application.status !== 'pending') {
    res.status(400).json({ success: false, error: '只能撤回待处理的申请' })
    return
  }

  db.prepare('DELETE FROM applications WHERE id = ?').run(applicationId)
  db.prepare('UPDATE jobs SET applications_count = MAX(applications_count - 1, 0) WHERE id = ?').run(application.job_id)

  res.json({
    success: true,
    message: '申请已撤回',
  })
})

export default router

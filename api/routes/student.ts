import { Router, type Request, type Response } from 'express'
import { getDb } from '../db/init.js'
import { auth, requireRole } from '../middleware/auth.js'
import type { StudentProfile, Project, Certificate, JournalEntry, AssessmentReport } from '../../shared/types.js'

const router = Router()

router.get('/profiles', auth, async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 10, school, major, keyword } = req.query
  const db = getDb()

  let sql = 'SELECT sp.*, u.avatar FROM student_profiles sp LEFT JOIN users u ON sp.user_id = u.id WHERE 1=1'
  const params: Array<string | number> = []

  if (school) {
    sql += ' AND sp.school LIKE ?'
    params.push(`%${school}%`)
  }
  if (major) {
    sql += ' AND sp.major LIKE ?'
    params.push(`%${major}%`)
  }
  if (keyword) {
    sql += ' AND (sp.real_name LIKE ? OR sp.skills LIKE ? OR sp.target_position LIKE ?)'
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
  }

  const total = db.prepare(sql.replace('SELECT sp.*, u.avatar', 'SELECT COUNT(*)')).get(...params) as { 'COUNT(*)': number }

  sql += ' ORDER BY sp.created_at DESC LIMIT ? OFFSET ?'
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

router.get('/profile/:id', auth, async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare(`
    SELECT sp.*, u.avatar, u.email, u.phone
    FROM student_profiles sp
    LEFT JOIN users u ON sp.user_id = u.id
    WHERE sp.id = ?
  `).get(Number(req.params.id)) as (StudentProfile & { avatar?: string; email?: string; phone?: string }) | undefined

  if (!profile) {
    res.status(404).json({ success: false, error: '学生档案不存在' })
    return
  }

  const projects = db.prepare('SELECT * FROM projects WHERE student_id = ?').get(profile.id)
  const certificates = db.prepare('SELECT * FROM certificates WHERE student_id = ?').all(profile.id)
  const journals = db.prepare('SELECT * FROM journal_entries WHERE student_id = ? AND is_public = 1 ORDER BY created_at DESC LIMIT 5').all(profile.id)
  const reports = db.prepare('SELECT id, report_type, title, summary, created_at FROM assessment_reports WHERE student_id = ?').all(profile.id)

  res.json({
    success: true,
    data: {
      ...profile,
      projects,
      certificates,
      journals,
      reports,
    },
  })
})

router.get('/my/profile', auth, requireRole('student'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(req.user!.userId) as StudentProfile | undefined

  if (!profile) {
    res.status(404).json({ success: false, error: '学生档案不存在' })
    return
  }

  const projects = db.prepare('SELECT * FROM projects WHERE student_id = ?').all(profile.id)
  const certificates = db.prepare('SELECT * FROM certificates WHERE student_id = ?').all(profile.id)
  const journals = db.prepare('SELECT * FROM journal_entries WHERE student_id = ? ORDER BY created_at DESC').all(profile.id)
  const reports = db.prepare('SELECT * FROM assessment_reports WHERE student_id = ? ORDER BY created_at DESC').all(profile.id)

  res.json({
    success: true,
    data: {
      ...profile,
      projects,
      certificates,
      journals,
      reports,
    },
  })
})

router.put('/my/profile', auth, requireRole('student'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined

  if (!profile) {
    res.status(404).json({ success: false, error: '学生档案不存在' })
    return
  }

  const { real_name, gender, birthday, school, major, grade, gpa, skills, resume_url, self_intro, target_position, target_city, expected_salary } = req.body

  db.prepare(`
    UPDATE student_profiles SET
      real_name = COALESCE(?, real_name),
      gender = COALESCE(?, gender),
      birthday = COALESCE(?, birthday),
      school = COALESCE(?, school),
      major = COALESCE(?, major),
      grade = COALESCE(?, grade),
      gpa = COALESCE(?, gpa),
      skills = COALESCE(?, skills),
      resume_url = COALESCE(?, resume_url),
      self_intro = COALESCE(?, self_intro),
      target_position = COALESCE(?, target_position),
      target_city = COALESCE(?, target_city),
      expected_salary = COALESCE(?, expected_salary),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    real_name ?? null, gender ?? null, birthday ?? null, school ?? null, major ?? null,
    grade ?? null, gpa ?? null, skills ?? null, resume_url ?? null, self_intro ?? null,
    target_position ?? null, target_city ?? null, expected_salary ?? null, profile.id
  )

  const updated = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(profile.id)

  res.json({
    success: true,
    message: '档案更新成功',
    data: updated,
  })
})

router.post('/my/projects', auth, requireRole('student'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
  if (!profile) {
    res.status(404).json({ success: false, error: '学生档案不存在' })
    return
  }

  const { name, role, start_date, end_date, description, tech_stack, link } = req.body
  const result = db.prepare(`
    INSERT INTO projects (student_id, name, role, start_date, end_date, description, tech_stack, link)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(profile.id, name, role ?? null, start_date ?? null, end_date ?? null, description ?? null, tech_stack ?? null, link ?? null)

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, message: '项目添加成功', data: project })
})

router.put('/my/projects/:id', auth, requireRole('student'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
  if (!profile) {
    res.status(404).json({ success: false, error: '学生档案不存在' })
    return
  }

  const { name, role, start_date, end_date, description, tech_stack, link } = req.body
  db.prepare(`
    UPDATE projects SET
      name = COALESCE(?, name),
      role = COALESCE(?, role),
      start_date = COALESCE(?, start_date),
      end_date = COALESCE(?, end_date),
      description = COALESCE(?, description),
      tech_stack = COALESCE(?, tech_stack),
      link = COALESCE(?, link),
      updated_at = datetime('now')
    WHERE id = ? AND student_id = ?
  `).run(name ?? null, role ?? null, start_date ?? null, end_date ?? null, description ?? null, tech_stack ?? null, link ?? null, Number(req.params.id), profile.id)

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(Number(req.params.id))
  res.json({ success: true, message: '项目更新成功', data: project })
})

router.delete('/my/projects/:id', auth, requireRole('student'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
  if (!profile) {
    res.status(404).json({ success: false, error: '学生档案不存在' })
    return
  }

  db.prepare('DELETE FROM projects WHERE id = ? AND student_id = ?').run(Number(req.params.id), profile.id)
  res.json({ success: true, message: '项目删除成功' })
})

router.post('/my/certificates', auth, requireRole('student'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
  if (!profile) {
    res.status(404).json({ success: false, error: '学生档案不存在' })
    return
  }

  const { title, issuer, issue_date, certificate_url, description } = req.body
  const result = db.prepare(`
    INSERT INTO certificates (student_id, title, issuer, issue_date, certificate_url, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(profile.id, title, issuer, issue_date, certificate_url ?? null, description ?? null)

  const cert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, message: '证书添加成功', data: cert })
})

router.delete('/my/certificates/:id', auth, requireRole('student'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
  if (!profile) {
    res.status(404).json({ success: false, error: '学生档案不存在' })
    return
  }

  db.prepare('DELETE FROM certificates WHERE id = ? AND student_id = ?').run(Number(req.params.id), profile.id)
  res.json({ success: true, message: '证书删除成功' })
})

router.get('/my/journals', auth, requireRole('student'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
  if (!profile) {
    res.status(404).json({ success: false, error: '学生档案不存在' })
    return
  }

  const { page = 1, limit = 10 } = req.query
  const journals = db.prepare('SELECT * FROM journal_entries WHERE student_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?').all(profile.id, Number(limit), (Number(page) - 1) * Number(limit))
  const total = db.prepare('SELECT COUNT(*) as c FROM journal_entries WHERE student_id = ?').get(profile.id) as { c: number }

  res.json({
    success: true,
    data: { list: journals, total: total.c, page: Number(page), limit: Number(limit) },
  })
})

router.post('/my/journals', auth, requireRole('student'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
  if (!profile) {
    res.status(404).json({ success: false, error: '学生档案不存在' })
    return
  }

  const { title, content, mood, tags, is_public } = req.body
  const result = db.prepare(`
    INSERT INTO journal_entries (student_id, title, content, mood, tags, is_public)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(profile.id, title, content, mood ?? null, tags ?? null, is_public ? 1 : 0)

  const journal = db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ success: true, message: '日志创建成功', data: journal })
})

router.put('/my/journals/:id', auth, requireRole('student'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
  if (!profile) {
    res.status(404).json({ success: false, error: '学生档案不存在' })
    return
  }

  const { title, content, mood, tags, is_public } = req.body
  db.prepare(`
    UPDATE journal_entries SET
      title = COALESCE(?, title),
      content = COALESCE(?, content),
      mood = COALESCE(?, mood),
      tags = COALESCE(?, tags),
      is_public = COALESCE(?, is_public),
      updated_at = datetime('now')
    WHERE id = ? AND student_id = ?
  `).run(title ?? null, content ?? null, mood ?? null, tags ?? null, is_public !== undefined ? (is_public ? 1 : 0) : null, Number(req.params.id), profile.id)

  const journal = db.prepare('SELECT * FROM journal_entries WHERE id = ?').get(Number(req.params.id))
  res.json({ success: true, message: '日志更新成功', data: journal })
})

router.delete('/my/journals/:id', auth, requireRole('student'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
  if (!profile) {
    res.status(404).json({ success: false, error: '学生档案不存在' })
    return
  }

  db.prepare('DELETE FROM journal_entries WHERE id = ? AND student_id = ?').run(Number(req.params.id), profile.id)
  res.json({ success: true, message: '日志删除成功' })
})

router.get('/my/reports', auth, requireRole('student'), async (req: Request, res: Response): Promise<void> => {
  const db = getDb()
  const profile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(req.user!.userId) as { id: number } | undefined
  if (!profile) {
    res.status(404).json({ success: false, error: '学生档案不存在' })
    return
  }

  const reports = db.prepare('SELECT * FROM assessment_reports WHERE student_id = ? ORDER BY created_at DESC').all(profile.id)
  res.json({ success: true, data: reports })
})

export default router

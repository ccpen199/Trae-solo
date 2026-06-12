import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/institutions/review', async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = req.headers['x-user-role']
    if (userRole !== 'admin') {
      res.status(403).json({ success: false, error: '仅管理员可访问' })
      return
    }
    const { status } = req.query
    let institutions
    if (status) {
      institutions = db.prepare(`
        SELECT ip.*, u.phone, u.verified, u.name as user_name
        FROM institution_profiles ip
        JOIN users u ON ip.user_id = u.id
        WHERE ip.review_status = ?
      `).all(status)
    } else {
      institutions = db.prepare(`
        SELECT ip.*, u.phone, u.verified, u.name as user_name
        FROM institution_profiles ip
        JOIN users u ON ip.user_id = u.id
      `).all()
    }
    res.json({ success: true, data: institutions })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/institutions/:id/review', async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = req.headers['x-user-role']
    if (userRole !== 'admin') {
      res.status(403).json({ success: false, error: '仅管理员可操作' })
      return
    }
    const { review_status, last_review_date } = req.body
    if (!['approved', 'rejected', 'pending'].includes(review_status)) {
      res.status(400).json({ success: false, error: '无效的审核状态' })
      return
    }
    const existing = db.prepare('SELECT * FROM institution_profiles WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '机构不存在' })
      return
    }
    db.prepare('UPDATE institution_profiles SET review_status = ?, last_review_date = COALESCE(?, last_review_date) WHERE id = ?').run(review_status, last_review_date || new Date().toISOString().split('T')[0], req.params.id)
    if (review_status === 'approved') {
      db.prepare('UPDATE users SET verified = 1 WHERE id = ?').run(existing.user_id)
    }
    const institution = db.prepare('SELECT * FROM institution_profiles WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: institution })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/jobs/review', async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = req.headers['x-user-role']
    if (userRole !== 'admin') {
      res.status(403).json({ success: false, error: '仅管理员可访问' })
      return
    }
    const { status } = req.query
    let jobs
    if (status) {
      jobs = db.prepare(`
        SELECT j.*, ip.institution_name, ip.institution_type
        FROM jobs j
        JOIN institution_profiles ip ON j.institution_id = ip.id
        WHERE j.status = ?
      `).all(status)
    } else {
      jobs = db.prepare(`
        SELECT j.*, ip.institution_name, ip.institution_type
        FROM jobs j
        JOIN institution_profiles ip ON j.institution_id = ip.id
      `).all()
    }
    res.json({ success: true, data: jobs })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/jobs/:id/review', async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = req.headers['x-user-role']
    if (userRole !== 'admin') {
      res.status(403).json({ success: false, error: '仅管理员可操作' })
      return
    }
    const { status, ai_review_note } = req.body
    if (!['active', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, error: '无效的审核状态' })
      return
    }
    const existing = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '职位不存在' })
      return
    }
    db.prepare('UPDATE jobs SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, req.params.id)
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: { job, ai_review_note: ai_review_note || `AI审核完成，风险评分: ${existing.ai_risk_score}/100` } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/resumes/mask', async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = req.headers['x-user-role']
    if (userRole !== 'admin') {
      res.status(403).json({ success: false, error: '仅管理员可操作' })
      return
    }
    const { resume_ids } = req.body
    if (!resume_ids || !Array.isArray(resume_ids) || resume_ids.length === 0) {
      res.status(400).json({ success: false, error: '请提供简历ID列表' })
      return
    }
    const masked: any[] = []
    for (const rid of resume_ids) {
      const resume = db.prepare('SELECT r.*, u.name as talent_name FROM resumes r JOIN talent_profiles tp ON r.talent_id = tp.id JOIN users u ON tp.user_id = u.id WHERE r.id = ?').get(rid) as any
      if (!resume) continue
      const basicInfo = JSON.parse(resume.basic_info || '{}')
      if (basicInfo.phone) basicInfo.phone = basicInfo.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
      if (basicInfo.email) basicInfo.email = basicInfo.email.replace(/(.{2}).*(@.*)/, '$1***$2')
      const maskedName = resume.talent_name ? resume.talent_name.charAt(0) + '**' : '***'
      masked.push({
        id: resume.id,
        talent_name: maskedName,
        basic_info: basicInfo,
        masked_fields: ['phone', 'email', 'real_name'],
      })
    }
    res.json({ success: true, data: masked })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = req.headers['x-user-role']
    if (userRole !== 'admin') {
      res.status(403).json({ success: false, error: '仅管理员可访问' })
      return
    }

    const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count
    const totalTalents = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'talent'").get() as any).count
    const totalInstitutions = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'institution'").get() as any).count
    const totalJobs = (db.prepare('SELECT COUNT(*) as count FROM jobs').get() as any).count
    const activeJobs = (db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'active'").get() as any).count
    const totalApplications = (db.prepare('SELECT COUNT(*) as count FROM applications').get() as any).count
    const totalResumes = (db.prepare('SELECT COUNT(*) as count FROM resumes').get() as any).count
    const pendingReviews = (db.prepare("SELECT COUNT(*) as count FROM institution_profiles WHERE review_status = 'pending'").get() as any).count
    const pendingJobs = (db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'pending'").get() as any).count

    const regionHeatmap = db.prepare(`
      SELECT j.location as region, COUNT(*) as count
      FROM jobs j WHERE j.status = 'active' GROUP BY j.location ORDER BY count DESC
    `).all()

    const departmentHeatmap = db.prepare(`
      SELECT j.department, COUNT(*) as count
      FROM jobs j WHERE j.status = 'active' GROUP BY j.department ORDER BY count DESC
    `).all()

    const positionHeatmap = db.prepare(`
      SELECT j.required_title as position, COUNT(*) as count
      FROM jobs j WHERE j.status = 'active' GROUP BY j.required_title ORDER BY count DESC
    `).all()

    const applicationStatusDist = db.prepare(`
      SELECT status, COUNT(*) as count FROM applications GROUP BY status
    `).all()

    const monthlyApplications = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM applications GROUP BY month ORDER BY month DESC LIMIT 6
    `).all()

    const monthlyJobs = db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM jobs GROUP BY month ORDER BY month DESC LIMIT 6
    `).all()

    res.json({
      success: true,
      data: {
        overview: { totalUsers, totalTalents, totalInstitutions, totalJobs, activeJobs, totalApplications, totalResumes, pendingReviews, pendingJobs },
        heatmaps: { region: regionHeatmap, department: departmentHeatmap, position: positionHeatmap },
        distributions: { applicationStatus: applicationStatusDist },
        trends: { applications: monthlyApplications, jobs: monthlyJobs },
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router

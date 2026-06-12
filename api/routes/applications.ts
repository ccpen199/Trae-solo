import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

const VALID_TRANSITIONS: Record<string, string[]> = {
  applied: ['read', 'rejected'],
  read: ['invited', 'rejected'],
  invited: ['interview', 'rejected'],
  interview: ['offered', 'rejected'],
  offered: [],
  rejected: [],
}

const STATUS_TIMESTAMP_FIELDS: Record<string, string> = {
  read: 'read_at',
  invited: 'invited_at',
  interview: 'interview_at',
  offered: 'offered_at',
  rejected: 'rejected_at',
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    const userRole = req.headers['x-user-role']
    if (!userId) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }

    let applications
    if (userRole === 'talent') {
      const talent = db.prepare('SELECT id FROM talent_profiles WHERE user_id = ?').get(userId) as any
      if (!talent) {
        res.status(404).json({ success: false, error: '人才资料不存在' })
        return
      }
      applications = db.prepare(`
        SELECT a.*, j.title as job_title, j.department, j.location, j.salary_min, j.salary_max,
        ip.institution_name, ip.institution_type
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        JOIN institution_profiles ip ON j.institution_id = ip.id
        WHERE a.talent_id = ?
        ORDER BY a.created_at DESC
      `).all(talent.id)
    } else if (userRole === 'institution') {
      const instProfile = db.prepare('SELECT id FROM institution_profiles WHERE user_id = ?').get(userId) as any
      if (!instProfile) {
        res.status(404).json({ success: false, error: '机构资料不存在' })
        return
      }
      const { status } = req.query
      if (status) {
        applications = db.prepare(`
          SELECT a.*, j.title as job_title, j.department, tp.title as talent_title, tp.department as talent_dept, u.name as talent_name
          FROM applications a
          JOIN jobs j ON a.job_id = j.id
          JOIN talent_profiles tp ON a.talent_id = tp.id
          JOIN users u ON tp.user_id = u.id
          WHERE j.institution_id = ? AND a.status = ?
          ORDER BY a.created_at DESC
        `).all(instProfile.id, status)
      } else {
        applications = db.prepare(`
          SELECT a.*, j.title as job_title, j.department, tp.title as talent_title, tp.department as talent_dept, u.name as talent_name
          FROM applications a
          JOIN jobs j ON a.job_id = j.id
          JOIN talent_profiles tp ON a.talent_id = tp.id
          JOIN users u ON tp.user_id = u.id
          WHERE j.institution_id = ?
          ORDER BY a.created_at DESC
        `).all(instProfile.id)
      }
    } else {
      applications = db.prepare(`
        SELECT a.*, j.title as job_title, j.department, ip.institution_name,
        tp.title as talent_title, u.name as talent_name
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        JOIN institution_profiles ip ON j.institution_id = ip.id
        JOIN talent_profiles tp ON a.talent_id = tp.id
        JOIN users u ON tp.user_id = u.id
        ORDER BY a.created_at DESC
      `).all()
    }
    res.json({ success: true, data: applications })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/funnel', async (req: Request, res: Response): Promise<void> => {
  try {
    const funnelStats = db.prepare(`
      SELECT status, COUNT(*) as count FROM applications GROUP BY status ORDER BY
        CASE status
          WHEN 'applied' THEN 1
          WHEN 'read' THEN 2
          WHEN 'invited' THEN 3
          WHEN 'interview' THEN 4
          WHEN 'offered' THEN 5
          WHEN 'rejected' THEN 6
        END
    `).all() as any[]

    const funnelMap: Record<string, number> = {
      applied: 0,
      read: 0,
      invited: 0,
      interview: 0,
      offered: 0,
      rejected: 0,
    }
    for (const stat of funnelStats) {
      funnelMap[stat.status] = stat.count
    }

    const result = [
      { status: 'applied', label: '已投递', count: funnelMap.applied },
      { status: 'read', label: '已查看', count: funnelMap.read },
      { status: 'invited', label: '已邀请', count: funnelMap.invited },
      { status: 'interview', label: '面试中', count: funnelMap.interview },
      { status: 'offered', label: '已录用', count: funnelMap.offered },
    ]

    res.json({ success: true, data: result })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    const userRole = req.headers['x-user-role']
    if (!userId || userRole !== 'talent') {
      res.status(403).json({ success: false, error: '仅人才用户可投递' })
      return
    }
    const { job_id } = req.body
    if (!job_id) {
      res.status(400).json({ success: false, error: '缺少职位ID' })
      return
    }
    const talent = db.prepare('SELECT id FROM talent_profiles WHERE user_id = ?').get(userId) as any
    if (!talent) {
      res.status(404).json({ success: false, error: '人才资料不存在' })
      return
    }
    const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND status = ?').get(job_id, 'active') as any
    if (!job) {
      res.status(404).json({ success: false, error: '职位不存在或已关闭' })
      return
    }
    const existing = db.prepare('SELECT id FROM applications WHERE job_id = ? AND talent_id = ?').get(job_id, talent.id)
    if (existing) {
      res.status(409).json({ success: false, error: '已投递过该职位' })
      return
    }
    const timeline = JSON.stringify([{ status: 'applied', at: new Date().toISOString() }])
    const result = db.prepare('INSERT INTO applications (job_id, talent_id, status, timeline) VALUES (?, ?, ?, ?)').run(job_id, talent.id, 'applied', timeline)
    const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: application })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.patch('/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    const userRole = req.headers['x-user-role']
    if (!userId) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }
    const { status, note } = req.body
    if (!status) {
      res.status(400).json({ success: false, error: '缺少状态' })
      return
    }
    const application = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id) as any
    if (!application) {
      res.status(404).json({ success: false, error: '投递记录不存在' })
      return
    }
    const currentStatus = application.status
    const validNext = VALID_TRANSITIONS[currentStatus]
    if (!validNext || !validNext.includes(status)) {
      res.status(400).json({ success: false, error: `无法从 ${currentStatus} 转换到 ${status}` })
      return
    }
    if (userRole === 'talent' && status !== 'applied') {
      res.status(403).json({ success: false, error: '人才用户无法更改投递状态' })
      return
    }
    const timeline = JSON.parse(application.timeline || '[]')
    const entry: any = { status, at: new Date().toISOString() }
    if (note) entry.note = note
    timeline.push(entry)

    const timestampField = STATUS_TIMESTAMP_FIELDS[status]
    const now = new Date().toISOString()

    let updateQuery = 'UPDATE applications SET status = ?, timeline = ?, updated_at = datetime(\'now\')'
    const updateParams: any[] = [status, JSON.stringify(timeline)]

    if (timestampField) {
      updateQuery += `, ${timestampField} = ?`
      updateParams.push(now)
    }

    updateQuery += ' WHERE id = ?'
    updateParams.push(req.params.id)

    db.prepare(updateQuery).run(...updateParams)

    const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const application = db.prepare(`
      SELECT a.*, j.title as job_title, j.department, j.location, j.salary_min, j.salary_max, j.description as job_description,
      ip.institution_name, ip.institution_type,
      tp.title as talent_title, tp.department as talent_dept, u.name as talent_name
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN institution_profiles ip ON j.institution_id = ip.id
      JOIN talent_profiles tp ON a.talent_id = tp.id
      JOIN users u ON tp.user_id = u.id
      WHERE a.id = ?
    `).get(req.params.id) as any
    if (!application) {
      res.status(404).json({ success: false, error: '投递记录不存在' })
      return
    }
    application.timeline = JSON.parse(application.timeline || '[]')
    res.json({ success: true, data: application })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router

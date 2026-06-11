import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'
import crypto from 'crypto'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { job_id, student_id, status, date, page = '1', pageSize = '10' } = req.query
    const db = getDb()

    let sql = `SELECT a.*, u.name as student_name, j.title as job_title FROM attendance a JOIN student_profiles sp ON a.student_id = sp.id JOIN users u ON sp.user_id = u.id JOIN jobs j ON a.job_id = j.id WHERE 1=1`
    const params: any[] = []

    if (job_id) {
      sql += ` AND a.job_id = ?`
      params.push(job_id)
    }
    if (student_id) {
      sql += ` AND a.student_id = ?`
      params.push(student_id)
    }
    if (status) {
      sql += ` AND a.status = ?`
      params.push(status)
    }
    if (date) {
      sql += ` AND DATE(a.checkin_time) = ?`
      params.push(date)
    }

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM (${sql})`).get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    sql += ` ORDER BY a.checkin_time DESC LIMIT ? OFFSET ?`
    params.push(Number(pageSize), offset)

    const records = db.prepare(sql).all(...params)

    res.json({
      success: true,
      data: {
        items: records,
        total: countResult.total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取考勤记录失败' })
  }
})

router.post('/checkin', async (req: Request, res: Response): Promise<void> => {
  try {
    const { job_id, student_id, method, location, qrcode_token } = req.body

    if (!job_id || !student_id) {
      res.status(400).json({ success: false, error: '岗位ID和学生ID不能为空' })
      return
    }

    const db = getDb()

    const today = new Date().toISOString().split('T')[0]
    const existing = db.prepare(
      `SELECT * FROM attendance WHERE job_id = ? AND student_id = ? AND DATE(checkin_time) = ?`
    ).get(job_id, student_id, today) as any

    if (existing) {
      if (existing.checkout_time) {
        res.status(400).json({ success: false, error: '今日已完成签到签退' })
        return
      }
      db.prepare('UPDATE attendance SET checkout_time = CURRENT_TIMESTAMP WHERE id = ?').run(existing.id)
      const updated = db.prepare('SELECT * FROM attendance WHERE id = ?').get(existing.id)
      res.json({ success: true, data: updated })
      return
    }

    const hour = new Date().getHours()
    const status = hour >= 9 ? 'late' : 'normal'

    const result = db.prepare(
      `INSERT INTO attendance (job_id, student_id, checkin_time, method, status, location) VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, ?)`
    ).run(job_id, student_id, method || 'qrcode', status, location || '')

    const record = db.prepare('SELECT * FROM attendance WHERE id = ?').get(result.lastInsertRowid)

    res.status(201).json({ success: true, data: record })
  } catch (error) {
    res.status(500).json({ success: false, error: '签到失败' })
  }
})

router.get('/qrcode', async (req: Request, res: Response): Promise<void> => {
  try {
    const { job_id } = req.query
    if (!job_id) {
      res.status(400).json({ success: false, error: '岗位ID不能为空' })
      return
    }

    const db = getDb()
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(job_id) as any
    if (!job) {
      res.status(404).json({ success: false, error: '岗位不存在' })
      return
    }

    const token = crypto.randomBytes(16).toString('hex')
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    res.json({
      success: true,
      data: {
        qrcode_token: token,
        job_id: Number(job_id),
        job_title: job.title,
        expires_at: expiresAt
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '生成二维码失败' })
  }
})

router.put('/:id/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, checkout_time } = req.body

    const db = getDb()
    const record = db.prepare('SELECT * FROM attendance WHERE id = ?').get(req.params.id) as any
    if (!record) {
      res.status(404).json({ success: false, error: '考勤记录不存在' })
      return
    }

    if (status) {
      db.prepare('UPDATE attendance SET status = ? WHERE id = ?').run(status, req.params.id)
    }
    if (checkout_time) {
      db.prepare('UPDATE attendance SET checkout_time = ? WHERE id = ?').run(checkout_time, req.params.id)
    }

    const updated = db.prepare('SELECT * FROM attendance WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '核验考勤失败' })
  }
})

export default router

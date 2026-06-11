import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

const riskConfig: Record<string, any> = {
  overtime_threshold_hours: 8,
  overtime_weekly_hours: 28,
  unsigned_contract_days: 3,
  late_threshold_count: 3,
  auto_alert: true
}

router.get('/alerts', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, level, status, org_id, page = '1', pageSize = '10' } = req.query
    const db = getDb()

    let sql = `SELECT ra.*, o.name as org_name, u.name as related_user_name FROM risk_alerts ra LEFT JOIN organizations o ON ra.org_id = o.id LEFT JOIN users u ON ra.related_user_id = u.id WHERE 1=1`
    const params: any[] = []

    if (type) {
      sql += ` AND ra.type = ?`
      params.push(type)
    }
    if (level) {
      sql += ` AND ra.level = ?`
      params.push(level)
    }
    if (status) {
      sql += ` AND ra.status = ?`
      params.push(status)
    }
    if (org_id) {
      sql += ` AND ra.org_id = ?`
      params.push(org_id)
    }

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM (${sql})`).get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    sql += ` ORDER BY ra.created_at DESC LIMIT ? OFFSET ?`
    params.push(Number(pageSize), offset)

    const alerts = db.prepare(sql).all(...params)

    res.json({
      success: true,
      data: {
        items: alerts,
        total: countResult.total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取预警列表失败' })
  }
})

router.put('/alerts/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body

    if (!status || !['resolved', 'ignored'].includes(status)) {
      res.status(400).json({ success: false, error: '处理状态必须为 resolved 或 ignored' })
      return
    }

    const db = getDb()
    const alert = db.prepare('SELECT * FROM risk_alerts WHERE id = ?').get(req.params.id) as any
    if (!alert) {
      res.status(404).json({ success: false, error: '预警记录不存在' })
      return
    }

    db.prepare('UPDATE risk_alerts SET status = ? WHERE id = ?').run(status, req.params.id)

    const updated = db.prepare(`
      SELECT ra.*, o.name as org_name, u.name as related_user_name
      FROM risk_alerts ra
      LEFT JOIN organizations o ON ra.org_id = o.id
      LEFT JOIN users u ON ra.related_user_id = u.id
      WHERE ra.id = ?
    `).get(req.params.id)

    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '处理预警失败' })
  }
})

router.get('/config', async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, data: riskConfig })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取预警配置失败' })
  }
})

export default router

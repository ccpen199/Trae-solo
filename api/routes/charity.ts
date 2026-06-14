import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db/init.js'

const router = Router()

router.get('/donations', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { user_id, project_id, status, page = '1', pageSize = '10' } = req.query

    let sql = `SELECT d.*, u.nickname as user_name, p.name as project_name, o.category FROM charity_donations d JOIN users u ON d.user_id = u.id JOIN charity_projects p ON d.project_id = p.id JOIN orders o ON d.order_id = o.id WHERE 1=1`
    const params: unknown[] = []

    if (user_id) {
      sql += ` AND d.user_id = ?`
      params.push(user_id)
    }
    if (project_id) {
      sql += ` AND d.project_id = ?`
      params.push(project_id)
    }
    if (status) {
      sql += ` AND d.status = ?`
      params.push(status)
    }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM charity_donations d WHERE 1=1${sql.split('WHERE 1=1')[1]?.split('ORDER')[0] || ''}`).get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    sql += ` ORDER BY d.created_at DESC LIMIT ? OFFSET ?`
    params.push(Number(pageSize), offset)

    const donations = db.prepare(sql).all(...params)

    res.json({
      success: true,
      data: {
        list: donations,
        total: countRow.total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取捐赠记录失败' })
  }
})

router.get('/projects', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const projects = db.prepare(`SELECT p.*, (SELECT COUNT(*) FROM charity_donations d WHERE d.project_id = p.id) as donation_count FROM charity_projects p ORDER BY p.start_date DESC`).all()

    res.json({ success: true, data: projects })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取公益项目失败' })
  }
})

router.post('/donate', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { user_id, order_id, project_id, amount } = req.body

    if (!user_id || !order_id || !project_id || !amount) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const order = db.prepare(`SELECT * FROM orders WHERE id = ? AND user_id = ?`).get(order_id, user_id) as Record<string, unknown> | undefined
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' })
      return
    }

    const project = db.prepare(`SELECT * FROM charity_projects WHERE id = ?`).get(project_id) as Record<string, unknown> | undefined
    if (!project) {
      res.status(404).json({ success: false, error: '公益项目不存在' })
      return
    }

    const id = uuidv4()
    const certificate = `CERT-${id.slice(0, 8).toUpperCase()}`

    db.prepare(`INSERT INTO charity_donations (id, user_id, order_id, project_id, amount, status, certificate) VALUES (?, ?, ?, ?, ?, 'completed', ?)`).run(
      id, user_id, order_id, project_id, amount, certificate
    )

    db.prepare(`UPDATE charity_projects SET total_raised = total_raised + ? WHERE id = ?`).run(amount, project_id)
    db.prepare(`UPDATE orders SET status = 'donated', updated_at = datetime('now') WHERE id = ?`).run(order_id)
    db.prepare(`UPDATE users SET charity_count = charity_count + 1, updated_at = datetime('now') WHERE id = ?`).run(user_id)

    const donation = db.prepare(`SELECT d.*, p.name as project_name FROM charity_donations d JOIN charity_projects p ON d.project_id = p.id WHERE d.id = ?`).get(id)

    res.status(201).json({
      success: true,
      data: donation,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '捐赠失败' })
  }
})

export default router

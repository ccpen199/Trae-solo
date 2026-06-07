import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'
import { adminMiddleware } from '../middleware/auth.js'

const router = Router()

router.use(adminMiddleware)

router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const total_users = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count
    const total_news = (db.prepare('SELECT COUNT(*) as count FROM news').get() as any).count
    const total_products = (db.prepare('SELECT COUNT(*) as count FROM products').get() as any).count
    const total_orders = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as any).count
    const total_merchants = (db.prepare('SELECT COUNT(*) as count FROM merchants').get() as any).count
    const total_revenue = (db.prepare("SELECT COALESCE(SUM(total_price), 0) as sum FROM orders WHERE status = 'paid'").get() as any).sum
    const today_new_users = (db.prepare("SELECT COUNT(*) as count FROM users WHERE date(created_at) = date('now')").get() as any).count
    const today_new_orders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE date(created_at) = date('now')").get() as any).count

    res.json({
      success: true,
      data: { total_users, total_news, total_products, total_orders, total_merchants, total_revenue, today_new_users, today_new_orders }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取统计信息失败' })
  }
})

router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', pageSize = '10', role, keyword, status } = req.query
    const p = Number(page)
    const ps = Number(pageSize)
    const offset = (p - 1) * ps

    const conditions: string[] = []
    const params: any[] = []

    if (role) {
      conditions.push('role = ?')
      params.push(role)
    }
    if (status) {
      conditions.push('status = ?')
      params.push(status)
    }
    if (keyword) {
      conditions.push('(username LIKE ? OR real_name LIKE ? OR phone LIKE ?)')
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`)
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const total = (db.prepare(`SELECT COUNT(*) as count FROM users ${whereClause}`).get(...params) as any).count

    const list = db.prepare(`
      SELECT id, username, phone, real_name, avatar, role, region_code, status, created_at, updated_at
      FROM users ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, ps, offset)

    res.json({ success: true, data: { list, total, page: p, pageSize: ps } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户列表失败' })
  }
})

router.put('/users/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { role, status } = req.body

    const result = db.prepare(`
      UPDATE users SET role = COALESCE(?, role), status = COALESCE(?, status), updated_at = datetime('now') WHERE id = ?
    `).run(role, status, id)

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新用户失败' })
  }
})

router.get('/activity-logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', pageSize = '10', user_id, action } = req.query
    const p = Number(page)
    const ps = Number(pageSize)
    const offset = (p - 1) * ps

    const conditions: string[] = []
    const params: any[] = []

    if (user_id) {
      conditions.push('al.user_id = ?')
      params.push(user_id)
    }
    if (action) {
      conditions.push('al.action = ?')
      params.push(action)
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const total = (db.prepare(`SELECT COUNT(*) as count FROM activity_logs al ${whereClause}`).get(...params) as any).count

    const list = db.prepare(`
      SELECT al.*, u.username
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, ps, offset)

    res.json({ success: true, data: { list, total, page: p, pageSize: ps } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取活动日志失败' })
  }
})

router.get('/user-behavior', async (_req: Request, res: Response): Promise<void> => {
  try {
    const actionCounts = db.prepare(`
      SELECT action, COUNT(*) as count
      FROM activity_logs
      GROUP BY action
      ORDER BY count DESC
    `).all()

    const dailyActiveUsers = db.prepare(`
      SELECT date(created_at) as date, COUNT(DISTINCT user_id) as count
      FROM activity_logs
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all()

    const topActiveUsers = db.prepare(`
      SELECT u.id, u.username, COUNT(al.id) as activity_count
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      GROUP BY al.user_id
      ORDER BY activity_count DESC
      LIMIT 10
    `).all()

    res.json({ success: true, data: { action_counts: actionCounts, daily_active_users: dailyActiveUsers, top_active_users: topActiveUsers } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户行为数据失败' })
  }
})

router.get('/regional-stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = db.prepare(`
      SELECT r.code as region_code, r.name as region_name,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT o.id) as order_count
      FROM regions r
      LEFT JOIN users u ON u.region_code = r.code
      LEFT JOIN orders o ON o.user_id = u.id
      GROUP BY r.code
      ORDER BY r.sort_order
    `).all()

    res.json({ success: true, data: stats })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取地区统计失败' })
  }
})

export default router

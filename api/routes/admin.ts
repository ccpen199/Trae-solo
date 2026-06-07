import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import authMiddleware from '../middleware/auth.js'

const router = Router()

interface AuthRequest extends Request {
  user?: any
}

const adminCheck = (req: AuthRequest, res: Response, next: Function) => {
  if (req.user && req.user.role === 'admin') {
    next()
  } else {
    res.status(403).json({ success: false, error: '需要管理员权限' })
  }
}

router.get('/reviews', authMiddleware, adminCheck, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const status = req.query.status as string || 'pending'

    let whereSql = 'WHERE review_status = ?'
    let params: any[] = [status]

    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM contents ${whereSql}`)
    const total = (countStmt.get(...params) as any).count

    const offset = (page - 1) * pageSize
    const reviewsStmt = db.prepare(`
      SELECT c.*, u.nickname as author_name, u.avatar as author_avatar
      FROM contents c
      LEFT JOIN users u ON c.author_id = u.id
      ${whereSql}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `)
    const reviews = reviewsStmt.all(...params, pageSize, offset) as any[]

    const reviewsWithMedia = reviews.map(r => ({
      ...r,
      media_urls: r.media_urls ? JSON.parse(r.media_urls) : [],
      tags: r.tags ? JSON.parse(r.tags) : []
    }))

    res.status(200).json({
      success: true,
      data: {
        list: reviewsWithMedia,
        total,
        page,
        pageSize
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取审核列表失败' })
  }
})

router.post('/reviews/:id', authMiddleware, adminCheck, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { result, reason } = req.body

    if (!result || !['approved', 'rejected'].includes(result)) {
      res.status(400).json({ success: false, error: '审核结果无效' })
      return
    }

    const content = db.prepare('SELECT * FROM contents WHERE id = ?').get(id) as any
    if (!content) {
      res.status(404).json({ success: false, error: '内容不存在' })
      return
    }

    db.prepare(`
      UPDATE contents SET review_status = ? WHERE id = ?
    `).run(result, id)

    db.prepare(`
      INSERT INTO content_reviews (content_id, reviewer_id, result, reason)
      VALUES (?, ?, ?, ?)
    `).run(id, req.user.id, result, reason || null)

    const updatedContent = db.prepare('SELECT * FROM contents WHERE id = ?').get(id) as any

    res.status(200).json({
      success: true,
      data: {
        content: updatedContent,
        message: `审核${result === 'approved' ? '通过' : '拒绝'}`
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '审核失败' })
  }
})

router.get('/kols', authMiddleware, adminCheck, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10

    const offset = (page - 1) * pageSize

    const countStmt = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'host' OR certification_status = 'approved'")
    const total = (countStmt.get() as any).count

    const kolsStmt = db.prepare(`
      SELECT u.*,
        (SELECT COUNT(*) FROM lives l WHERE l.host_id = u.id) as live_count,
        (SELECT COUNT(*) FROM contents c WHERE c.author_id = u.id) as content_count,
        (SELECT SUM(viewer_count) FROM lives l WHERE l.host_id = u.id) as total_viewers
      FROM users u
      WHERE u.role = 'host' OR u.certification_status = 'approved'
      ORDER BY total_viewers DESC
      LIMIT ? OFFSET ?
    `)
    const kols = kolsStmt.all(pageSize, offset) as any[]

    res.status(200).json({
      success: true,
      data: {
        list: kols,
        total,
        page,
        pageSize
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取KOL列表失败' })
  }
})

router.post('/kols/:id/schedule', authMiddleware, adminCheck, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { live_id, share_ratio, scheduled_at } = req.body

    const kol = db.prepare("SELECT * FROM users WHERE id = ? AND (role = 'host' OR certification_status = 'approved')").get(id) as any
    if (!kol) {
      res.status(404).json({ success: false, error: 'KOL不存在' })
      return
    }

    const stmt = db.prepare(`
      INSERT INTO kol_schedules (kol_id, live_id, share_ratio, scheduled_at)
      VALUES (?, ?, ?, ?)
    `)
    const result = stmt.run(id, live_id || null, share_ratio || 50.00, scheduled_at || null)

    const schedule = db.prepare(`
      SELECT ks.*, u.nickname as kol_name, l.title as live_title
      FROM kol_schedules ks
      LEFT JOIN users u ON ks.kol_id = u.id
      LEFT JOIN lives l ON ks.live_id = l.id
      WHERE ks.id = ?
    `).get(result.lastInsertRowid) as any

    res.status(201).json({
      success: true,
      data: {
        schedule
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '排期失败' })
  }
})

router.get('/companies/annual', authMiddleware, adminCheck, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const status = req.query.status as string

    let whereClauses = ['annual_review_date IS NOT NULL']
    let params: any[] = []

    if (status) {
      whereClauses.push('annual_review_status = ?')
      params.push(status)
    }

    const whereSql = 'WHERE ' + whereClauses.join(' AND ')

    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM renovation_companies ${whereSql}`)
    const total = (countStmt.get(...params) as any).count

    const offset = (page - 1) * pageSize
    const companiesStmt = db.prepare(`
      SELECT * FROM renovation_companies
      ${whereSql}
      ORDER BY annual_review_date ASC
      LIMIT ? OFFSET ?
    `)
    const companies = companiesStmt.all(...params, pageSize, offset) as any[]

    res.status(200).json({
      success: true,
      data: {
        list: companies,
        total,
        page,
        pageSize
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取公司年审列表失败' })
  }
})

router.get('/dashboard', authMiddleware, adminCheck, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count
    const liveCount = (db.prepare('SELECT COUNT(*) as count FROM lives').get() as any).count
    const liveCountLive = (db.prepare("SELECT COUNT(*) as count FROM lives WHERE status = 'live'").get() as any).count
    const propertyCount = (db.prepare('SELECT COUNT(*) as count FROM properties').get() as any).count
    const contentCount = (db.prepare('SELECT COUNT(*) as count FROM contents').get() as any).count
    const contentPending = (db.prepare("SELECT COUNT(*) as count FROM contents WHERE review_status = 'pending'").get() as any).count
    const companyCount = (db.prepare('SELECT COUNT(*) as count FROM renovation_companies').get() as any).count
    const orderCount = (db.prepare('SELECT COUNT(*) as count FROM renovation_orders').get() as any).count

    const totalRevenue = (db.prepare('SELECT COALESCE(SUM(total_amount), 0) as total FROM red_packets').get() as any).total
    const totalViewers = (db.prepare('SELECT COALESCE(SUM(viewer_count), 0) as total FROM lives').get() as any).total

    const recentLives = db.prepare(`
      SELECT l.*, u.nickname as host_name
      FROM lives l
      LEFT JOIN users u ON l.host_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 5
    `).all() as any[]

    const recentProperties = db.prepare(`
      SELECT p.*, u.nickname as publisher_name
      FROM properties p
      LEFT JOIN users u ON p.publisher_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 5
    `).all() as any[]

    const topHosts = db.prepare(`
      SELECT u.*, COUNT(l.id) as live_count, COALESCE(SUM(l.viewer_count), 0) as sum_viewers
      FROM users u
      LEFT JOIN lives l ON u.id = l.host_id
      WHERE u.role = 'host' OR u.certification_status = 'approved'
      GROUP BY u.id
      ORDER BY sum_viewers DESC
      LIMIT 5
    `).all() as any[]

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total_users: userCount,
          total_lives: liveCount,
          live_lives: liveCountLive,
          total_properties: propertyCount,
          total_contents: contentCount,
          pending_contents: contentPending,
          total_companies: companyCount,
          total_orders: orderCount,
          total_revenue: totalRevenue,
          total_viewers: totalViewers
        },
        recent_lives: recentLives,
        recent_properties: recentProperties,
        top_hosts: topHosts.map(h => ({ ...h, total_viewers: h.sum_viewers }))
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取统计数据失败' })
  }
})

export default router

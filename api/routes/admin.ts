import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { toCaseItem } from '../utils.js'

const router = Router()

router.get('/cases/pending', (req: Request, res: Response): void => {
  const { page = '1', limit = '10' } = req.query

  const pageNum = Math.max(1, Number(page))
  const limitNum = Math.max(1, Math.min(50, Number(limit)))
  const offset = (pageNum - 1) * limitNum

  const total = (db.prepare("SELECT COUNT(*) as count FROM cases WHERE status = 'pending'").get() as { count: number }).count

  const rows = db.prepare(`
    SELECT c.*, d.name as designer_name
    FROM cases c LEFT JOIN designers d ON c.designer_id = d.id
    WHERE c.status = 'pending'
    ORDER BY c.created_at ASC
    LIMIT ? OFFSET ?
  `).all(limitNum, offset) as Record<string, unknown>[]

  res.json({
    success: true,
    data: {
      list: rows.map(toCaseItem),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    },
  })
})

router.get('/stats', (_req: Request, res: Response): void => {
  const totalCases = (db.prepare('SELECT COUNT(*) as count FROM cases').get() as { count: number }).count
  const approvedCases = (db.prepare("SELECT COUNT(*) as count FROM cases WHERE status = 'approved'").get() as { count: number }).count
  const pendingCases = (db.prepare("SELECT COUNT(*) as count FROM cases WHERE status = 'pending'").get() as { count: number }).count
  const totalDesigners = (db.prepare('SELECT COUNT(*) as count FROM designers').get() as { count: number }).count
  const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count
  const totalFavorites = (db.prepare('SELECT COUNT(*) as count FROM favorites').get() as { count: number }).count
  const totalAppointments = (db.prepare('SELECT COUNT(*) as count FROM appointments').get() as { count: number }).count
  const totalViews = (db.prepare('SELECT COALESCE(SUM(views), 0) as total FROM cases').get() as { total: number }).total

  res.json({
    success: true,
    data: {
      totalCases,
      approvedCases,
      pendingCases,
      totalDesigners,
      totalUsers,
      totalFavorites,
      totalAppointments,
      totalViews,
    },
  })
})

router.get('/trends/weekly', (_req: Request, res: Response): void => {
  const cases = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as count
    FROM cases
    WHERE created_at >= date('now', '-7 days')
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all()

  const appointments = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as count
    FROM appointments
    WHERE created_at >= date('now', '-7 days')
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all()

  const favorites = db.prepare(`
    SELECT date(created_at) as date, COUNT(*) as count
    FROM favorites
    WHERE created_at >= date('now', '-7 days')
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all()

  res.json({
    success: true,
    data: {
      cases,
      appointments,
      favorites,
    },
  })
})

router.put('/cases/:id/review', (req: Request, res: Response): void => {
  const { id } = req.params
  const { status, reason } = req.body

  if (!['approved', 'rejected'].includes(status)) {
    res.status(400).json({ success: false, error: '无效的审核状态' })
    return
  }

  const existing = db.prepare('SELECT id, status FROM cases WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!existing) {
    res.status(404).json({ success: false, error: '案例不存在' })
    return
  }

  if (existing.status !== 'pending') {
    res.status(400).json({ success: false, error: '该案例已审核' })
    return
  }

  db.prepare("UPDATE cases SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id)

  const row = db.prepare('SELECT * FROM cases WHERE id = ?').get(id) as Record<string, unknown>
  res.json({ success: true, data: { ...toCaseItem(row), reviewReason: reason || null } })
})

export default router

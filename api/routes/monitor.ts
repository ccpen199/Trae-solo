import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'
import { auth, requireAdmin } from '../middleware/auth.js'

const router = Router()

router.get('/statistics', auth, requireAdmin, (req: Request, res: Response): void => {
  const db = getDb()

  const totalApplications = db.prepare('SELECT COUNT(*) as count FROM applications').get() as { count: number }
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM applications GROUP BY status').all()
  const byType = db.prepare('SELECT type, COUNT(*) as count FROM applications GROUP BY type').all()

  const stats = {
    totalApplications: totalApplications.count,
    byStatus: byStatus.reduce((acc: Record<string, number>, row: any) => {
      acc[row.status] = row.count
      return acc
    }, {}),
    byType: byType.reduce((acc: Record<string, number>, row: any) => {
      acc[row.type] = row.count
      return acc
    }, {}),
    avgProcessingTime: 3.5,
  }

  res.json({ ok: true, stats })
})

router.get('/timeout', auth, requireAdmin, (req: Request, res: Response): void => {
  const db = getDb()
  const items = db.prepare(
    "SELECT * FROM monitor_events WHERE type = 'timeout' ORDER BY created_at DESC"
  ).all()

  res.json({ ok: true, items })
})

router.get('/rejection', auth, requireAdmin, (req: Request, res: Response): void => {
  const db = getDb()
  const items = db.prepare(
    "SELECT * FROM monitor_events WHERE type = 'rejection' ORDER BY created_at DESC"
  ).all()

  const totalRejections = items.length
  const byCategory = items.reduce((acc: Record<string, number>, item: any) => {
    acc[item.category] = (acc[item.category] || 0) + 1
    return acc
  }, {})

  const analysis = {
    totalRejections,
    byCategory,
    items,
  }

  res.json({ ok: true, analysis })
})

router.get('/hotspot', auth, requireAdmin, (req: Request, res: Response): void => {
  const db = getDb()
  const items = db.prepare(
    "SELECT * FROM monitor_events WHERE type = 'hotspot' ORDER BY created_at DESC"
  ).all()

  const clusters = items.map((item: any) => ({
    id: item.id,
    category: item.category,
    detail: item.detail,
    severity: item.severity,
    createdAt: item.created_at,
  }))

  res.json({ ok: true, clusters })
})

export default router

import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/traffic', (req: Request, res: Response): void => {
  const db = getDb()

  const rows = db.prepare(
    `SELECT
      DATE(created_at) as date,
      SUM(views) as views,
      SUM(leads) as leads,
      SUM(conversions) as conversions
    FROM posts
    WHERE created_at >= DATE('now', '-30 days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC`
  ).all()

  res.json({ success: true, data: rows })
})

router.get('/funnel', (req: Request, res: Response): void => {
  const db = getDb()

  const totalViews = (db.prepare('SELECT COALESCE(SUM(views), 0) as total FROM posts').get() as { total: number }).total
  const totalClicks = (db.prepare('SELECT COUNT(*) as total FROM post_images').get() as { total: number }).total
  const totalLeads = (db.prepare('SELECT COALESCE(SUM(leads), 0) as total FROM posts').get() as { total: number }).total
  const totalConversions = (db.prepare('SELECT COALESCE(SUM(conversions), 0) as total FROM posts').get() as { total: number }).total

  res.json({
    success: true,
    data: {
      stages: [
        { name: '浏览量', value: totalViews, rate: 1 },
        { name: '点击量', value: totalClicks, rate: totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) / 100 : 0 },
        { name: '线索量', value: totalLeads, rate: totalViews > 0 ? Math.round((totalLeads / totalViews) * 100) / 100 : 0 },
        { name: '转化量', value: totalConversions, rate: totalViews > 0 ? Math.round((totalConversions / totalViews) * 100) / 100 : 0 },
      ],
    },
  })
})

router.get('/audit', (req: Request, res: Response): void => {
  const db = getDb()

  const totalAudits = (db.prepare('SELECT COUNT(*) as count FROM audit_records').get() as { count: number }).count
  const approvedCount = (db.prepare("SELECT COUNT(*) as count FROM audit_records WHERE result = 'approved'").get() as { count: number }).count
  const rejectedCount = (db.prepare("SELECT COUNT(*) as count FROM audit_records WHERE result = 'rejected'").get() as { count: number }).count
  const flaggedCount = (db.prepare("SELECT COUNT(*) as count FROM audit_records WHERE result = 'flagged'").get() as { count: number }).count

  const passRate = totalAudits > 0 ? Math.round((approvedCount / totalAudits) * 100) : 0

  const byStage = db.prepare(
    `SELECT stage, COUNT(*) as count,
      SUM(CASE WHEN result = 'approved' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN result = 'rejected' THEN 1 ELSE 0 END) as rejected,
      SUM(CASE WHEN result = 'flagged' THEN 1 ELSE 0 END) as flagged
    FROM audit_records
    GROUP BY stage`
  ).all()

  const recentAudits = db.prepare(
    `SELECT ar.*, p.title as post_title, u.name as auditor_name
    FROM audit_records ar
    JOIN posts p ON ar.post_id = p.id
    JOIN users u ON ar.auditor_id = u.id
    ORDER BY ar.created_at DESC
    LIMIT 10`
  ).all()

  res.json({
    success: true,
    data: {
      total_audits: totalAudits,
      approved_count: approvedCount,
      rejected_count: rejectedCount,
      flagged_count: flaggedCount,
      pass_rate: passRate,
      by_stage: byStage,
      recent_audits: recentAudits,
    },
  })
})

export default router

import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

router.get('/statistics', (req: Request, res: Response): void => {
  const db = getDb()

  const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM user WHERE user_type = ?').get('insured') as any).count
  const activeInsured = (db.prepare("SELECT COUNT(DISTINCT user_id) as count FROM insurance_record WHERE status = 'active'").get() as any).count
  const totalApplications = (db.prepare('SELECT COUNT(*) as count FROM benefit_application').get() as any).count
  const pendingApplications = (db.prepare("SELECT COUNT(*) as count FROM benefit_application WHERE status = 'pending'").get() as any).count
  const pendingWarnings = (db.prepare("SELECT COUNT(*) as count FROM risk_warning WHERE status = 'pending'").get() as any).count
  const totalServiceLogs = (db.prepare('SELECT COUNT(*) as count FROM service_log').get() as any).count
  const successLogs = (db.prepare("SELECT COUNT(*) as count FROM service_log WHERE status = 'success'").get() as any).count
  const rejectedLogs = (db.prepare("SELECT COUNT(*) as count FROM service_log WHERE status = 'rejected'").get() as any).count

  const avgProcessingTime = db.prepare('SELECT AVG(processing_time) as avg FROM service_log WHERE processing_time IS NOT NULL').get() as any
  const avgSatisfaction = db.prepare('SELECT AVG(satisfaction) as avg FROM service_log WHERE satisfaction IS NOT NULL').get() as any

  const channelStats = db.prepare(`
    SELECT channel, COUNT(*) as count, AVG(processing_time) as avg_processing_time, AVG(satisfaction) as avg_satisfaction
    FROM service_log
    GROUP BY channel
  `).all()

  const businessTypeStats = db.prepare(`
    SELECT business_type, COUNT(*) as count,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
    FROM service_log
    GROUP BY business_type
  `).all()

  const monthlyStats = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
    FROM service_log
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month DESC
    LIMIT 12
  `).all()

  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        activeInsured,
        totalApplications,
        pendingApplications,
        pendingWarnings,
        totalServiceLogs,
        successRate: totalServiceLogs > 0 ? Math.round(successLogs / totalServiceLogs * 10000) / 100 : 0,
        rejectionRate: totalServiceLogs > 0 ? Math.round(rejectedLogs / totalServiceLogs * 10000) / 100 : 0,
        avgProcessingTime: Math.round((avgProcessingTime.avg || 0) * 100) / 100,
        avgSatisfaction: Math.round((avgSatisfaction.avg || 0) * 100) / 100
      },
      channelStats,
      businessTypeStats,
      monthlyStats
    }
  })
})

router.get('/rejection-analysis', (req: Request, res: Response): void => {
  const db = getDb()
  const { startDate, endDate, page = '1', pageSize = '10' } = req.query

  let sql = `SELECT sl.*, u.name as user_name FROM service_log sl LEFT JOIN user u ON sl.user_id = u.id WHERE sl.status = 'rejected'`
  const params: string[] = []

  if (startDate) {
    sql += ' AND sl.created_at >= ?'
    params.push(startDate as string)
  }
  if (endDate) {
    sql += ' AND sl.created_at <= ?'
    params.push(endDate as string)
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM (${sql})`).get(...params) as { count: number }

  const offset = (Number(page) - 1) * Number(pageSize)
  sql += ' ORDER BY sl.created_at DESC LIMIT ? OFFSET ?'
  params.push(String(Number(pageSize)), String(offset))

  const records = db.prepare(sql).all(...params)

  const reasonStats = db.prepare(`
    SELECT rejection_reason, COUNT(*) as count
    FROM service_log
    WHERE status = 'rejected' AND rejection_reason IS NOT NULL
    GROUP BY rejection_reason
    ORDER BY count DESC
  `).all()

  const businessRejectionStats = db.prepare(`
    SELECT business_type,
      COUNT(*) as total,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
      ROUND(AVG(CASE WHEN status = 'rejected' THEN 1.0 ELSE 0.0 END) * 100, 2) as rejection_rate
    FROM service_log
    GROUP BY business_type
    HAVING rejected > 0
    ORDER BY rejection_rate DESC
  `).all()

  res.json({
    success: true,
    data: {
      total: total.count,
      page: Number(page),
      pageSize: Number(pageSize),
      records,
      reasonStats,
      businessRejectionStats
    }
  })
})

export default router

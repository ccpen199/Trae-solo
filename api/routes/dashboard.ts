import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/overview', (_req: Request, res: Response): void => {
  const total_news = (db.prepare('SELECT COUNT(*) as count FROM news').get() as any).count
  const total_complaints = (db.prepare('SELECT COUNT(*) as count FROM complaints').get() as any).count
  const total_services = (db.prepare('SELECT COUNT(*) as count FROM services').get() as any).count
  const total_pois = (db.prepare('SELECT COUNT(*) as count FROM pois').get() as any).count
  const total_media = (db.prepare('SELECT COUNT(*) as count FROM media_contents').get() as any).count
  const total_users = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count

  const resolved = (db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status IN ('resolved','closed')").get() as any).count
  const unresolved = total_complaints - resolved
  const complaint_completion_rate = total_complaints > 0 ? Math.round((resolved / total_complaints) * 100) : 0

  const avgResult = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as total FROM satisfaction_surveys').get() as any
  const avg_satisfaction = avgResult.avg ? Math.round(avgResult.avg * 10) / 10 : 0
  const satisfaction_survey_count = avgResult.total || 0
  const pending_satisfaction = (db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status IN ('resolved') AND id NOT IN (SELECT complaint_id FROM satisfaction_surveys)").get() as any).count

  const active_users = (db.prepare("SELECT COUNT(*) as count FROM users WHERE created_at >= datetime('now', '-7 days')").get() as any).count

  const pending_news = (db.prepare("SELECT COUNT(*) as count FROM news WHERE status = 'pending'").get() as any).count
  const pending_reviews = (db.prepare("SELECT COUNT(*) as count FROM content_reviews WHERE result = 'pending'").get() as any).count

  const warning_credits = (db.prepare("SELECT COUNT(*) as count FROM creator_credits WHERE level IN ('warning','banned')").get() as any).count

  res.json({
    success: true,
    data: {
      total_news,
      total_complaints,
      total_services,
      total_pois,
      total_media,
      total_users,
      resolved_complaints: resolved,
      unresolved_complaints: unresolved,
      complaint_completion_rate,
      avg_satisfaction,
      satisfaction_survey_count,
      pending_satisfaction,
      active_users,
      pending_news,
      pending_reviews,
      warning_credits,
    },
  })
})

router.get('/supervision-overview', (_req: Request, res: Response): void => {
  const complaint_by_status = db.prepare("SELECT status as name, COUNT(*) as value FROM complaints GROUP BY status").all()
  const complaint_by_priority = db.prepare("SELECT priority as name, COUNT(*) as value FROM complaints GROUP BY priority").all()

  const dept_stats = db.prepare(`
    SELECT assigned_department as department,
           COUNT(*) as total,
           SUM(CASE WHEN status IN ('resolved','closed') THEN 1 ELSE 0 END) as resolved,
           SUM(CASE WHEN status NOT IN ('resolved','closed') THEN 1 ELSE 0 END) as pending,
           ROUND(SUM(CASE WHEN status IN ('resolved','closed') THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as completion_rate
    FROM complaints
    WHERE assigned_department IS NOT NULL
    GROUP BY assigned_department
    ORDER BY total DESC
  `).all()

  const overdue = db.prepare(`
    SELECT c.id, c.title, c.priority, c.assigned_department as department, c.created_at, c.content,
           julianday('now') - julianday(c.created_at) as days_overdue,
           (SELECT status FROM complaint_progress WHERE complaint_id = c.id ORDER BY created_at DESC LIMIT 1) as last_status,
           (SELECT description FROM complaint_progress WHERE complaint_id = c.id ORDER BY created_at DESC LIMIT 1) as last_progress
    FROM complaints c
    WHERE c.status NOT IN ('resolved','closed')
      AND c.created_at <= datetime('now', '-7 days')
    ORDER BY c.created_at ASC
    LIMIT 10
  `).all()

  const overdue_formatted = overdue.map((o: any) => ({
    ...o,
    days_overdue: Math.floor(o.days_overdue),
    created_at: o.created_at?.slice(0, 16)?.replace('T', ' ') || o.created_at,
  }))

  res.json({
    success: true,
    data: {
      by_status: complaint_by_status,
      by_priority: complaint_by_priority,
      department_ranks: dept_stats,
      overdue_complaints: overdue_formatted,
    },
  })
})

router.get('/unresolved-complaints', (req: Request, res: Response): void => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 10))
  const offset = (page - 1) * pageSize

  const total = (db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status NOT IN ('resolved','closed')").get() as any).count
  const list = db.prepare(`
    SELECT c.*,
           (SELECT COUNT(*) FROM complaint_progress WHERE complaint_id = c.id) as progress_count,
           (SELECT MAX(created_at) FROM complaint_progress WHERE complaint_id = c.id) as last_update
    FROM complaints c
    WHERE c.status NOT IN ('resolved','closed')
    ORDER BY
      CASE c.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
      END,
      c.created_at ASC
    LIMIT ? OFFSET ?
  `).all(pageSize, offset)

  res.json({
    success: true,
    data: { list, total, page, pageSize },
  })
})

router.get('/satisfaction-detail', (_req: Request, res: Response): void => {
  const rating_dist = db.prepare(`
    SELECT rating, COUNT(*) as count
    FROM satisfaction_surveys
    GROUP BY rating
    ORDER BY rating DESC
  `).all()

  const dept_satisfaction = db.prepare(`
    SELECT c.assigned_department as department,
           AVG(s.rating) as avg_rating,
           COUNT(*) as survey_count
    FROM satisfaction_surveys s
    JOIN complaints c ON s.complaint_id = c.id
    WHERE c.assigned_department IS NOT NULL
    GROUP BY c.assigned_department
    ORDER BY avg_rating DESC
  `).all()

  const no_survey = db.prepare(`
    SELECT c.*
    FROM complaints c
    WHERE c.status IN ('resolved')
      AND c.id NOT IN (SELECT complaint_id FROM satisfaction_surveys)
    ORDER BY c.updated_at DESC
    LIMIT 10
  `).all()

  res.json({
    success: true,
    data: {
      rating_distribution: rating_dist,
      department_satisfaction: dept_satisfaction,
      pending_surveys: no_survey,
    },
  })
})

router.get('/review-stats', (_req: Request, res: Response): void => {
  const result_dist = db.prepare(`
    SELECT result as name, COUNT(*) as value
    FROM content_reviews
    GROUP BY result
  `).all()

  const type_dist = db.prepare(`
    SELECT content_type as type,
           COUNT(*) as total,
           SUM(CASE WHEN result = 'pass' THEN 1 ELSE 0 END) as passed,
           SUM(CASE WHEN result = 'reject' THEN 1 ELSE 0 END) as rejected,
           SUM(CASE WHEN result = 'pending' THEN 1 ELSE 0 END) as pending
    FROM content_reviews
    GROUP BY content_type
  `).all()

  const recent = db.prepare(`
    SELECT cr.id, cr.content_type, cr.content_id, cr.result, cr.details,
           CASE cr.content_type
             WHEN 'news' THEN n.title
             WHEN 'media' THEN m.title
             WHEN 'review' THEN pr.content
             ELSE '未知'
           END as title,
           u.display_name as reviewer,
           cr.created_at as reviewed_at
    FROM content_reviews cr
    LEFT JOIN news n ON cr.content_type = 'news' AND cr.content_id = n.id
    LEFT JOIN media_contents m ON cr.content_type = 'media' AND cr.content_id = m.id
    LEFT JOIN poi_reviews pr ON cr.content_type = 'review' AND cr.content_id = pr.id
    LEFT JOIN users u ON cr.reviewer_id = u.id
    ORDER BY cr.created_at DESC
    LIMIT 10
  `).all()

  res.json({
    success: true,
    data: {
      result_distribution: result_dist,
      type_distribution: type_dist,
      recent_reviews: recent,
    },
  })
})

router.get('/opinion-heatmap-detail', (_req: Request, res: Response): void => {
  const heat_by_region = db.prepare(`
    SELECT region,
           SUM(heat_value) as total_heat,
           COUNT(*) as record_count,
           SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive,
           SUM(CASE WHEN sentiment = 'neutral' THEN 1 ELSE 0 END) as neutral,
           SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative
    FROM public_opinion
    GROUP BY region
    ORDER BY total_heat DESC
  `).all()

  const risk_levels = db.prepare(`
    SELECT
      CASE
        WHEN heat_value >= 8000 THEN 'high'
        WHEN heat_value >= 5000 THEN 'medium'
        ELSE 'low'
      END as risk_level,
      COUNT(*) as count,
      SUM(heat_value) as total_heat
    FROM public_opinion
    GROUP BY risk_level
    ORDER BY
      CASE risk_level
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        ELSE 3
      END
  `).all()

  const high_risk = db.prepare(`
    SELECT * FROM public_opinion
    WHERE heat_value >= 8000
    ORDER BY heat_value DESC
    LIMIT 10
  `).all()

  res.json({
    success: true,
    data: {
      by_region: heat_by_region,
      risk_levels,
      high_risk_keywords: high_risk,
    },
  })
})

router.get('/credit-stats', (_req: Request, res: Response): void => {
  const level_dist = db.prepare(`
    SELECT cc.level,
           COUNT(*) as count,
           AVG(cc.score) as avg_score,
           SUM(cc.violation_count) as total_violations
    FROM creator_credits cc
    GROUP BY cc.level
    ORDER BY
      CASE cc.level
        WHEN 'excellent' THEN 1
        WHEN 'good' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'warning' THEN 4
        WHEN 'banned' THEN 5
        ELSE 6
      END
  `).all()

  const recent_adjustments = db.prepare(`
    SELECT cl.*, u.display_name, u.username
    FROM credit_logs cl
    JOIN users u ON cl.user_id = u.id
    ORDER BY cl.created_at DESC
    LIMIT 10
  `).all()

  const low_credit_creators = db.prepare(`
    SELECT cc.*, u.display_name, u.username
    FROM creator_credits cc
    JOIN users u ON cc.user_id = u.id
    WHERE cc.level IN ('warning', 'banned')
    ORDER BY cc.score ASC
    LIMIT 10
  `).all()

  res.json({
    success: true,
    data: {
      level_distribution: level_dist,
      recent_adjustments,
      low_credit_creators,
    },
  })
})

router.get('/news-trend', (_req: Request, res: Response): void => {
  const data = db.prepare(
    "SELECT DATE(created_at) as date, COUNT(*) as count FROM news WHERE created_at >= datetime('now', '-7 days') GROUP BY DATE(created_at) ORDER BY date"
  ).all()
  res.json({ success: true, data })
})

router.get('/complaint-trend', (_req: Request, res: Response): void => {
  const data = db.prepare(
    "SELECT DATE(created_at) as date, COUNT(*) as count FROM complaints WHERE created_at >= datetime('now', '-7 days') GROUP BY DATE(created_at) ORDER BY date"
  ).all()
  res.json({ success: true, data })
})

router.get('/service-stats', (_req: Request, res: Response): void => {
  const data = db.prepare(
    'SELECT s.bureau, s.name, s.category, COUNT(sa.id) as application_count FROM services s LEFT JOIN service_applications sa ON s.id = sa.service_id GROUP BY s.id ORDER BY application_count DESC'
  ).all()
  res.json({ success: true, data })
})

router.get('/opinion-summary', (_req: Request, res: Response): void => {
  const data = db.prepare(
    `SELECT keyword,
            SUM(heat_value) as total_heat,
            MAX(sentiment) as sentiment
     FROM public_opinion
     GROUP BY keyword
     ORDER BY total_heat DESC
     LIMIT 10`
  ).all()
  res.json({ success: true, data })
})

router.get('/credit-distribution', (_req: Request, res: Response): void => {
  const data = db.prepare(
    `SELECT level, COUNT(*) as count FROM creator_credits GROUP BY level ORDER BY level`
  ).all()
  res.json({ success: true, data })
})

export default router

import { Router, Response } from 'express';
import db from '../database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/overview', authMiddleware, (req: AuthRequest, res: Response) => {
  const totalCourses = db.prepare('SELECT COUNT(*) as count FROM courses').get()?.count || 0;
  const pendingReviews = db.prepare('SELECT COUNT(*) as count FROM publication_reviews WHERE review_status = ?').get('pending')?.count || 0;
  const approvedReviews = db.prepare('SELECT COUNT(*) as count FROM publication_reviews WHERE review_status = ?').get('approved')?.count || 0;
  const publishedCourses = db.prepare('SELECT COUNT(*) as count FROM courses WHERE status = ?').get('published')?.count || 0;
  const resolvedEnforcement = db.prepare('SELECT COUNT(*) as count FROM enforcement_cases WHERE status = ?').get('closed')?.count || 0;
  const enforcementNoticeSent = db.prepare('SELECT COUNT(*) as count FROM enforcement_cases WHERE status IN (?, ?)').get('notice_sent', 'platform_notified')?.count || 0;

  const stats = {
    total_courses: totalCourses,
    total_materials: db.prepare('SELECT COUNT(*) as count FROM materials').get()?.count || 0,
    pending_reviews: pendingReviews,
    approved_reviews: approvedReviews,
    published_courses: publishedCourses,
    active_piracy_clues: db.prepare('SELECT COUNT(*) as count FROM piracy_clues WHERE status IN (?, ?, ?, ?)').get('pending', 'investigating', 'confirmed', 'processing')?.count || 0,
    active_enforcement_cases: db.prepare('SELECT COUNT(*) as count FROM enforcement_cases WHERE status IN (?, ?, ?, ?, ?)').get('notice_sent', 'platform_notified', 'lawyer_letter_sent', 'reviewing', 'appealing')?.count || 0,
    enforcement_notice_sent: enforcementNoticeSent,
    enforcement_resolved: resolvedEnforcement,
    unauthorized_materials: db.prepare('SELECT COUNT(*) as count FROM materials WHERE authorization_status IN (?, ?)').get('pending', 'unauthorized')?.count || 0,
    expiring_soon_materials: db.prepare("SELECT COUNT(*) as count FROM materials WHERE authorization_end_date IS NOT NULL AND authorization_end_date <= DATE('now', '+30 days') AND authorization_end_date >= DATE('now')").get()?.count || 0,
    expired_materials: db.prepare("SELECT COUNT(*) as count FROM materials WHERE authorization_end_date IS NOT NULL AND authorization_end_date < DATE('now')").get()?.count || 0,
  };

  res.json(stats);
});

router.get('/high-risk-courses', authMiddleware, (req: AuthRequest, res: Response) => {
  const query = `
    SELECT
      c.id,
      c.course_code,
      c.name,
      c.category,
      c.status,
      l.name as lecturer_name,
      COUNT(DISTINCT pc.id) as piracy_count,
      COUNT(DISTINCT m.id) as material_count,
      SUM(CASE WHEN m.authorization_status != 'authorized' THEN 1 ELSE 0 END) as unauthorized_material_count,
      COALESCE(SUM(pc.estimated_loss), 0) as total_estimated_loss
    FROM courses c
    LEFT JOIN lecturers l ON c.lecturer_id = l.id
    LEFT JOIN materials m ON c.id = m.course_id
    LEFT JOIN piracy_clues pc ON c.id = pc.related_course_id
    WHERE c.status = 'published'
    GROUP BY c.id
    HAVING piracy_count > 0 OR unauthorized_material_count > 0
    ORDER BY piracy_count DESC, total_estimated_loss DESC
    LIMIT 20
  `;

  const data = db.prepare(query).all();
  res.json(data);
});

router.get('/piracy-trend', authMiddleware, (req: AuthRequest, res: Response) => {
  const days = parseInt(req.query.days as string) || 30;
  const query = `
    SELECT
      DATE(created_at) as date,
      COUNT(*) as count,
      SUM(CASE WHEN status = 'closed' OR status = 'resolved' THEN 1 ELSE 0 END) as resolved_count
    FROM piracy_clues
    WHERE created_at >= DATE('now', '-${days} days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;

  const data = db.prepare(query).all();
  res.json(data);
});

router.get('/infringement-statistics', authMiddleware, (req: AuthRequest, res: Response) => {
  const byPlatform = db.prepare(`
    SELECT infringing_platform as name, COUNT(*) as value
    FROM piracy_clues
    WHERE infringing_platform IS NOT NULL
    GROUP BY infringing_platform
    ORDER BY value DESC
    LIMIT 10
  `).all();

  const byChannel = db.prepare(`
    SELECT source_channel as name, COUNT(*) as value
    FROM piracy_clues
    WHERE source_channel IS NOT NULL
    GROUP BY source_channel
  `).all();

  const byStatus = db.prepare(`
    SELECT status as name, COUNT(*) as value
    FROM piracy_clues
    GROUP BY status
  `).all();

  const byImpact = db.prepare(`
    SELECT impact_scope as name, COUNT(*) as value
    FROM piracy_clues
    WHERE impact_scope IS NOT NULL
    GROUP BY impact_scope
  `).all();

  res.json({ byPlatform, byChannel, byStatus, byImpact });
});

router.get('/processing-efficiency', authMiddleware, (req: AuthRequest, res: Response) => {
  const avgProcessingTimeQuery = `
    SELECT
      AVG(JULIANDAY(updated_at) - JULIANDAY(created_at)) * 24 as avg_hours
    FROM piracy_clues
    WHERE status IN ('closed', 'resolved')
    AND updated_at IS NOT NULL
  `;

  const avgTakedownTimeQuery = `
    SELECT
      AVG(JULIANDAY(takedown_date) - JULIANDAY(notice_sent_date)) as avg_days
    FROM enforcement_cases
    WHERE takedown_date IS NOT NULL
    AND notice_sent_date IS NOT NULL
  `;

  const avgProcessingTime = db.prepare(avgProcessingTimeQuery).get()?.avg_hours || 0;
  const avgTakedownTime = db.prepare(avgTakedownTimeQuery).get()?.avg_days || 0;

  const statusSummary = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM piracy_clues
    GROUP BY status
  `).all();

  res.json({
    avg_processing_hours: Math.round(avgProcessingTime * 100) / 100,
    avg_takedown_days: Math.round(avgTakedownTime * 100) / 100,
    status_summary: statusSummary,
  });
});

router.get('/loss-estimation', authMiddleware, (req: AuthRequest, res: Response) => {
  const totalLoss = db.prepare(`
    SELECT
      SUM(estimated_loss) as total_estimated_loss,
      SUM(CASE WHEN status IN ('closed', 'resolved') THEN estimated_loss ELSE 0 END) as resolved_loss,
      SUM(CASE WHEN status NOT IN ('closed', 'resolved') THEN estimated_loss ELSE 0 END) as pending_loss
    FROM piracy_clues
  `).get();

  const byCourse = db.prepare(`
    SELECT
      c.id,
      c.course_code,
      c.name,
      COUNT(pc.id) as infringement_count,
      SUM(pc.estimated_loss) as total_loss
    FROM piracy_clues pc
    LEFT JOIN courses c ON pc.related_course_id = c.id
    WHERE c.id IS NOT NULL
    GROUP BY c.id
    ORDER BY total_loss DESC
    LIMIT 10
  `).all();

  const byMonth = db.prepare(`
    SELECT
      strftime('%Y-%m', discovered_date) as month,
      SUM(estimated_loss) as monthly_loss
    FROM piracy_clues
    WHERE discovered_date IS NOT NULL
    GROUP BY strftime('%Y-%m', discovered_date)
    ORDER BY month DESC
    LIMIT 12
  `).all();

  res.json({
    total_estimated_loss: totalLoss?.total_estimated_loss || 0,
    resolved_loss: totalLoss?.resolved_loss || 0,
    pending_loss: totalLoss?.pending_loss || 0,
    by_course: byCourse,
    by_month: byMonth,
  });
});

router.get('/authorization-expiry', authMiddleware, (req: AuthRequest, res: Response) => {
  const days = parseInt(req.query.days as string) || 90;
  const query = `
    SELECT
      m.id,
      m.material_code,
      m.name,
      m.type,
      m.authorization_end_date,
      c.name as course_name,
      l.name as lecturer_name,
      CAST(JULIANDAY(m.authorization_end_date) - JULIANDAY('now') as INTEGER) as days_remaining,
      CASE
        WHEN CAST(JULIANDAY(m.authorization_end_date) - JULIANDAY('now') as INTEGER) < 0 THEN 'expired'
        WHEN CAST(JULIANDAY(m.authorization_end_date) - JULIANDAY('now') as INTEGER) <= 7 THEN 'critical'
        WHEN CAST(JULIANDAY(m.authorization_end_date) - JULIANDAY('now') as INTEGER) <= 30 THEN 'warning'
        ELSE 'normal'
      END as risk_level
    FROM materials m
    LEFT JOIN courses c ON m.course_id = c.id
    LEFT JOIN lecturers l ON m.lecturer_id = l.id
    WHERE m.authorization_end_date IS NOT NULL
    AND m.authorization_end_date <= DATE('now', '+${days} days')
    AND m.status = 'active'
    ORDER BY m.authorization_end_date ASC
  `;

  const data = db.prepare(query).all();

  const expiredCount = data.filter((item: any) => item.days_remaining < 0).length;
  const expiringData = data.filter((item: any) => item.days_remaining >= 0);

  const summary = {
    expired: expiredCount,
    expiring_7: expiringData.filter((item: any) => item.days_remaining <= 7).length,
    expiring_30: expiringData.filter((item: any) => item.days_remaining > 7 && item.days_remaining <= 30).length,
    expiring_60: expiringData.filter((item: any) => item.days_remaining > 30 && item.days_remaining <= 60).length,
    expiring_90: expiringData.filter((item: any) => item.days_remaining > 60 && item.days_remaining <= 90).length,
  };

  res.json({ items: data, summary, expiring_items: expiringData });
});

export default router;

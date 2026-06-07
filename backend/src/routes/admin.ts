import { Router, Request, Response } from 'express';
import { getDB } from '../db/init';
import { adminAuth } from '../middleware/auth';
import { updateRegionHeat } from '../services/lbs';
import { detectAnomalousPatterns } from '../services/antiFraud';

const router = Router();

router.get('/dashboard', adminAuth, (req: Request, res: Response) => {
  const db = getDB();

  const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  const totalNews = (db.prepare("SELECT COUNT(*) as count FROM news WHERE status = 'published'").get() as any).count;
  const totalVideos = (db.prepare("SELECT COUNT(*) as count FROM videos WHERE status = 'published'").get() as any).count;
  const totalCreators = (db.prepare('SELECT COUNT(*) as count FROM creators').get() as any).count;
  const tasksCompleted = (db.prepare("SELECT COUNT(*) as count FROM user_tasks WHERE status IN ('completed', 'claimed')").get() as any).count;
  const totalBeansDistributed = (db.prepare('SELECT COALESCE(SUM(total_earned), 0) as total FROM user_lili_beans').get() as any).total;
  const activeUsersToday = (db.prepare("SELECT COUNT(DISTINCT user_id) as count FROM user_behaviors WHERE date(created_at) = date('now')").get() as any).count;
  const pendingReports = (db.prepare("SELECT COUNT(*) as count FROM content_reports WHERE human_review_status = 'pending'").get() as any).count;

  res.json({
    total_users: totalUsers,
    total_news: totalNews,
    total_videos: totalVideos,
    total_creators: totalCreators,
    tasks_completed: tasksCompleted,
    total_beans_distributed: totalBeansDistributed,
    active_users_today: activeUsersToday,
    pending_reports: pendingReports,
  });
});

router.get('/region-heat', adminAuth, (req: Request, res: Response) => {
  const db = getDB();
  updateRegionHeat();
  const data = db.prepare('SELECT * FROM region_heat ORDER BY heat_score DESC').all();
  res.json({ data });
});

router.get('/content-reports', adminAuth, (req: Request, res: Response) => {
  const db = getDB();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const offset = (page - 1) * limit;

  let where = 'WHERE 1=1';
  const params: any[] = [];

  if (status) {
    where += ' AND human_review_status = ?';
    params.push(status);
  }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM content_reports ${where}`).get(...params) as any).count;
  const reports = db.prepare(`
    SELECT cr.*, u.username as reporter_name
    FROM content_reports cr
    LEFT JOIN users u ON cr.reporter_id = u.id
    ${where}
    ORDER BY cr.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({ data: reports, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

router.put('/content-reports/:id', adminAuth, (req: Request, res: Response) => {
  const db = getDB();
  const id = parseInt(req.params.id);
  const { human_review_status, human_review_note } = req.body;

  if (!['approved', 'rejected'].includes(human_review_status)) {
    res.status(400).json({ error: 'Status must be approved or rejected' });
    return;
  }

  const report = db.prepare('SELECT * FROM content_reports WHERE id = ?').get(id) as any;
  if (!report) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }

  db.prepare(`
    UPDATE content_reports SET human_review_status = ?, human_reviewer_id = ?, human_review_note = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(human_review_status, req.user!.id, human_review_note || null, id);

  if (human_review_status === 'rejected') {
    if (report.content_type === 'news') {
      db.prepare("UPDATE news SET status = 'rejected' WHERE id = ?").run(report.content_id);
    } else if (report.content_type === 'video') {
      db.prepare("UPDATE videos SET status = 'rejected' WHERE id = ?").run(report.content_id);
    }
  }

  const updated = db.prepare('SELECT * FROM content_reports WHERE id = ?').get(id);
  res.json(updated);
});

router.post('/content-screening', adminAuth, (req: Request, res: Response) => {
  const db = getDB();
  const { content_type, content_id } = req.body;

  if (!content_type || !content_id) {
    res.status(400).json({ error: 'content_type and content_id required' });
    return;
  }

  let content: any;
  if (content_type === 'news') {
    content = db.prepare('SELECT * FROM news WHERE id = ?').get(content_id) as any;
  } else if (content_type === 'video') {
    content = db.prepare('SELECT * FROM videos WHERE id = ?').get(content_id) as any;
  }

  if (!content) {
    res.status(404).json({ error: 'Content not found' });
    return;
  }

  const text = (content.title || '') + ' ' + (content.content || '') + ' ' + (content.description || '');
  const flaggedKeywords = ['违禁', '虚假', '诈骗', '赌博', '色情', '暴力', '恐怖'];
  const flagged: string[] = [];
  for (const kw of flaggedKeywords) {
    if (text.includes(kw)) flagged.push(kw);
  }

  const result = {
    safe: flagged.length === 0,
    flagged_keywords: flagged,
    risk_score: Math.min(flagged.length * 0.2, 1.0),
    screened_at: new Date().toISOString(),
  };

  if (flagged.length > 0) {
    const existing = db.prepare(
      'SELECT id FROM content_reports WHERE content_type = ? AND content_id = ?'
    ).get(content_type, content_id);

    if (!existing) {
      db.prepare(`
        INSERT INTO content_reports (content_type, content_id, ai_screening_result)
        VALUES (?, ?, ?)
      `).run(content_type, content_id, JSON.stringify(result));
    }
  }

  res.json(result);
});

router.get('/creator-growth', adminAuth, (req: Request, res: Response) => {
  const db = getDB();

  const levelDistribution = db.prepare(`
    SELECT creator_level, COUNT(*) as count FROM creators GROUP BY creator_level ORDER BY creator_level
  `).all();

  const topCreators = db.prepare(`
    SELECT c.id, c.creator_name, c.creator_level, c.follower_count, c.total_views, c.total_likes, c.originality_coefficient, c.verified
    FROM creators c ORDER BY c.follower_count DESC LIMIT 10
  `).all();

  const avgMetrics = db.prepare(`
    SELECT AVG(creator_level) as avg_level, AVG(follower_count) as avg_followers,
      AVG(total_views) as avg_views, AVG(originality_coefficient) as avg_originality
    FROM creators
  `).get() as any;

  res.json({ level_distribution: levelDistribution, top_creators: topCreators, avg_metrics: avgMetrics });
});

router.put('/creators/:id/level', adminAuth, (req: Request, res: Response) => {
  const db = getDB();
  const id = parseInt(req.params.id);
  const { creator_level } = req.body;

  if (creator_level === undefined || creator_level < 1 || creator_level > 10) {
    res.status(400).json({ error: 'Valid creator_level (1-10) required' });
    return;
  }

  const creator = db.prepare('SELECT id FROM creators WHERE id = ?').get(id);
  if (!creator) {
    res.status(404).json({ error: 'Creator not found' });
    return;
  }

  db.prepare('UPDATE creators SET creator_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(creator_level, id);
  const updated = db.prepare('SELECT * FROM creators WHERE id = ?').get(id);
  res.json(updated);
});

router.get('/anti-fraud/stats', adminAuth, (req: Request, res: Response) => {
  const db = getDB();

  const totalBehaviors = (db.prepare('SELECT COUNT(*) as count FROM user_behaviors').get() as any).count;
  const todayBehaviors = (db.prepare("SELECT COUNT(*) as count FROM user_behaviors WHERE date(created_at) = date('now')").get() as any).count;
  const totalTasks = (db.prepare("SELECT COUNT(*) as count FROM user_tasks WHERE status IN ('completed', 'claimed')").get() as any).count;
  const todayTasks = (db.prepare("SELECT COUNT(*) as count FROM user_tasks WHERE status IN ('completed', 'claimed') AND date(completed_at) = date('now')").get() as any).count;
  const totalBeans = (db.prepare('SELECT COALESCE(SUM(total_earned), 0) as total FROM user_lili_beans').get() as any).total;
  const todayBeans = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM bean_transactions WHERE transaction_type = 'task_reward' AND date(created_at) = date('now')").get() as any).total;

  res.json({
    total_behaviors: totalBehaviors,
    today_behaviors: todayBehaviors,
    total_tasks_completed: totalTasks,
    today_tasks_completed: todayTasks,
    total_beans_earned: totalBeans,
    today_beans_earned: todayBeans,
  });
});

router.get('/anti-fraud/suspicious', adminAuth, (req: Request, res: Response) => {
  const db = getDB();
  const limit = parseInt(req.query.limit as string) || 20;

  const users = db.prepare('SELECT id, username FROM users WHERE role != ?').all('admin') as any[];
  const suspicious = [];

  for (const user of users) {
    const result = detectAnomalousPatterns(user.id);
    if (result.anomalous) {
      suspicious.push({ user_id: user.id, username: user.username, patterns: result.patterns });
    }
    if (suspicious.length >= limit) break;
  }

  res.json({ data: suspicious });
});

router.get('/users', adminAuth, (req: Request, res: Response) => {
  const db = getDB();
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const role = req.query.role as string;
  const offset = (page - 1) * limit;

  let where = 'WHERE 1=1';
  const params: any[] = [];

  if (role) {
    where += ' AND role = ?';
    params.push(role);
  }

  const total = (db.prepare(`SELECT COUNT(*) as count FROM users ${where}`).get(...params) as any).count;
  const users = db.prepare(`
    SELECT id, username, nickname, avatar_url, latitude, longitude, role, total_reading_time, created_at
    FROM users ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({ data: users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export default router;

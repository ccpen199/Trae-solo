import express from 'express';
import db from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/summary', (req: AuthRequest, res) => {
  const userLevel = req.user?.security_level || 1;

  const total = db.prepare('SELECT COUNT(*) as count FROM clues WHERE security_level <= ?').get(userLevel) as any;
  const pending = db.prepare("SELECT COUNT(*) as count FROM clues WHERE status = 'pending' AND security_level <= ?").get(userLevel) as any;
  const reviewed = db.prepare("SELECT COUNT(*) as count FROM clues WHERE status = 'reviewed' AND security_level <= ?").get(userLevel) as any;
  const dispatched = db.prepare("SELECT COUNT(*) as count FROM clues WHERE status = 'dispatched' AND security_level <= ?").get(userLevel) as any;
  const completed = db.prepare("SELECT COUNT(*) as count FROM clues WHERE status = 'completed' AND security_level <= ?").get(userLevel) as any;
  const overdue = db.prepare(`
    SELECT COUNT(*) as count FROM clues c
    JOIN dispatches d ON c.id = d.clue_id
    WHERE c.status = 'dispatched' AND d.deadline < datetime('now') AND c.security_level <= ?
  `).get(userLevel) as any;

  res.json({
    total: total.count,
    pending: pending.count,
    reviewed: reviewed.count,
    dispatched: dispatched.count,
    completed: completed.count,
    overdue: overdue.count
  });
});

router.get('/by-category', (req: AuthRequest, res) => {
  const userLevel = req.user?.security_level || 1;
  
  const data = db.prepare(`
    SELECT category, COUNT(*) as count
    FROM clues
    WHERE security_level <= ? AND category IS NOT NULL
    GROUP BY category
    ORDER BY count DESC
  `).all(userLevel);

  res.json(data);
});

router.get('/by-status', (req: AuthRequest, res) => {
  const userLevel = req.user?.security_level || 1;
  
  const data = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM clues
    WHERE security_level <= ?
    GROUP BY status
  `).all(userLevel);

  res.json(data);
});

router.get('/by-source', (req: AuthRequest, res) => {
  const userLevel = req.user?.security_level || 1;
  
  const data = db.prepare(`
    SELECT source_channel, COUNT(*) as count
    FROM clues
    WHERE security_level <= ?
    GROUP BY source_channel
    ORDER BY count DESC
  `).all(userLevel);

  res.json(data);
});

router.get('/timeline', (req: AuthRequest, res) => {
  const userLevel = req.user?.security_level || 1;
  const days = parseInt(req.query.days as string) || 30;
  
  const data = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count
    FROM clues
    WHERE security_level <= ? AND created_at >= date('now', '-' || ? || ' days')
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `).all(userLevel, days);

  res.json(data);
});

router.get('/overdue-list', (req: AuthRequest, res) => {
  const userLevel = req.user?.security_level || 1;
  
  const data = db.prepare(`
    SELECT c.id, c.clue_no, c.title, d.responsible_unit, d.deadline,
           julianday('now') - julianday(d.deadline) as overdue_days
    FROM clues c
    JOIN dispatches d ON c.id = d.clue_id
    WHERE c.status = 'dispatched' AND d.deadline < datetime('now') AND c.security_level <= ?
    ORDER BY d.deadline ASC
  `).all(userLevel);

  res.json(data);
});

router.get('/logs', (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const offset = (page - 1) * pageSize;

  const logs = db.prepare(`
    SELECT l.*, u.real_name as user_name
    FROM operation_logs l
    LEFT JOIN users u ON l.user_id = u.id
    ORDER BY l.created_at DESC
    LIMIT ? OFFSET ?
  `).all(pageSize, offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM operation_logs').get() as any;

  res.json({ logs, total: total.count, page, pageSize });
});

export default router;

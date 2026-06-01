import { Router } from 'express';
import db from '../db.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/overview', auth, requireRole('admin', 'operator'), (req, res) => {
  const totalRooms = db.prepare("SELECT COUNT(*) as cnt FROM rooms WHERE status = 'open'").get().cnt;
  const totalUsers = db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  const totalHosts = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'host'").get().cnt;
  const totalOnline = db.prepare('SELECT SUM(online_count) as total FROM rooms WHERE status = ?').get('open').total || 0;
  const todayPayment = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM payments
    WHERE date(created_at) = date('now','localtime')
  `).get().total;
  const todayDuration = db.prepare(`
    SELECT COALESCE(SUM(duration_seconds), 0) as total FROM room_sessions
    WHERE date(joined_at) = date('now','localtime')
  `).get().total;
  const pendingReports = db.prepare("SELECT COUNT(*) as cnt FROM reports WHERE status = 'pending'").get().cnt;
  const pendingReviews = db.prepare("SELECT COUNT(*) as cnt FROM review_items WHERE status = 'pending'").get().cnt;

  res.json({
    totalRooms, totalUsers, totalHosts, totalOnline,
    todayPayment, todayDuration: Math.floor(todayDuration / 60),
    pendingReports, pendingReviews
  });
});

router.get('/room-duration', auth, requireRole('admin', 'operator'), (req, res) => {
  const { days = 7 } = req.query;
  const rows = db.prepare(`
    SELECT DATE(joined_at) as date, COUNT(DISTINCT room_id) as room_count,
      COALESCE(SUM(duration_seconds), 0) as total_seconds
    FROM room_sessions
    WHERE joined_at >= datetime('now', ?)
    GROUP BY DATE(joined_at) ORDER BY date DESC
  `).all(`-${days} days`);
  res.json({ data: rows.map(r => ({ ...r, total_minutes: Math.floor(r.total_seconds / 60) })) });
});

router.get('/retention', auth, requireRole('admin', 'operator'), (req, res) => {
  const { days = 7 } = req.query;
  const rows = db.prepare(`
    SELECT DATE(joined_at) as date,
      COUNT(DISTINCT user_id) as users,
      COUNT(DISTINCT room_id) as rooms
    FROM room_sessions
    WHERE joined_at >= datetime('now', ?)
    GROUP BY DATE(joined_at) ORDER BY date DESC
  `).all(`-${days} days`);
  res.json({ data: rows });
});

router.get('/payments', auth, requireRole('admin', 'operator'), (req, res) => {
  const { days = 7, page = 1, pageSize = 20 } = req.query;
  const payments = db.prepare(`
    SELECT p.*, u.nickname as user_name, rm.topic as room_topic
    FROM payments p LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN rooms rm ON p.room_id = rm.id
    WHERE p.created_at >= datetime('now', ?)
    ORDER BY p.created_at DESC LIMIT ? OFFSET ?
  `).all(`-${days} days`, Number(pageSize), (Number(page) - 1) * Number(pageSize));
  const total = db.prepare(`
    SELECT COUNT(*) as cnt FROM payments WHERE created_at >= datetime('now', ?)
  `).get(`-${days} days`).cnt;
  const totalAmount = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE created_at >= datetime('now', ?)
  `).get(`-${days} days`).total;
  res.json({ payments, total, totalAmount, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/categories', auth, requireRole('admin', 'operator'), (req, res) => {
  const rows = db.prepare(`
    SELECT category, COUNT(*) as room_count,
      SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
      COALESCE(SUM(popularity), 0) as total_popularity
    FROM rooms GROUP BY category ORDER BY total_popularity DESC
  `).all();
  res.json({ data: rows });
});

router.get('/host-contributions', auth, requireRole('admin', 'operator'), (req, res) => {
  const { days = 30, limit = 20 } = req.query;
  const rows = db.prepare(`
    SELECT u.id, u.nickname, u.avatar,
      COUNT(DISTINCT r.id) as room_count,
      COALESCE(SUM(r.popularity), 0) as total_popularity,
      (SELECT COALESCE(SUM(p.amount), 0) FROM payments p
        INNER JOIN rooms rm ON p.room_id = rm.id
        WHERE rm.host_id = u.id AND p.created_at >= datetime('now', ?)) as total_payment
    FROM users u
    INNER JOIN rooms r ON r.host_id = u.id
    WHERE u.role = 'host'
    GROUP BY u.id ORDER BY total_payment DESC LIMIT ?
  `).all(`-${days} days`, Number(limit));
  res.json({ data: rows });
});

router.get('/violations-summary', auth, requireRole('admin', 'operator'), (req, res) => {
  const { days = 30 } = req.query;
  const bySeverity = db.prepare(`
    SELECT severity, COUNT(*) as cnt FROM violations
    WHERE created_at >= datetime('now', ?) GROUP BY severity
  `).all(`-${days} days`);
  const byType = db.prepare(`
    SELECT type, COUNT(*) as cnt FROM violations
    WHERE created_at >= datetime('now', ?) GROUP BY type
  `).all(`-${days} days`);
  const total = db.prepare(`
    SELECT COUNT(*) as cnt FROM violations WHERE created_at >= datetime('now', ?)
  `).get(`-${days} days`).cnt;
  res.json({ total, bySeverity, byType });
});

router.get('/top-rooms', auth, requireRole('admin', 'operator'), (req, res) => {
  const { limit = 10 } = req.query;
  const rows = db.prepare(`
    SELECT r.id, r.topic, r.category, r.popularity, r.online_count,
      u.nickname as host_name
    FROM rooms r LEFT JOIN users u ON r.host_id = u.id
    WHERE r.status = 'open' ORDER BY r.popularity DESC LIMIT ?
  `).all(Number(limit));
  res.json({ data: rows });
});

export default router;

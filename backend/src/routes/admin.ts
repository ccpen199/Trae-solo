import { Router } from 'express';
import { getDb } from '../database';
import { verifyToken, requireCommunity, requireRole } from '../middleware/auth';
import type { AuthenticatedRequest, Community } from '../types';

const router = Router();

router.get('/dashboard', verifyToken, requireCommunity, requireRole('property_admin', 'platform_admin'), (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const communityId = authReq.community!.id;
  const db = getDb();

  const totalResidents = (db.prepare('SELECT COUNT(*) as cnt FROM residents WHERE community_id = ? AND status = ?').get(communityId, 'active') as any).cnt;

  const today = new Date().toISOString().split('T')[0];
  const postsToday = (db.prepare("SELECT COUNT(*) as cnt FROM topics WHERE community_id = ? AND date(created_at) = ?").get(communityId, today) as any).cnt;

  const totalPosts = (db.prepare('SELECT COUNT(*) as cnt FROM topics WHERE community_id = ?').get(communityId) as any).cnt;
  const totalOrders = (db.prepare('SELECT COUNT(*) as cnt FROM orders WHERE community_id = ?').get(communityId) as any).cnt;

  const complaintCount = (db.prepare("SELECT COUNT(*) as cnt FROM topics WHERE community_id = ? AND category = 'complaint'").get(communityId) as any).cnt;
  const resolvedComplaints = (db.prepare(
    `SELECT AVG(julianday(resolved_at) - julianday(created_at)) as avg_hours FROM property_services WHERE community_id = ? AND type = 'repair' AND resolved_at IS NOT NULL`
  ).get(communityId) as any).avg_hours;

  const transactionConversion = totalResidents > 0 ? ((totalOrders / totalResidents) * 100).toFixed(2) : '0';

  const postActivity = totalResidents > 0 ? ((totalPosts / totalResidents) * 100).toFixed(2) : '0';

  const dashboard = {
    community: authReq.community,
    total_residents: totalResidents,
    posts_today: postsToday,
    total_posts: totalPosts,
    total_orders: totalOrders,
    complaint_count: complaintCount,
    complaint_avg_response_hours: resolvedComplaints ? (resolvedComplaints * 24).toFixed(1) : null,
    transaction_conversion: `${transactionConversion}%`,
    post_activity_rate: `${postActivity}%`
  };

  res.json({ success: true, data: dashboard });
});

router.get('/fraud-logs', verifyToken, requireRole('platform_admin', 'property_admin'), (req, res) => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) as cnt FROM fraud_logs').get() as any).cnt;
  const logs = db.prepare('SELECT * FROM fraud_logs ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset);

  res.json({
    success: true,
    data: { items: logs, total, page, limit, totalPages: Math.ceil(total / limit) }
  });
});

router.get('/risk-controls', verifyToken, requireRole('platform_admin', 'property_admin'), (req, res) => {
  const db = getDb();
  const controls = db.prepare(
    `SELECT rc.*, r.real_name as resident_name FROM risk_controls rc JOIN residents r ON rc.resident_id = r.id ORDER BY rc.created_at DESC`
  ).all();

  res.json({ success: true, data: controls });
});

router.post('/risk-controls', verifyToken, requireRole('platform_admin'), (req, res) => {
  const { resident_id, rule_type, rule_value } = req.body;

  if (!resident_id || !rule_type || !rule_value) {
    res.status(400).json({ success: false, error: '居民ID、规则类型和规则值不能为空' });
    return;
  }

  const validTypes = ['daily_withdraw_limit', 'anti_money_laundering', 'frequency_limit'];
  if (!validTypes.includes(rule_type)) {
    res.status(400).json({ success: false, error: '无效的风控规则类型' });
    return;
  }

  const db = getDb();
  const resident = db.prepare('SELECT * FROM residents WHERE id = ?').get(resident_id);
  if (!resident) {
    res.status(404).json({ success: false, error: '居民不存在' });
    return;
  }

  const result = db.prepare(
    'INSERT INTO risk_controls (resident_id, rule_type, rule_value) VALUES (?, ?, ?)'
  ).run(resident_id, rule_type, rule_value);

  const control = db.prepare('SELECT * FROM risk_controls WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: control });
});

router.get('/red-packet-pool', verifyToken, requireRole('platform_admin', 'property_admin'), (req, res) => {
  const db = getDb();

  const totalIssued = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM red_packets WHERE status IN ('issued', 'claimed')").get() as any).total;
  const totalClaimed = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM red_packets WHERE status = 'claimed'").get() as any).total;
  const totalExpired = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM red_packets WHERE status = 'expired'").get() as any).total;
  const pendingCount = (db.prepare("SELECT COUNT(*) as cnt FROM red_packets WHERE status = 'pending'").get() as any).cnt;
  const issuedCount = (db.prepare("SELECT COUNT(*) as cnt FROM red_packets WHERE status = 'issued'").get() as any).cnt;

  const pool = {
    total_issued: totalIssued,
    total_claimed: totalClaimed,
    total_expired: totalExpired,
    pending_count: pendingCount,
    issued_count: issuedCount,
    outstanding_amount: totalIssued - totalClaimed - totalExpired
  };

  res.json({ success: true, data: pool });
});

export default router;

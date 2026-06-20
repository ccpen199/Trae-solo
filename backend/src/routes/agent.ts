import { Router } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authMiddleware, (req: AuthRequest, res) => {
  if (req.user!.role !== 'agent') {
    res.status(403).json({ message: '权限不足' });
    return;
  }

  const agent = db.prepare('SELECT id FROM agents WHERE user_id = ?').get(req.user!.id) as any;
  if (!agent) {
    res.status(404).json({ message: '经纪人信息不存在' });
    return;
  }

  const agentId = agent.id;

  const totalProperties = db.prepare(
    'SELECT COUNT(*) as count FROM properties WHERE agent_id = ?'
  ).get(agentId) as { count: number };

  const totalCustomers = db.prepare(
    'SELECT COUNT(DISTINCT customer_id) as count FROM customer_followups WHERE agent_id = ?'
  ).get(agentId) as { count: number };

  const totalDeals = db.prepare(
    "SELECT COUNT(*) as count FROM transactions WHERE agent_id = ? AND status = 'completed'"
  ).get(agentId) as { count: number };

  const totalCommission = db.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total FROM commission_records WHERE agent_id = ? AND status = 'paid'"
  ).get(agentId) as { total: number };

  const todayViewings = db.prepare(
    `SELECT COUNT(*) as count FROM viewing_records 
     WHERE agent_id = ? AND DATE(view_time) = DATE('now')`
  ).get(agentId) as { count: number };

  const pendingFollowups = db.prepare(
    `SELECT COUNT(*) as count FROM customer_followups 
     WHERE agent_id = ? AND next_follow_time > datetime('now')`
  ).get(agentId) as { count: number };

  const recentViewings = db.prepare(
    `SELECT v.*, p.title as property_title, u.real_name as customer_name, u.phone as customer_phone
     FROM viewing_records v
     JOIN properties p ON v.property_id = p.id
     JOIN users u ON v.customer_id = u.id
     WHERE v.agent_id = ?
     ORDER BY v.view_time DESC
     LIMIT 5`
  ).all(agentId);

  const recentFollowups = db.prepare(
    `SELECT f.*, u.real_name as customer_name, u.phone as customer_phone
     FROM customer_followups f
     JOIN users u ON f.customer_id = u.id
     WHERE f.agent_id = ?
     ORDER BY f.created_at DESC
     LIMIT 5`
  ).all(agentId);

  const monthlyData = db.prepare(
    `SELECT 
       DATE(created_at, 'start of month') as month,
       COUNT(*) as count
     FROM transactions
     WHERE agent_id = ? AND status = 'completed'
     GROUP BY month
     ORDER BY month DESC
     LIMIT 6`
  ).all(agentId);

  res.json({
    stats: {
      totalProperties: totalProperties.count,
      totalCustomers: totalCustomers.count,
      totalDeals: totalDeals.count,
      totalCommission: totalCommission.total,
      todayViewings: todayViewings.count,
      pendingFollowups: pendingFollowups.count,
    },
    recentViewings,
    recentFollowups,
    monthlyData,
  });
});

router.get('/customers', authMiddleware, (req: AuthRequest, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  const agent = db.prepare('SELECT id FROM agents WHERE user_id = ?').get(req.user!.id) as any;

  const customers = db.prepare(
    `SELECT DISTINCT u.id, u.real_name, u.phone, u.email,
            (SELECT COUNT(*) FROM viewing_records WHERE customer_id = u.id AND agent_id = ?) as view_count,
            (SELECT COUNT(*) FROM customer_followups WHERE customer_id = u.id AND agent_id = ?) as follow_count,
            (SELECT MAX(created_at) FROM customer_followups WHERE customer_id = u.id AND agent_id = ?) as last_follow
     FROM customer_followups f
     JOIN users u ON f.customer_id = u.id
     WHERE f.agent_id = ?
     ORDER BY last_follow DESC
     LIMIT ? OFFSET ?`
  ).all(agent.id, agent.id, agent.id, agent.id, Number(pageSize), offset);

  const total = db.prepare(
    'SELECT COUNT(DISTINCT customer_id) as count FROM customer_followups WHERE agent_id = ?'
  ).get(agent.id) as { count: number };

  res.json({ list: customers, total: total.count, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/followups', authMiddleware, (req: AuthRequest, res) => {
  const { customerId, type, content, nextFollowTime } = req.body;

  const agent = db.prepare('SELECT id FROM agents WHERE user_id = ?').get(req.user!.id) as any;

  db.prepare(
    'INSERT INTO customer_followups (agent_id, customer_id, type, content, next_follow_time) VALUES (?, ?, ?, ?, ?)'
  ).run(agent.id, customerId, type, content || '', nextFollowTime || null);

  res.json({ message: '跟进记录已添加' });
});

router.get('/viewings', authMiddleware, (req: AuthRequest, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  const agent = db.prepare('SELECT id FROM agents WHERE user_id = ?').get(req.user!.id) as any;

  const list = db.prepare(
    `SELECT v.*, p.title as property_title, p.address as property_address,
            u.real_name as customer_name, u.phone as customer_phone
     FROM viewing_records v
     JOIN properties p ON v.property_id = p.id
     JOIN users u ON v.customer_id = u.id
     WHERE v.agent_id = ?
     ORDER BY v.view_time DESC
     LIMIT ? OFFSET ?`
  ).all(agent.id, Number(pageSize), offset);

  const total = db.prepare(
    'SELECT COUNT(*) as count FROM viewing_records WHERE agent_id = ?'
  ).get(agent.id) as { count: number };

  res.json({ list, total: total.count, page: Number(page), pageSize: Number(pageSize) });
});

router.post('/viewings', authMiddleware, (req: AuthRequest, res) => {
  const { customerId, propertyId, viewTime, feedback, rating } = req.body;

  const agent = db.prepare('SELECT id FROM agents WHERE user_id = ?').get(req.user!.id) as any;

  db.prepare(
    'INSERT INTO viewing_records (agent_id, customer_id, property_id, view_time, feedback, rating) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(agent.id, customerId, propertyId, viewTime, feedback || '', rating || null);

  res.json({ message: '带看记录已添加' });
});

router.get('/properties', authMiddleware, (req: AuthRequest, res) => {
  const { page = 1, pageSize = 20, status } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  const agent = db.prepare('SELECT id FROM agents WHERE user_id = ?').get(req.user!.id) as any;

  let where = 'WHERE agent_id = ?';
  let params: any[] = [agent.id];

  if (status && status !== 'all') {
    where += ' AND status = ?';
    params.push(status);
  }

  const list = db.prepare(
    `SELECT * FROM properties ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`
  ).all(...params, Number(pageSize), offset);

  const total = db.prepare(
    `SELECT COUNT(*) as count FROM properties ${where}`
  ).get(...params) as { count: number };

  res.json({ list, total: total.count, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/commissions', authMiddleware, (req: AuthRequest, res) => {
  const agent = db.prepare('SELECT id FROM agents WHERE user_id = ?').get(req.user!.id) as any;

  const list = db.prepare(
    `SELECT c.*, t.order_no, t.price as transaction_price
     FROM commission_records c
     LEFT JOIN transactions t ON c.transaction_id = t.id
     WHERE c.agent_id = ?
     ORDER BY c.created_at DESC
     LIMIT 20`
  ).all(agent.id);

  const totalPaid = db.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total FROM commission_records WHERE agent_id = ? AND status = 'paid'"
  ).get(agent.id) as { total: number };

  res.json({ list, totalPaid: totalPaid.total });
});

export default router;

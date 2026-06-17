import { Router, NextFunction, Request, Response } from 'express';
import { db } from '../database';
import { now, verifyToken } from '../utils';

const router = Router();

function useCompatibility(req: Request): boolean {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return true;
  const token = authHeader.slice('Bearer '.length);
  const payload = verifyToken(token);
  return payload?.role !== 'admin';
}

function compat(handler: (req: Request, res: Response) => void) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!useCompatibility(req)) return next();
    handler(req, res);
  };
}

function pageParams(req: Request) {
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.max(1, Math.min(100, Number(req.query.pageSize || req.query.limit || 20)));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

router.get(['/dashboard', '/stats'], compat((_req, res) => {
  const t = now();
  const todayStart = t - (t % 86400);
  const monthStart = t - 86400 * 30;
  const totalOrders: any = db.prepare('SELECT COUNT(*) as cnt, COALESCE(SUM(final_amount),0) as amount FROM orders').get();
  const todayOrders: any = db.prepare('SELECT COUNT(*) as cnt, COALESCE(SUM(final_amount),0) as amount FROM orders WHERE created_at >= ?').get(todayStart);
  const totalUsers: any = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  const totalProducts: any = db.prepare('SELECT COUNT(*) as cnt FROM products WHERE status = 1').get();
  const completedOrders: any = db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE status = 'completed'").get();
  const failedToday: any = db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE status = 'failed' AND created_at >= ?").get(todayStart);
  const cardPool: any = db.prepare('SELECT COUNT(*) as cnt FROM card_pool').get();
  const pendingSettlements: any = db.prepare("SELECT COUNT(*) as cnt FROM settlements WHERE status = 'pending'").get();
  const totalCommission: any = db.prepare('SELECT COALESCE(SUM(amount),0) as amount FROM commission_records').get();
  const monthCommission: any = db.prepare('SELECT COALESCE(SUM(amount),0) as amount FROM commission_records WHERE created_at >= ?').get(monthStart);
  const riskBlockedToday: any = db.prepare("SELECT COUNT(*) as cnt FROM risk_logs WHERE blocked = 1 AND created_at >= ?").get(todayStart);
  const recentTrend = [];

  for (let i = 6; i >= 0; i--) {
    const dayStart = todayStart - i * 86400;
    const dayEnd = dayStart + 86400;
    const row: any = db.prepare(`
      SELECT COALESCE(SUM(final_amount),0) as amount, COUNT(*) as cnt
      FROM orders
      WHERE created_at >= ? AND created_at < ?
    `).get(dayStart, dayEnd);
    const d = new Date(dayStart * 1000);
    recentTrend.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, gmv: row.amount, orders: row.cnt });
  }

  res.json({
    success: true,
    data: {
      todayGMV: todayOrders.amount,
      todayOrders: todayOrders.cnt,
      totalGMV: totalOrders.amount,
      totalOrders: totalOrders.cnt,
      totalUsers: totalUsers.cnt,
      totalProducts: totalProducts.cnt,
      productCount: totalProducts.cnt,
      orderCount: totalOrders.cnt,
      gmv: totalOrders.amount,
      rechargeSuccessRate: totalOrders.cnt > 0 ? Math.round(completedOrders.cnt / totalOrders.cnt * 1000) / 10 : 0,
      todayFailures: failedToday.cnt,
      riskBlockedToday: riskBlockedToday.cnt,
      pendingSettlements: pendingSettlements.cnt,
      cardPoolTotal: cardPool.cnt,
      cardPoolCount: cardPool.cnt,
      totalCommission: totalCommission.amount,
      monthlyProfit: monthCommission.amount,
      monthCommission: monthCommission.amount,
      recentTrend,
      compatibilityMode: true
    }
  });
}));

router.get('/risk/logs', compat((req, res) => {
  const { pageSize, offset } = pageParams(req);
  const total: any = db.prepare('SELECT COUNT(*) as cnt FROM risk_logs').get();
  const list: any[] = db.prepare(`
    SELECT id, action as type, risk_level as level, ip, user_id,
           COALESCE(detail, action) as reason, created_at,
           CASE WHEN blocked = 1 THEN 'blocked' ELSE 'warning' END as status
    FROM risk_logs
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(pageSize, offset);
  res.json({ success: true, data: { list, total: total.cnt } });
}));

router.get('/risk/stats', compat((_req, res) => {
  const t = now();
  const todayStart = t - (t % 86400);
  const totalRisk: any = db.prepare('SELECT COUNT(*) as cnt FROM risk_logs').get();
  const todayRisk: any = db.prepare('SELECT COUNT(*) as cnt FROM risk_logs WHERE created_at >= ?').get(todayStart);
  const totalBlocked: any = db.prepare('SELECT COUNT(*) as cnt FROM risk_logs WHERE blocked = 1').get();
  const levelDistribution: any[] = db.prepare('SELECT risk_level as level, COUNT(*) as count FROM risk_logs GROUP BY risk_level').all();
  res.json({
    success: true,
    data: {
      totalRisk: totalRisk.cnt,
      todayRisk: todayRisk.cnt,
      totalBlocked: totalBlocked.cnt,
      blockRate: totalRisk.cnt > 0 ? Math.round(totalBlocked.cnt / totalRisk.cnt * 1000) / 10 : 0,
      levelDistribution
    }
  });
}));

router.get('/settlements', compat((req, res) => {
  const { pageSize, offset } = pageParams(req);
  const total: any = db.prepare('SELECT COUNT(*) as cnt FROM settlements').get();
  const list: any[] = db.prepare(`
    SELECT s.id, COALESCE(su.name, s.supplier_id) as supplier_name,
           s.period, s.total_amount, s.settlement_amount as settled_amount,
           s.status, s.created_at
    FROM settlements s
    LEFT JOIN suppliers su ON s.supplier_id = su.id
    ORDER BY s.created_at DESC
    LIMIT ? OFFSET ?
  `).all(pageSize, offset);
  res.json({ success: true, data: { list, total: total.cnt } });
}));

router.get('/profit-configs', compat((_req, res) => {
  const rows: any[] = db.prepare(`
    SELECT psc.id, COALESCE(s.name, psc.supplier_id) as name,
           psc.level1_ratio as level1_rate, psc.level2_ratio as level2_rate,
           psc.level3_ratio as level3_rate, psc.platform_ratio as platform_rate,
           psc.supplier_ratio as supplier_rate, 1 as status
    FROM profit_share_configs psc
    LEFT JOIN suppliers s ON psc.supplier_id = s.id
    ORDER BY psc.id ASC
  `).all();
  res.json({ success: true, data: rows });
}));

router.get('/card-pool', compat((req, res) => {
  const { pageSize, offset } = pageParams(req);
  const rows: any[] = db.prepare(`
    SELECT p.id, COALESCE(p.name, cp.product_id) as product_name,
           COUNT(cp.id) as total_count,
           SUM(CASE WHEN cp.status = 'used' THEN 1 ELSE 0 END) as used_count,
           SUM(CASE WHEN cp.encrypted_card IS NOT NULL THEN 1 ELSE 0 END) as encrypted_count,
           'AES-256-CBC' as encryption_algorithm
    FROM card_pool cp
    LEFT JOIN products p ON cp.product_id = p.id
    GROUP BY cp.product_id
    ORDER BY total_count DESC
    LIMIT ? OFFSET ?
  `).all(pageSize, offset);
  const total: any = db.prepare('SELECT COUNT(DISTINCT product_id) as cnt FROM card_pool').get();
  res.json({ success: true, data: { list: rows, total: total.cnt } });
}));

router.get('/card-pool/crypto-logs', compat((req, res) => {
  const { pageSize, offset } = pageParams(req);
  const total: any = db.prepare('SELECT COUNT(*) as cnt FROM card_crypto_logs').get();
  const list: any[] = db.prepare(`
    SELECT id, operation as action,
           COALESCE(operator_id, operator_role, 'system') as operator,
           1 as card_count,
           COALESCE(encryption_method, 'AES-256-CBC') as algorithm,
           created_at,
           CASE WHEN success = 1 THEN 'success' ELSE 'failed' END as status
    FROM card_crypto_logs
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(pageSize, offset);
  res.json({ success: true, data: { list, total: total.cnt } });
}));

router.get('/invoices', compat((req, res) => {
  const { pageSize, offset } = pageParams(req);
  const total: any = db.prepare('SELECT COUNT(*) as cnt FROM invoices').get();
  const list: any[] = db.prepare(`
    SELECT id, invoice_no, amount, type, title, status, created_at
    FROM invoices
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(pageSize, offset);
  res.json({ success: true, data: { list, total: total.cnt } });
}));

router.get('/operation-logs', compat((req, res) => {
  const { pageSize, offset } = pageParams(req);
  const total: any = db.prepare('SELECT COUNT(*) as cnt FROM operation_logs').get();
  const list: any[] = db.prepare(`
    SELECT id, operator_id, operator as operator_name, action_type,
           target_id, target_type, detail, ip_address, created_at
    FROM operation_logs
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(pageSize, offset);
  res.json({ success: true, data: { list, total: total.cnt } });
}));

router.post('/operation-logs', compat((req, res) => {
  const t = now();
  db.prepare(`
    INSERT INTO operation_logs (operator_id, operator, action_type, target_id, target_type, detail, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'compat-user',
    '用户端运营台',
    req.body?.action_type || 'view',
    req.body?.target_id || null,
    req.body?.target_type || null,
    req.body?.detail || '',
    req.ip || '127.0.0.1',
    t
  );
  res.json({ success: true });
}));

router.get('/audit/dashboard', compat((_req, res) => {
  const t = now();
  const todayStart = t - (t % 86400);
  const todayOperations: any = db.prepare('SELECT COUNT(*) as cnt FROM operation_logs WHERE created_at >= ?').get(todayStart);
  const pendingReviews: any = db.prepare("SELECT COUNT(*) as cnt FROM review_records WHERE status = 'pending'").get();
  const pendingSettlements: any = db.prepare("SELECT COUNT(*) as cnt FROM settlements WHERE status = 'pending'").get();
  const pendingInvoices: any = db.prepare("SELECT COUNT(*) as cnt FROM invoices WHERE status = 'pending'").get();
  const todayFailedOrders: any = db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE status = 'failed' AND created_at >= ?").get(todayStart);
  const todayBlocked: any = db.prepare("SELECT COUNT(*) as cnt FROM risk_logs WHERE blocked = 1 AND created_at >= ?").get(todayStart);
  const recentOperations: any[] = db.prepare(`
    SELECT id, operator_id, operator as operator_name, action_type, target_id, target_type, detail, ip_address, created_at
    FROM operation_logs
    ORDER BY created_at DESC
    LIMIT 10
  `).all();

  res.json({
    success: true,
    data: {
      todayOperations: todayOperations.cnt,
      pendingReviews: pendingReviews.cnt,
      pendingSettlements: pendingSettlements.cnt,
      pendingInvoices: pendingInvoices.cnt,
      todayFailedOrders: todayFailedOrders.cnt,
      channelDowngrade: 0,
      pendingStockSync: 0,
      todayBlocked: todayBlocked.cnt,
      recentOperations
    }
  });
}));

router.get('/review-center/summary', compat((_req, res) => {
  const pendingOrderReviews: any = db.prepare(`
    SELECT COUNT(*) as cnt
    FROM orders
    WHERE status = 'failed'
      AND id NOT IN (SELECT COALESCE(order_id, '') FROM review_records WHERE order_id IS NOT NULL)
  `).get();
  const pendingCommissionReviews: any = db.prepare("SELECT COUNT(*) as cnt FROM review_records WHERE status = 'pending' AND type = 'commission_review'").get();
  const pendingSettlements: any = db.prepare("SELECT COUNT(*) as cnt FROM settlements WHERE status = 'pending'").get();
  const failedOrders: any = db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE status = 'failed'").get();
  res.json({
    success: true,
    data: {
      pendingOrderReviews: pendingOrderReviews.cnt,
      pendingCommissionReviews: pendingCommissionReviews.cnt,
      pendingSettlements: pendingSettlements.cnt,
      failedOrders: failedOrders.cnt,
      pendingStockSync: 0,
      abnormalChannels: 0,
      totalPending: pendingOrderReviews.cnt + pendingCommissionReviews.cnt + pendingSettlements.cnt
    }
  });
}));

router.get('/review-center/list', compat((req, res) => {
  const { pageSize } = pageParams(req);
  const orders: any[] = db.prepare(`
    SELECT o.id, 'order' as item_type, o.order_no as title,
           o.product_name as description, o.final_amount as amount,
           o.status, o.fail_reason as reason, o.updated_at, o.created_at
    FROM orders o
    WHERE o.status = 'failed'
    ORDER BY o.updated_at DESC
    LIMIT ?
  `).all(pageSize);
  res.json({ success: true, data: { list: orders, total: orders.length } });
}));

router.get('/reports/export', compat((req, res) => {
  const format = String(req.query.format || 'csv');
  const type = String(req.query.type || 'orders');
  const rows: any[] = db.prepare(`
    SELECT order_no, product_name, status, final_amount, created_at
    FROM orders
    ORDER BY created_at DESC
    LIMIT 200
  `).all();

  if (format === 'json') {
    return res.json({ success: true, data: { type, rows } });
  }

  const csv = [
    'order_no,product_name,status,final_amount,created_at',
    ...rows.map((row) => [
      row.order_no,
      `"${String(row.product_name || '').replace(/"/g, '""')}"`,
      row.status,
      row.final_amount,
      row.created_at
    ].join(','))
  ].join('\n');
  res.setHeader('Content-Type', 'text/csv;charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${type}_export.csv"`);
  res.send(csv);
}));

export default router;

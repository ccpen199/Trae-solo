import { Router } from 'express';
import dayjs from 'dayjs';
import db from '../db';
import { authenticate, AuthRequest, requirePermission } from '../middleware/auth';
import { success, parseMoney, getStoreCondition } from '../utils';

const router = Router();

router.get('/overview', authenticate, requirePermission('report:view'), (req: AuthRequest, res) => {
  const { store_id, start_date, end_date } = req.query;

  let where = 'WHERE 1=1';
  const params: any[] = [];

  const storeCond = getStoreCondition(req.user!.store_id, 'o');
  where += storeCond.where;
  params.push(...storeCond.params);

  if (store_id) {
    where += ' AND o.store_id = ?';
    params.push(store_id);
  }

  const startDate = start_date || dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  const endDate = end_date || dayjs().format('YYYY-MM-DD');

  where += ' AND DATE(o.created_at) >= ? AND DATE(o.created_at) <= ?';
  params.push(startDate, endDate);

  const orderStats = db.prepare(`
    SELECT
      COUNT(DISTINCT o.id) as order_count,
      COALESCE(SUM(o.total_amount), 0) as total_sales,
      COALESCE(SUM(o.discount_amount), 0) as total_discount,
      COALESCE(SUM(o.payable_amount), 0) as total_payable,
      COUNT(DISTINCT o.member_id) as member_count
    FROM orders o
    ${where}
    AND o.status != 'cancelled'
  `).get(...params);

  const refundStats = db.prepare(`
    SELECT
      COUNT(DISTINCT r.id) as refund_count,
      COALESCE(SUM(r.amount), 0) as total_refund
    FROM refunds r
    ${where.replace(/o\./g, 'r.')}
    AND r.status = 'approved'
  `).get(...params);

  const exceptionOrders = db.prepare(`
    SELECT COUNT(*) as count FROM (
      SELECT o.id
      FROM orders o
      ${where}
      AND o.status IN ('cancelled', 'refunded')
      UNION
      SELECT ri.order_id as id
      FROM reconciliation_items ri
      JOIN reconciliation_records r ON ri.recon_id = r.id
      ${where.replace(/o\./g, 'r.')}
      AND ri.is_matched = 0
    )
  `).get(...params, ...params).count;

  const reconStats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'reconciled' THEN 1 ELSE 0 END) as completed
    FROM reconciliation_records r
    ${where.replace(/o\./g, 'r.')}
  `).get(...params);

  const result = {
    total_sales: parseMoney(orderStats.total_sales || 0),
    total_discount: parseMoney(orderStats.total_discount || 0),
    total_payable: parseMoney(orderStats.total_payable || 0),
    total_refund: parseMoney(refundStats.total_refund || 0),
    net_sales: parseMoney((orderStats.total_payable || 0) - (refundStats.total_refund || 0)),
    order_count: orderStats.order_count || 0,
    refund_count: refundStats.refund_count || 0,
    member_count: orderStats.member_count || 0,
    avg_order_amount: orderStats.order_count > 0
      ? parseMoney((orderStats.total_payable || 0) / orderStats.order_count)
      : 0,
    refund_rate: orderStats.order_count > 0
      ? Math.round((refundStats.refund_count || 0) / orderStats.order_count * 10000) / 100
      : 0,
    exception_count: exceptionOrders || 0,
    recon_total: reconStats.total || 0,
    recon_completed: reconStats.completed || 0,
    recon_rate: reconStats.total > 0
      ? Math.round((reconStats.completed || 0) / reconStats.total * 10000) / 100
      : 0,
    start_date: startDate,
    end_date: endDate
  };

  success(res, result);
});

router.get('/sales-trend', authenticate, requirePermission('report:view'), (req: AuthRequest, res) => {
  const { store_id, start_date, end_date, group_by = 'day' } = req.query;

  let where = "WHERE o.status != 'cancelled'";
  const params: any[] = [];

  const storeCond = getStoreCondition(req.user!.store_id, 'o');
  where += storeCond.where;
  params.push(...storeCond.params);

  if (store_id) {
    where += ' AND o.store_id = ?';
    params.push(store_id);
  }

  const startDate = start_date || dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  const endDate = end_date || dayjs().format('YYYY-MM-DD');
  where += ' AND DATE(o.created_at) >= ? AND DATE(o.created_at) <= ?';
  params.push(startDate, endDate);

  let dateFormat = '%Y-%m-%d';
  if (group_by === 'week') dateFormat = '%Y-%W';
  if (group_by === 'month') dateFormat = '%Y-%m';

  const data = db.prepare(`
    SELECT
      strftime('${dateFormat}', o.created_at) as period,
      COUNT(DISTINCT o.id) as order_count,
      COALESCE(SUM(o.total_amount), 0) as total_sales,
      COALESCE(SUM(o.discount_amount), 0) as total_discount,
      COALESCE(SUM(o.payable_amount), 0) as total_payable
    FROM orders o
    ${where}
    GROUP BY period
    ORDER BY period
  `).all(...params);

  data.forEach((d: any) => {
    d.total_sales = parseMoney(d.total_sales);
    d.total_discount = parseMoney(d.total_discount);
    d.total_payable = parseMoney(d.total_payable);
    d.avg_order_amount = d.order_count > 0 ? parseMoney(d.total_payable / d.order_count) : 0;
  });

  success(res, data);
});

router.get('/by-store', authenticate, requirePermission('report:view'), (req: AuthRequest, res) => {
  const { start_date, end_date } = req.query;

  const startDate = start_date || dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  const endDate = end_date || dayjs().format('YYYY-MM-DD');

  const data = db.prepare(`
    SELECT
      s.id, s.code, s.name,
      COUNT(DISTINCT o.id) as order_count,
      COALESCE(SUM(o.payable_amount), 0) as total_sales,
      COALESCE(SUM(o.discount_amount), 0) as total_discount,
      (SELECT COALESCE(SUM(amount), 0) FROM refunds r
       WHERE r.store_id = s.id AND r.status = 'approved'
         AND DATE(r.created_at) >= ? AND DATE(r.created_at) <= ?) as total_refund,
      (SELECT COUNT(*) FROM refunds r
       WHERE r.store_id = s.id AND r.status = 'approved'
         AND DATE(r.created_at) >= ? AND DATE(r.created_at) <= ?) as refund_count
    FROM stores s
    LEFT JOIN orders o ON s.id = o.store_id
      AND DATE(o.created_at) >= ? AND DATE(o.created_at) <= ?
      AND o.status != 'cancelled'
    WHERE s.status = 'active'
    GROUP BY s.id
    ORDER BY total_sales DESC
  `).all(startDate, endDate, startDate, endDate, startDate, endDate);

  data.forEach((d: any) => {
    d.total_sales = parseMoney(d.total_sales);
    d.total_discount = parseMoney(d.total_discount);
    d.total_refund = parseMoney(d.total_refund);
    d.net_sales = parseMoney(d.total_sales - d.total_refund);
    d.avg_order_amount = d.order_count > 0 ? parseMoney(d.total_sales / d.order_count) : 0;
    d.refund_rate = d.order_count > 0 ? Math.round(d.refund_count / d.order_count * 10000) / 100 : 0;
  });

  success(res, data);
});

router.get('/by-cashier', authenticate, requirePermission('report:view'), (req: AuthRequest, res) => {
  const { store_id, start_date, end_date } = req.query;

  let storeWhere = '';
  const params: any[] = [];

  const storeCond = getStoreCondition(req.user!.store_id, 'u');
  storeWhere += storeCond.where;
  params.push(...storeCond.params);

  if (store_id) {
    storeWhere += ' AND u.store_id = ?';
    params.push(store_id);
  }

  const startDate = start_date || dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  const endDate = end_date || dayjs().format('YYYY-MM-DD');

  const data = db.prepare(`
    SELECT
      u.id, u.username, u.real_name,
      r.name as role_name,
      s.name as store_name,
      COUNT(DISTINCT o.id) as order_count,
      COALESCE(SUM(o.payable_amount), 0) as total_sales,
      COALESCE(SUM(o.discount_amount), 0) as total_discount,
      (SELECT COALESCE(SUM(amount), 0) FROM refunds rf
       WHERE rf.operator_id = u.id AND rf.status = 'approved'
         AND DATE(rf.created_at) >= ? AND DATE(rf.created_at) <= ?) as total_refund,
      (SELECT COUNT(*) FROM refunds rf
       WHERE rf.operator_id = u.id AND rf.status = 'approved'
         AND DATE(rf.created_at) >= ? AND DATE(rf.created_at) <= ?) as refund_count,
      (SELECT COALESCE(SUM(ABS(total_difference)), 0) FROM shift_records sh
       WHERE sh.cashier_id = u.id AND sh.status = 'closed'
         AND DATE(sh.created_at) >= ? AND DATE(sh.created_at) <= ?) as total_short_over
    FROM users u
    JOIN roles r ON u.role_id = r.id
    LEFT JOIN stores s ON u.store_id = s.id
    LEFT JOIN orders o ON u.id = o.cashier_id
      AND DATE(o.created_at) >= ? AND DATE(o.created_at) <= ?
      AND o.status != 'cancelled'
    WHERE r.name = 'cashier' ${storeWhere}
    GROUP BY u.id
    ORDER BY total_sales DESC
  `).all(startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate);

  data.forEach((d: any) => {
    d.total_sales = parseMoney(d.total_sales);
    d.total_discount = parseMoney(d.total_discount);
    d.total_refund = parseMoney(d.total_refund);
    d.total_short_over = parseMoney(d.total_short_over);
    d.net_sales = parseMoney(d.total_sales - d.total_refund);
    d.avg_order_amount = d.order_count > 0 ? parseMoney(d.total_sales / d.order_count) : 0;
  });

  success(res, data);
});

router.get('/by-channel', authenticate, requirePermission('report:view'), (req: AuthRequest, res) => {
  const { store_id, start_date, end_date } = req.query;

  let where = 'WHERE 1=1';
  const params: any[] = [];

  const storeCond = getStoreCondition(req.user!.store_id, 'p');
  where += storeCond.where;
  params.push(...storeCond.params);

  if (store_id) {
    where += ' AND p.store_id = ?';
    params.push(store_id);
  }

  const startDate = start_date || dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  const endDate = end_date || dayjs().format('YYYY-MM-DD');
  where += ' AND DATE(p.created_at) >= ? AND DATE(p.created_at) <= ?';
  params.push(startDate, endDate);

  const data = db.prepare(`
    SELECT
      p.method as channel,
      COUNT(DISTINCT p.id) as payment_count,
      COALESCE(SUM(p.amount), 0) as total_amount
    FROM payments p
    ${where}
    AND p.status = 'success'
    GROUP BY p.method
    ORDER BY total_amount DESC
  `).all(...params);

  const methodNames: Record<string, string> = {
    cash: '现金',
    qrcode: '扫码支付',
    bank_card: '银行卡',
    stored_card: '储值卡',
    coupon: '优惠券'
  };

  const total = data.reduce((sum, d) => sum + parseMoney(d.total_amount), 0);
  data.forEach((d: any) => {
    d.channel_name = methodNames[d.channel] || d.channel;
    d.total_amount = parseMoney(d.total_amount);
    d.percentage = total > 0 ? Math.round(d.total_amount / total * 10000) / 100 : 0;
  });

  success(res, { list: data, total: parseMoney(total) });
});

router.get('/by-category', authenticate, requirePermission('report:view'), (req: AuthRequest, res) => {
  const { store_id, start_date, end_date } = req.query;

  let where = "WHERE o.status != 'cancelled'";
  const params: any[] = [];

  const storeCond = getStoreCondition(req.user!.store_id, 'o');
  where += storeCond.where;
  params.push(...storeCond.params);

  if (store_id) {
    where += ' AND o.store_id = ?';
    params.push(store_id);
  }

  const startDate = start_date || dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  const endDate = end_date || dayjs().format('YYYY-MM-DD');
  where += ' AND DATE(o.created_at) >= ? AND DATE(o.created_at) <= ?';
  params.push(startDate, endDate);

  const data = db.prepare(`
    SELECT
      c.id, c.name as category_name,
      COUNT(DISTINCT o.id) as order_count,
      COUNT(oi.id) as item_count,
      COALESCE(SUM(oi.subtotal), 0) as total_sales
    FROM categories c
    LEFT JOIN products p ON c.id = p.category_id
    LEFT JOIN order_items oi ON p.id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.id
      ${where}
    GROUP BY c.id
    ORDER BY total_sales DESC
  `).all(...params);

  const total = data.reduce((sum, d) => sum + parseMoney(d.total_sales), 0);
  data.forEach((d: any) => {
    d.total_sales = parseMoney(d.total_sales);
    d.percentage = total > 0 ? Math.round(d.total_sales / total * 10000) / 100 : 0;
  });

  success(res, { list: data, total: parseMoney(total) });
});

router.get('/exceptions', authenticate, requirePermission('report:view'), (req: AuthRequest, res) => {
  const { store_id, type, start_date, end_date, page, pageSize } = req.query;
  const limit = parseInt(pageSize as any) || 20;
  const offset = ((parseInt(page as any) || 1) - 1) * limit;

  let where = 'WHERE 1=1';
  const params: any[] = [];

  const storeCond = getStoreCondition(req.user!.store_id);
  where += storeCond.where;
  params.push(...storeCond.params);

  if (store_id) {
    where += ' AND store_id = ?';
    params.push(store_id);
  }

  const startDate = start_date || dayjs().subtract(7, 'day').format('YYYY-MM-DD');
  const endDate = end_date || dayjs().format('YYYY-MM-DD');
  where += ' AND DATE(created_at) >= ? AND DATE(created_at) <= ?';
  params.push(startDate, endDate);

  let data: any[] = [];
  let total = 0;

  if (type === 'cancelled' || !type) {
    const cancelled = db.prepare(`
      SELECT 'cancelled' as type, o.id, o.order_no, o.total_amount, o.status,
             o.cashier_id, u.real_name as cashier_name, o.store_id, s.name as store_name,
             o.created_at
      FROM orders o
      JOIN users u ON o.cashier_id = u.id
      JOIN stores s ON o.store_id = s.id
      ${where.replace('AND store_id', 'AND o.store_id')}
      AND o.status = 'cancelled'
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const cancelledCount = db.prepare(`
      SELECT COUNT(*) as count FROM orders o
      ${where.replace('AND store_id', 'AND o.store_id')}
      AND o.status = 'cancelled'
    `).get(...params).count;

    data = [...cancelled];
    total = cancelledCount;
  }

  if (type === 'refunded' || !type) {
    const refunded = db.prepare(`
      SELECT 'refunded' as type, o.id, o.order_no, o.total_amount, o.status,
             o.cashier_id, u.real_name as cashier_name, o.store_id, s.name as store_name,
             o.created_at
      FROM orders o
      JOIN users u ON o.cashier_id = u.id
      JOIN stores s ON o.store_id = s.id
      ${where.replace('AND store_id', 'AND o.store_id')}
      AND o.status IN ('refunded', 'partial_refund')
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const refundedCount = db.prepare(`
      SELECT COUNT(*) as count FROM orders o
      ${where.replace('AND store_id', 'AND o.store_id')}
      AND o.status IN ('refunded', 'partial_refund')
    `).get(...params).count;

    if (type === 'refunded') {
      data = refunded;
      total = refundedCount;
    }
  }

  if (type === 'shift_diff' || !type) {
    const diff = db.prepare(`
      SELECT 'shift_diff' as type, sh.id, sh.shift_no as order_no,
             sh.total_difference as total_amount, sh.status,
             sh.cashier_id, u.real_name as cashier_name, sh.store_id, s.name as store_name,
             sh.created_at
      FROM shift_records sh
      JOIN users u ON sh.cashier_id = u.id
      JOIN stores s ON sh.store_id = s.id
      ${where.replace('AND store_id', 'AND sh.store_id')}
      AND sh.total_difference != 0
      ORDER BY sh.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const diffCount = db.prepare(`
      SELECT COUNT(*) as count FROM shift_records sh
      ${where.replace('AND store_id', 'AND sh.store_id')}
      AND sh.total_difference != 0
    `).get(...params).count;

    if (type === 'shift_diff') {
      data = diff;
      total = diffCount;
    }
  }

  data.forEach((d: any) => {
    d.total_amount = parseMoney(d.total_amount);
  });

  success(res, { list: data, total, page: parseInt(page as any) || 1, pageSize: limit });
});

router.get('/daily-settlement/:date/export', authenticate, requirePermission('report:view'), (req: AuthRequest, res) => {
  const { date } = req.params;
  const { store_id } = req.query;

  const nextDate = dayjs(date as string).add(1, 'day').format('YYYY-MM-DD');

  let storeWhere = '';
  const params: any[] = [date, nextDate];

  if (store_id) {
    storeWhere = 'AND o.store_id = ?';
    params.push(store_id);
  }

  const summary = db.prepare(`
    SELECT
      s.id as store_id, s.code as store_code, s.name as store_name,
      COUNT(DISTINCT o.id) as order_count,
      COALESCE(SUM(o.total_amount), 0) as total_sales,
      COALESCE(SUM(o.discount_amount), 0) as total_discount,
      COALESCE(SUM(o.payable_amount), 0) as total_payable,
      (SELECT COALESCE(SUM(amount), 0) FROM refunds r
       WHERE r.store_id = s.id AND r.status = 'approved'
         AND r.created_at >= ? AND r.created_at < ?) as total_refund,
      (SELECT COUNT(*) FROM refunds r
       WHERE r.store_id = s.id AND r.status = 'approved'
         AND r.created_at >= ? AND r.created_at < ?) as refund_count
    FROM stores s
    LEFT JOIN orders o ON s.id = o.store_id
      AND o.created_at >= ? AND o.created_at < ?
      AND o.status != 'cancelled'
      ${storeWhere}
    WHERE s.status = 'active'
    GROUP BY s.id
  `).all(...params, ...params.slice(0, 2), ...params.slice(0, 2));

  const channels = db.prepare(`
    SELECT
      p.store_id, p.method,
      COUNT(*) as count,
      COALESCE(SUM(p.amount), 0) as amount
    FROM payments p
    WHERE p.created_at >= ? AND p.created_at < ?
      AND p.status = 'success'
      ${store_id ? 'AND p.store_id = ?' : ''}
    GROUP BY p.store_id, p.method
  `).all(date, nextDate, ...(store_id ? [store_id] : []));

  summary.forEach((s: any) => {
    s.total_sales = parseMoney(s.total_sales);
    s.total_discount = parseMoney(s.total_discount);
    s.total_payable = parseMoney(s.total_payable);
    s.total_refund = parseMoney(s.total_refund);
    s.net_amount = parseMoney(s.total_payable - s.total_refund);
    s.channels = channels.filter((c: any) => c.store_id === s.id).map((c: any) => ({
      method: c.method,
      count: c.count,
      amount: parseMoney(c.amount)
    }));
  });

  success(res, { date, summary });
});

router.get('/audit-logs', authenticate, requirePermission('audit:view'), (req: AuthRequest, res) => {
  const { user_id, action_type, start_date, end_date, page, pageSize } = req.query;
  const limit = parseInt(pageSize as any) || 50;
  const offset = ((parseInt(page as any) || 1) - 1) * limit;

  let where = 'WHERE 1=1';
  const params: any[] = [];

  const storeCond = getStoreCondition(req.user!.store_id);
  where += storeCond.where;
  params.push(...storeCond.params);

  if (user_id) {
    where += ' AND ol.user_id = ?';
    params.push(user_id);
  }

  if (action_type) {
    where += ' AND ol.action = ?';
    params.push(action_type);
  }

  if (start_date) {
    where += ' AND DATE(ol.created_at) >= ?';
    params.push(start_date);
  }

  if (end_date) {
    where += ' AND DATE(ol.created_at) <= ?';
    params.push(end_date);
  }

  const data = db.prepare(`
    SELECT
      ol.id, ol.action as action_type, ol.content as action_detail,
      ol.user_id, u.username, u.real_name,
      ol.module, ol.ip as ip_address,
      ol.created_at
    FROM operation_logs ol
    LEFT JOIN users u ON ol.user_id = u.id
    ${where}
    ORDER BY ol.created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM operation_logs ol
    ${where}
  `).get(...params).count;

  success(res, { list: data, total, page: parseInt(page as any) || 1, pageSize: limit });
});

router.get('/roles', authenticate, requirePermission('role:manage'), (req: AuthRequest, res) => {
  const roles = db.prepare(`
    SELECT r.id, r.name, r.description,
           (SELECT COUNT(*) FROM users u WHERE u.role_id = r.id) as user_count,
           r.created_at
    FROM roles r
    ORDER BY r.created_at DESC
  `).all();

  roles.forEach((role: any) => {
    role.permissions = db.prepare(`
      SELECT p.id, p.name, p.code, p.category
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `).all(role.id);
  });

  success(res, roles);
});

router.get('/permissions', authenticate, requirePermission('role:manage'), (req: AuthRequest, res) => {
  const permissions = db.prepare(`
    SELECT id, name, code, category, description
    FROM permissions
    ORDER BY category, code
  `).all();

  const grouped: Record<string, any[]> = {};
  permissions.forEach((p: any) => {
    if (!grouped[p.category]) grouped[p.category] = [];
    grouped[p.category].push(p);
  });

  success(res, grouped);
});

router.post('/roles/:id/permissions', authenticate, requirePermission('role:manage'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { permission_ids } = req.body;

  const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(id);
  if (!role) {
    return res.status(404).json({ code: 404, message: '角色不存在' });
  }

  const deleteStmt = db.prepare('DELETE FROM role_permissions WHERE role_id = ?');
  deleteStmt.run(id);

  const insertStmt = db.prepare('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)');
  if (permission_ids && permission_ids.length > 0) {
    permission_ids.forEach((pid: number) => {
      insertStmt.run(id, pid);
    });
  }

  success(res, { message: '权限配置成功' });
});

export default router;

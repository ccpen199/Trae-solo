import { Router } from 'express';
import dayjs from 'dayjs';
import db from '../db';
import { authenticate, AuthRequest, requirePermission, requireRole, logOperation } from '../middleware/auth';
import { success, error, generateOrderNo, buildPagination, parseMoney, getStoreCondition } from '../utils';

const router = Router();

router.get('/', authenticate, requirePermission('reconciliation:view'), (req: AuthRequest, res) => {
  const { store_id, recon_date, status, page, pageSize } = req.query;
  const { limit, offset } = buildPagination(page as any, pageSize as any);

  let where = 'WHERE 1=1';
  const params: any[] = [];

  const storeCond = getStoreCondition(req.user!.store_id, 'r');
  where += storeCond.where;
  params.push(...storeCond.params);

  if (store_id) {
    where += ' AND r.store_id = ?';
    params.push(store_id);
  }
  if (recon_date) {
    where += ' AND r.recon_date = ?';
    params.push(recon_date);
  }
  if (status) {
    where += ' AND r.status = ?';
    params.push(status);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM reconciliation_records r ${where}`).get(...params).count;

  const list = db.prepare(`
    SELECT r.*, s.name as store_name,
           u.real_name as operator_name, ur.real_name as reviewer_name
    FROM reconciliation_records r
    JOIN stores s ON r.store_id = s.id
    LEFT JOIN users u ON r.operator_id = u.id
    LEFT JOIN users ur ON r.reviewed_by = ur.id
    ${where}
    ORDER BY r.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  success(res, { list, total, page: parseInt(page as any) || 1, pageSize: limit });
});

router.get('/:id', authenticate, requirePermission('reconciliation:view'), (req: AuthRequest, res) => {
  const recon = db.prepare(`
    SELECT r.*, s.name as store_name, s.code as store_code,
           u.real_name as operator_name, ur.real_name as reviewer_name
    FROM reconciliation_records r
    JOIN stores s ON r.store_id = s.id
    LEFT JOIN users u ON r.operator_id = u.id
    LEFT JOIN users ur ON r.reviewed_by = ur.id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!recon) {
    return error(res, '对账记录不存在');
  }

  const items = db.prepare(`
    SELECT ri.*, o.order_no, p.payment_no, rf.refund_no,
           u.real_name as cashier_name
    FROM reconciliation_items ri
    LEFT JOIN orders o ON ri.order_id = o.id
    LEFT JOIN payments p ON ri.payment_id = p.id
    LEFT JOIN refunds rf ON ri.refund_id = rf.id
    LEFT JOIN users u ON ri.cashier_id = u.id
    WHERE ri.recon_id = ?
    ORDER BY ri.id
  `).all(req.params.id);

  recon.channel_amount = JSON.parse(recon.channel_amount || '{}');

  const byCashier = db.prepare(`
    SELECT ri.cashier_id, u.real_name as cashier_name,
           SUM(CASE WHEN ri.type = 'order' THEN ri.amount ELSE 0 END) as order_amount,
           SUM(CASE WHEN ri.type = 'refund' THEN ri.amount ELSE 0 END) as refund_amount,
           SUM(CASE WHEN ri.is_matched = 0 THEN 1 ELSE 0 END) as unmatched_count
    FROM reconciliation_items ri
    LEFT JOIN users u ON ri.cashier_id = u.id
    WHERE ri.recon_id = ?
    GROUP BY ri.cashier_id
  `).all(req.params.id);

  const byChannel = db.prepare(`
    SELECT ri.channel,
           SUM(CASE WHEN ri.type = 'order' THEN ri.amount ELSE 0 END) as order_amount,
           SUM(CASE WHEN ri.type = 'refund' THEN ri.amount ELSE 0 END) as refund_amount,
           SUM(CASE WHEN ri.is_matched = 0 THEN 1 ELSE 0 END) as unmatched_count
    FROM reconciliation_items ri
    WHERE ri.recon_id = ?
    GROUP BY ri.channel
  `).all(req.params.id);

  success(res, { ...recon, items, by_cashier: byCashier, by_channel: byChannel });
});

router.post('/', authenticate, requireRole('finance', 'admin'), requirePermission('reconciliation:create'), logOperation('reconciliation', 'create'), (req: AuthRequest, res) => {
  const { store_id, recon_date } = req.body;

  if (!store_id || !recon_date) {
    return error(res, '请选择门店和对账日期');
  }

  const existing = db.prepare(`
    SELECT * FROM reconciliation_records
    WHERE store_id = ? AND recon_date = ? AND status != 'cancelled'
  `).get(store_id, recon_date);

  if (existing) {
    return error(res, '该日期该门店已存在对账记录');
  }

  const nextDate = dayjs(recon_date).add(1, 'day').format('YYYY-MM-DD');

  const orders = db.prepare(`
    SELECT o.id, o.order_no, o.payable_amount, o.cashier_id,
           p.method as channel, p.amount as payment_amount
    FROM orders o
    JOIN payments p ON o.id = p.order_id
    WHERE o.store_id = ?
      AND DATE(o.created_at) >= ? AND DATE(o.created_at) < ?
      AND o.status IN ('completed', 'partial_refund', 'refunded')
      AND p.status = 'success'
  `).all(store_id, recon_date, nextDate);

  const refunds = db.prepare(`
    SELECT r.id, r.refund_no, r.amount, r.operator_id as cashier_id,
           r.method as channel
    FROM refunds r
    WHERE r.store_id = ?
      AND DATE(r.created_at) >= ? AND DATE(r.created_at) < ?
      AND r.status = 'approved'
  `).all(store_id, recon_date, nextDate);

  const orderCount = orders.length;
  const orderAmount = orders.reduce((sum, o) => sum + parseMoney(o.payable_amount), 0);
  const refundCount = refunds.length;
  const refundAmount = refunds.reduce((sum, r) => sum + parseMoney(r.amount), 0);
  const netAmount = parseMoney(orderAmount - refundAmount);

  const channelAmount: Record<string, { order: number; refund: number; net: number }> = {};
  for (const o of orders) {
    if (!channelAmount[o.channel]) {
      channelAmount[o.channel] = { order: 0, refund: 0, net: 0 };
    }
    channelAmount[o.channel].order = parseMoney(channelAmount[o.channel].order + parseMoney(o.payment_amount));
  }
  for (const r of refunds) {
    if (!channelAmount[r.channel]) {
      channelAmount[r.channel] = { order: 0, refund: 0, net: 0 };
    }
    channelAmount[r.channel].refund = parseMoney(channelAmount[r.channel].refund + parseMoney(r.amount));
  }
  for (const key of Object.keys(channelAmount)) {
    channelAmount[key].net = parseMoney(channelAmount[key].order - channelAmount[key].refund);
  }

  const reconNo = generateOrderNo('RECON');

  const tx = db.transaction(() => {
    const reconResult = db.prepare(`
      INSERT INTO reconciliation_records (
        recon_no, store_id, recon_date, order_count, order_amount,
        refund_count, refund_amount, net_amount, channel_amount,
        status, operator_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reconNo, store_id, recon_date, orderCount, orderAmount,
      refundCount, refundAmount, netAmount, JSON.stringify(channelAmount),
      'pending', req.user!.id
    );

    const reconId = reconResult.lastInsertRowid as number;

    const insertItem = db.prepare(`
      INSERT INTO reconciliation_items (
        recon_id, order_id, payment_id, type, amount, channel,
        cashier_id, is_matched, difference_amount, remark
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const paymentIds = new Set(orders.map(o => o.id));

    for (const o of orders) {
      insertItem.run(
        reconId, o.id, null, 'order', parseMoney(o.payment_amount),
        o.channel, o.cashier_id, 1, 0, null
      );
    }

    for (const r of refunds) {
      insertItem.run(
        reconId, null, null, 'refund', parseMoney(r.amount),
        r.channel, r.cashier_id, 1, 0, null
      );
    }

    return { reconId, reconNo };
  });

  try {
    const result = tx();
    success(res, result, '对账记录已创建');
  } catch (e: any) {
    error(res, `对账创建失败: ${e.message}`);
  }
});

router.post('/:id/review', authenticate, requireRole('finance', 'admin'), requirePermission('reconciliation:review'), logOperation('reconciliation', 'review'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { action, remarks } = req.body;

  if (!action || !['reconciled', 'unmatched'].includes(action)) {
    return error(res, '请选择审核结果');
  }

  const recon = db.prepare('SELECT * FROM reconciliation_records WHERE id = ?').get(id);
  if (!recon) {
    return error(res, '对账记录不存在');
  }
  if (recon.status !== 'pending') {
    return error(res, '该对账已处理');
  }

  db.prepare(`
    UPDATE reconciliation_records
    SET status = ?, reviewed_by = ?, created_at = created_at
    WHERE id = ?
  `).run(action, req.user!.id, id);

  success(res, null, action === 'reconciled' ? '对账已完成' : '对账标记为异常');
});

router.post('/items/:id/mark', authenticate, requirePermission('reconciliation:update'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { is_matched, difference_amount, remark } = req.body;

  db.prepare(`
    UPDATE reconciliation_items
    SET is_matched = ?, difference_amount = ?, remark = ?
    WHERE id = ?
  `).run(is_matched ? 1 : 0, parseMoney(difference_amount || 0), remark || null, id);

  success(res, null, '已更新');
});

router.get('/:id/export', authenticate, requirePermission('reconciliation:view'), (req: AuthRequest, res) => {
  const recon = db.prepare(`
    SELECT r.*, s.name as store_name, s.code as store_code,
           u.real_name as operator_name, ur.real_name as reviewer_name
    FROM reconciliation_records r
    JOIN stores s ON r.store_id = s.id
    LEFT JOIN users u ON r.operator_id = u.id
    LEFT JOIN users ur ON r.reviewed_by = ur.id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!recon) {
    return error(res, '对账记录不存在');
  }

  const items = db.prepare(`
    SELECT ri.*, o.order_no, p.payment_no, rf.refund_no,
           u.real_name as cashier_name
    FROM reconciliation_items ri
    LEFT JOIN orders o ON ri.order_id = o.id
    LEFT JOIN payments p ON ri.payment_id = p.id
    LEFT JOIN refunds rf ON ri.refund_id = rf.id
    LEFT JOIN users u ON ri.cashier_id = u.id
    WHERE ri.recon_id = ?
    ORDER BY ri.id
  `).all(req.params.id);

  recon.channel_amount = JSON.parse(recon.channel_amount || '{}');

  success(res, { recon, items });
});

export default router;

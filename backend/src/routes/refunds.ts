import { Router } from 'express';
import db from '../db';
import { authenticate, AuthRequest, requirePermission, requireRole, logOperation } from '../middleware/auth';
import { success, error, generateOrderNo, buildPagination, parseMoney, getStoreCondition } from '../utils';

const router = Router();

router.get('/', authenticate, requirePermission('refund:view'), (req: AuthRequest, res) => {
  const { store_id, operator_id, status, order_no, start_date, end_date, page, pageSize } = req.query;
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
  if (operator_id) {
    where += ' AND r.operator_id = ?';
    params.push(operator_id);
  }
  if (status) {
    where += ' AND r.status = ?';
    params.push(status);
  }
  if (order_no) {
    where += ' AND EXISTS (SELECT 1 FROM orders o WHERE o.id = r.order_id AND o.order_no LIKE ?)';
    params.push(`%${order_no}%`);
  }
  if (start_date) {
    where += ' AND DATE(r.created_at) >= ?';
    params.push(start_date);
  }
  if (end_date) {
    where += ' AND DATE(r.created_at) <= ?';
    params.push(end_date);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM refunds r ${where}`).get(...params).count;

  const list = db.prepare(`
    SELECT r.*, o.order_no, o.total_amount as order_amount,
           s.name as store_name, u.real_name as operator_name,
           ur.real_name as reviewer_name
    FROM refunds r
    JOIN orders o ON r.order_id = o.id
    JOIN stores s ON r.store_id = s.id
    JOIN users u ON r.operator_id = u.id
    LEFT JOIN users ur ON r.reviewer_id = ur.id
    ${where}
    ORDER BY r.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  success(res, { list, total, page: parseInt(page as any) || 1, pageSize: limit });
});

router.get('/:id', authenticate, requirePermission('refund:view'), (req: AuthRequest, res) => {
  const refund = db.prepare(`
    SELECT r.*, o.order_no, o.total_amount as order_amount, o.status as order_status,
           s.name as store_name, u.real_name as operator_name,
           ur.real_name as reviewer_name
    FROM refunds r
    JOIN orders o ON r.order_id = o.id
    JOIN stores s ON r.store_id = s.id
    JOIN users u ON r.operator_id = u.id
    LEFT JOIN users ur ON r.reviewer_id = ur.id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!refund) {
    return error(res, '退款记录不存在');
  }

  const order = db.prepare(`
    SELECT o.*, oi.product_name, oi.price, oi.quantity, oi.subtotal
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.id = ?
  `).all(refund.order_id);

  success(res, { ...refund, order_items: order });
});

router.post('/', authenticate, requirePermission('refund:create'), logOperation('refund', 'create'), (req: AuthRequest, res) => {
  const { order_id, amount, reason, method } = req.body;

  if (!order_id || !amount || !reason || !method) {
    return error(res, '请填写完整退款信息');
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
  if (!order) {
    return error(res, '订单不存在');
  }
  if (order.status !== 'completed') {
    return error(res, '只有已完成的订单才能申请退款');
  }

  const refundAmount = parseMoney(amount);
  if (refundAmount <= 0 || refundAmount > order.payable_amount) {
    return error(res, '退款金额无效');
  }

  const payment = db.prepare("SELECT * FROM payments WHERE order_id = ? AND status = 'success' ORDER BY id LIMIT 1").get(order_id);
  if (!payment) {
    return error(res, '未找到该订单的支付记录');
  }

  const existingRefunds = db.prepare(`
    SELECT COALESCE(SUM(amount), 0) as total_refunded
    FROM refunds
    WHERE order_id = ? AND status IN ('pending', 'approved')
  `).get(order_id).total_refunded;

  if (parseFloat(existingRefunds) + refundAmount > order.payable_amount + 0.01) {
    return error(res, '退款金额超过订单可退金额');
  }

  if (payment.method === 'bank_card' && method !== 'bank_card') {
    return error(res, '银行卡支付必须原路退回');
  }

  const needsReview = refundAmount > 100 || (order.payable_amount - parseFloat(existingRefunds) - refundAmount) < 0;

  const refundNo = generateOrderNo('REF');
  const storeId = req.user!.store_id || order.store_id;

  const result = db.prepare(`
    INSERT INTO refunds (refund_no, order_id, store_id, operator_id, amount, reason, method, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(refundNo, order_id, storeId, req.user!.id, refundAmount, reason, method, needsReview ? 'pending' : 'approved');

  if (!needsReview) {
    const tx = db.transaction(() => {
      db.prepare("UPDATE refunds SET status = 'approved', reviewer_id = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?")
        .run(req.user!.id, result.lastInsertRowid);
      db.prepare("UPDATE orders SET status = 'refunded' WHERE id = ?").run(order_id);
      if (payment.method === 'stored_card' && order.member_id) {
        db.prepare('UPDATE members SET balance = balance + ? WHERE id = ?').run(refundAmount, order.member_id);
      }
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order_id);
      for (const item of items) {
        db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(item.quantity, item.product_id);
      }
    });
    try {
      tx();
      success(res, { id: result.lastInsertRowid, refund_no: refundNo, status: 'approved' }, '退款申请已自动通过');
    } catch (e: any) {
      error(res, `退款处理失败: ${e.message}`);
    }
  } else {
    success(res, { id: result.lastInsertRowid, refund_no: refundNo, status: 'pending' }, '退款申请已提交，等待店长复核');
  }
});

router.post('/:id/review', authenticate, requireRole('store_manager', 'admin'), requirePermission('refund:review'), logOperation('refund', 'review'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const { action, remark } = req.body;

  if (!action || !['approved', 'rejected'].includes(action)) {
    return error(res, '请选择审核结果');
  }

  const refund = db.prepare('SELECT * FROM refunds WHERE id = ?').get(id);
  if (!refund) {
    return error(res, '退款记录不存在');
  }
  if (refund.status !== 'pending') {
    return error(res, '该退款申请已处理');
  }

  const storeId = req.user!.store_id;
  if (storeId && storeId !== refund.store_id) {
    return error(res, '只能审核本门店的退款申请');
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(refund.order_id);
  const payment = db.prepare("SELECT * FROM payments WHERE order_id = ? AND status = 'success' ORDER BY id LIMIT 1").get(refund.order_id);

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE refunds SET status = ?, reviewer_id = ?, review_remark = ?, reviewed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(action, req.user!.id, remark || null, id);

    if (action === 'approved') {
      const refundedCount = db.prepare("SELECT COUNT(*) as cnt FROM refunds WHERE order_id = ? AND status = 'approved'").get(refund.order_id).cnt;
      if (refundedCount > 0) {
        db.prepare("UPDATE orders SET status = 'partial_refund' WHERE id = ?").run(refund.order_id);
      }

      const totalRefunded = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total FROM refunds
        WHERE order_id = ? AND status = 'approved'
      `).get(refund.order_id).total;

      if (Math.abs(parseFloat(totalRefunded) - order.payable_amount) < 0.01) {
        db.prepare("UPDATE orders SET status = 'refunded' WHERE id = ?").run(refund.order_id);
        const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(refund.order_id);
        for (const item of items) {
          db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(item.quantity, item.product_id);
        }
      }

      if (payment && payment.method === 'stored_card' && order.member_id) {
        db.prepare('UPDATE members SET balance = balance + ? WHERE id = ?').run(refund.amount, order.member_id);
      }
    }
  });

  try {
    tx();
    success(res, null, action === 'approved' ? '退款已通过' : '退款已拒绝');
  } catch (e: any) {
    error(res, `审核失败: ${e.message}`);
  }
});

export default router;

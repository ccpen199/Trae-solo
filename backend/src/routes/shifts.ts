import { Router } from 'express';
import dayjs from 'dayjs';
import db from '../db';
import { authenticate, AuthRequest, requirePermission, logOperation } from '../middleware/auth';
import { success, error, generateOrderNo, buildPagination, parseMoney, getStoreCondition } from '../utils';

const router = Router();

router.get('/', authenticate, requirePermission('shift:view'), (req: AuthRequest, res) => {
  const { store_id, cashier_id, status, start_date, end_date, page, pageSize } = req.query;
  const { limit, offset } = buildPagination(page as any, pageSize as any);

  let where = 'WHERE 1=1';
  const params: any[] = [];

  const storeCond = getStoreCondition(req.user!.store_id, 's');
  where += storeCond.where;
  params.push(...storeCond.params);

  if (store_id) {
    where += ' AND s.store_id = ?';
    params.push(store_id);
  }
  if (cashier_id) {
    where += ' AND s.cashier_id = ?';
    params.push(cashier_id);
  }
  if (status) {
    where += ' AND s.status = ?';
    params.push(status);
  }
  if (start_date) {
    where += ' AND DATE(s.created_at) >= ?';
    params.push(start_date);
  }
  if (end_date) {
    where += ' AND DATE(s.created_at) <= ?';
    params.push(end_date);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM shift_records s ${where}`).get(...params).count;

  const list = db.prepare(`
    SELECT s.*, st.name as store_name, u.real_name as cashier_name
    FROM shift_records s
    JOIN stores st ON s.store_id = st.id
    JOIN users u ON s.cashier_id = u.id
    ${where}
    ORDER BY s.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  success(res, { list, total, page: parseInt(page as any) || 1, pageSize: limit });
});

router.get('/current', authenticate, (req: AuthRequest, res) => {
  const shift = db.prepare(`
    SELECT s.*, st.name as store_name, u.real_name as cashier_name
    FROM shift_records s
    JOIN stores st ON s.store_id = st.id
    JOIN users u ON s.cashier_id = u.id
    WHERE s.cashier_id = ? AND s.status = 'open'
    ORDER BY s.id DESC
    LIMIT 1
  `).get(req.user!.id);

  if (!shift) {
    return success(res, null);
  }

  const summary = calculateShiftSummary(shift.id, shift.store_id, shift.cashier_id, shift.start_time, null);
  success(res, { ...shift, ...summary });
});

router.get('/:id', authenticate, requirePermission('shift:view'), (req: AuthRequest, res) => {
  const shift = db.prepare(`
    SELECT s.*, st.name as store_name, u.real_name as cashier_name
    FROM shift_records s
    JOIN stores st ON s.store_id = st.id
    JOIN users u ON s.cashier_id = u.id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!shift) {
    return error(res, '交班记录不存在');
  }

  const summary = calculateShiftSummary(shift.id, shift.store_id, shift.cashier_id, shift.start_time, shift.end_time);

  const orders = db.prepare(`
    SELECT o.*, COUNT(DISTINCT oi.id) as item_count
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.store_id = ? AND o.cashier_id = ?
      AND o.created_at >= ? AND o.created_at <= ?
    GROUP BY o.id
    ORDER BY o.id DESC
  `).all(shift.store_id, shift.cashier_id, shift.start_time, shift.end_time || datetime('now'));

  success(res, { ...shift, ...summary, orders });
});

function calculateShiftSummary(shiftId, storeId, cashierId, startTime, endTime) {
  const end = endTime || new Date().toISOString();
  const methodMap: Record<string, { expected: number; actual: number; difference: number }> = {
    cash: { expected: 0, actual: 0, difference: 0 },
    qrcode: { expected: 0, actual: 0, difference: 0 },
    bank_card: { expected: 0, actual: 0, difference: 0 },
    stored_card: { expected: 0, actual: 0, difference: 0 },
    coupon: { expected: 0, actual: 0, difference: 0 }
  };

  const payments = db.prepare(`
    SELECT p.method, SUM(p.amount) as total
    FROM payments p
    WHERE p.store_id = ? AND p.cashier_id = ?
      AND p.created_at >= ? AND p.created_at <= ?
      AND p.status = 'success'
    GROUP BY p.method
  `).all(storeId, cashierId, startTime, end);

  for (const p of payments) {
    if (methodMap[p.method]) {
      methodMap[p.method].expected = parseMoney(p.total);
    }
  }

  const shift = db.prepare('SELECT * FROM shift_records WHERE id = ?').get(shiftId);
  if (shift) {
    methodMap.cash.actual = parseMoney(shift.actual_cash);
    methodMap.qrcode.actual = parseMoney(shift.actual_qrcode);
    methodMap.bank_card.actual = parseMoney(shift.actual_bank_card);
    methodMap.stored_card.actual = parseMoney(shift.actual_stored_card);
    methodMap.coupon.actual = parseMoney(shift.actual_coupon);
  }

  for (const key of Object.keys(methodMap)) {
    methodMap[key].difference = parseMoney(methodMap[key].actual - methodMap[key].expected);
  }

  const totals = Object.values(methodMap).reduce((acc, m) => ({
    expected: parseMoney(acc.expected + m.expected),
    actual: parseMoney(acc.actual + m.actual),
    difference: parseMoney(acc.difference + m.difference)
  }), { expected: 0, actual: 0, difference: 0 });

  const orderStats = db.prepare(`
    SELECT COUNT(*) as order_count, COALESCE(SUM(o.payable_amount), 0) as order_total,
           COALESCE(SUM(o.discount_amount), 0) as discount_total
    FROM orders o
    WHERE o.store_id = ? AND o.cashier_id = ?
      AND o.created_at >= ? AND o.created_at <= ?
      AND o.status != 'cancelled'
  `).get(storeId, cashierId, startTime, end);

  const refundStats = db.prepare(`
    SELECT COUNT(*) as refund_count, COALESCE(SUM(r.amount), 0) as refund_total
    FROM refunds r
    WHERE r.store_id = ? AND r.operator_id = ?
      AND r.created_at >= ? AND r.created_at <= ?
      AND r.status = 'approved'
  `).get(storeId, cashierId, startTime, end);

  return {
    by_method: methodMap,
    total_expected: totals.expected,
    total_actual: totals.actual,
    total_difference: totals.difference,
    order_count: orderStats.order_count || 0,
    order_total: parseMoney(orderStats.order_total || 0),
    discount_total: parseMoney(orderStats.discount_total || 0),
    refund_count: refundStats.refund_count || 0,
    refund_total: parseMoney(refundStats.refund_total || 0)
  };
}

router.post('/open', authenticate, requirePermission('shift:create'), logOperation('shift', 'open'), (req: AuthRequest, res) => {
  const storeId = req.user!.store_id;
  const cashierId = req.user!.id;

  if (!storeId) {
    return error(res, '请先选择门店');
  }

  const existing = db.prepare(`
    SELECT * FROM shift_records
    WHERE cashier_id = ? AND status = 'open'
  `).get(cashierId);

  if (existing) {
    return error(res, '您已有未交班的记录，请先完成交班');
  }

  const shiftNo = generateOrderNo('SHIFT');
  const startTime = dayjs().format('YYYY-MM-DD HH:mm:ss');

  const result = db.prepare(`
    INSERT INTO shift_records (
      shift_no, store_id, cashier_id, start_time, status
    ) VALUES (?, ?, ?, ?, ?)
  `).run(shiftNo, storeId, cashierId, startTime, 'open');

  success(res, { id: result.lastInsertRowid, shift_no: shiftNo, start_time: startTime }, '已开始交班');
});

router.post('/:id/close', authenticate, requirePermission('shift:create'), logOperation('shift', 'close'), (req: AuthRequest, res) => {
  const { id } = req.params;
  const {
    actual_cash, actual_qrcode, actual_bank_card, actual_stored_card, actual_coupon, remark
  } = req.body;

  const shift = db.prepare('SELECT * FROM shift_records WHERE id = ?').get(id);
  if (!shift) {
    return error(res, '交班记录不存在');
  }
  if (shift.status !== 'open') {
    return error(res, '该交班已完成');
  }
  if (shift.cashier_id !== req.user!.id && !['admin', 'store_manager'].includes(req.user!.role)) {
    return error(res, '只能结束自己的交班');
  }

  const summary = calculateShiftSummary(shift.id, shift.store_id, shift.cashier_id, shift.start_time, null);

  const actualCash = parseMoney(actual_cash || 0);
  const actualQrcode = parseMoney(actual_qrcode || 0);
  const actualBankCard = parseMoney(actual_bank_card || 0);
  const actualStoredCard = parseMoney(actual_stored_card || 0);
  const actualCoupon = parseMoney(actual_coupon || 0);

  const diffCash = parseMoney(actualCash - summary.by_method.cash.expected);
  const diffQrcode = parseMoney(actualQrcode - summary.by_method.qrcode.expected);
  const diffBankCard = parseMoney(actualBankCard - summary.by_method.bank_card.expected);
  const diffStoredCard = parseMoney(actualStoredCard - summary.by_method.stored_card.expected);
  const diffCoupon = parseMoney(actualCoupon - summary.by_method.coupon.expected);

  const totalExpected = summary.total_expected;
  const totalActual = parseMoney(actualCash + actualQrcode + actualBankCard + actualStoredCard + actualCoupon);
  const totalDiff = parseMoney(totalActual - totalExpected);

  const endTime = dayjs().format('YYYY-MM-DD HH:mm:ss');

  db.prepare(`
    UPDATE shift_records SET
      end_time = ?,
      expected_cash = ?, actual_cash = ?, difference_cash = ?,
      expected_qrcode = ?, actual_qrcode = ?, difference_qrcode = ?,
      expected_bank_card = ?, actual_bank_card = ?, difference_bank_card = ?,
      expected_stored_card = ?, actual_stored_card = ?, difference_stored_card = ?,
      expected_coupon = ?, actual_coupon = ?, difference_coupon = ?,
      total_expected = ?, total_actual = ?, total_difference = ?,
      status = ?, remark = ?
    WHERE id = ?
  `).run(
    endTime,
    summary.by_method.cash.expected, actualCash, diffCash,
    summary.by_method.qrcode.expected, actualQrcode, diffQrcode,
    summary.by_method.bank_card.expected, actualBankCard, diffBankCard,
    summary.by_method.stored_card.expected, actualStoredCard, diffStoredCard,
    summary.by_method.coupon.expected, actualCoupon, diffCoupon,
    totalExpected, totalActual, totalDiff,
    'closed', remark || null, id
  );

  success(res, {
    id,
    end_time: endTime,
    total_expected: totalExpected,
    total_actual: totalActual,
    total_difference: totalDiff
  }, '交班已完成');
});

router.get('/:id/export', authenticate, requirePermission('shift:view'), (req: AuthRequest, res) => {
  const shift = db.prepare(`
    SELECT s.*, st.name as store_name, st.code as store_code,
           u.real_name as cashier_name, u.username as cashier_username
    FROM shift_records s
    JOIN stores st ON s.store_id = st.id
    JOIN users u ON s.cashier_id = u.id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!shift) {
    return error(res, '交班记录不存在');
  }

  const summary = calculateShiftSummary(shift.id, shift.store_id, shift.cashier_id, shift.start_time, shift.end_time);

  const orders = db.prepare(`
    SELECT o.order_no, o.created_at, o.total_amount, o.discount_amount,
           o.payable_amount, o.status,
           GROUP_CONCAT(oi.product_name || ' x' || oi.quantity, '; ') as items
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.store_id = ? AND o.cashier_id = ?
      AND o.created_at >= ? AND o.created_at <= ?
    GROUP BY o.id
    ORDER BY o.id
  `).all(shift.store_id, shift.cashier_id, shift.start_time, shift.end_time || datetime('now'));

  success(res, { shift, summary, orders });
});

export default router;

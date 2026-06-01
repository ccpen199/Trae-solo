import { Router } from 'express';
import db from '../db';
import { authenticate, AuthRequest, requirePermission, logOperation } from '../middleware/auth';
import { success, error, generateOrderNo, generateHash, buildPagination, parseMoney, getStoreCondition } from '../utils';

const router = Router();

router.get('/', authenticate, requirePermission('order:view'), (req: AuthRequest, res) => {
  const { store_id, cashier_id, member_id, status, start_date, end_date, keyword, page, pageSize } = req.query;
  const { limit, offset } = buildPagination(page as any, pageSize as any);

  let where = 'WHERE 1=1';
  const params: any[] = [];

  const storeCond = getStoreCondition(req.user!.store_id, 'o');
  where += storeCond.where;
  params.push(...storeCond.params);

  if (store_id) {
    where += ' AND o.store_id = ?';
    params.push(store_id);
  }
  if (cashier_id) {
    where += ' AND o.cashier_id = ?';
    params.push(cashier_id);
  }
  if (member_id) {
    where += ' AND o.member_id = ?';
    params.push(member_id);
  }
  if (status) {
    where += ' AND o.status = ?';
    params.push(status);
  }
  if (start_date) {
    where += ' AND DATE(o.created_at) >= ?';
    params.push(start_date);
  }
  if (end_date) {
    where += ' AND DATE(o.created_at) <= ?';
    params.push(end_date);
  }
  if (keyword) {
    where += ' AND o.order_no LIKE ?';
    params.push(`%${keyword}%`);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM orders o ${where}`).get(...params).count;

  const list = db.prepare(`
    SELECT o.*, s.name as store_name, u.real_name as cashier_name, m.name as member_name, m.code as member_code
    FROM orders o
    JOIN stores s ON o.store_id = s.id
    JOIN users u ON o.cashier_id = u.id
    LEFT JOIN members m ON o.member_id = m.id
    ${where}
    ORDER BY o.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  success(res, { list, total, page: parseInt(page as any) || 1, pageSize: limit });
});

router.get('/:id', authenticate, requirePermission('order:view'), (req: AuthRequest, res) => {
  const order = db.prepare(`
    SELECT o.*, s.name as store_name, u.real_name as cashier_name, m.name as member_name,
           m.code as member_code, m.phone as member_phone
    FROM orders o
    JOIN stores s ON o.store_id = s.id
    JOIN users u ON o.cashier_id = u.id
    LEFT JOIN members m ON o.member_id = m.id
    WHERE o.id = ?
  `).get(req.params.id);

  if (!order) {
    return error(res, '订单不存在');
  }

  const items = db.prepare(`
    SELECT * FROM order_items WHERE order_id = ?
  `).all(req.params.id);

  const payments = db.prepare(`
    SELECT * FROM payments WHERE order_id = ? ORDER BY id
  `).all(req.params.id);

  const refunds = db.prepare(`
    SELECT r.*, u.real_name as operator_name, ur.real_name as reviewer_name
    FROM refunds r
    JOIN users u ON r.operator_id = u.id
    LEFT JOIN users ur ON r.reviewer_id = ur.id
    WHERE r.order_id = ?
    ORDER BY r.id DESC
  `).all(req.params.id);

  success(res, { ...order, items, payments, refunds });
});

router.get('/:id/verify', authenticate, (req: AuthRequest, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return error(res, '订单不存在');
  }

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.id);
  const payments = db.prepare('SELECT * FROM payments WHERE order_id = ?').all(req.params.id);

  const hashData = { order, items, payments };
  const verifyHash = generateHash(hashData, '');
  const isValid = order.hash === verifyHash.substring(0, 64);

  success(res, {
    is_valid: isValid,
    order_hash: order.hash,
    computed_hash: verifyHash.substring(0, 64)
  });
});

router.post('/', authenticate, requirePermission('order:create'), logOperation('order', 'create'), (req: AuthRequest, res) => {
  const {
    items, member_id, promotion_id, discount_amount,
    payments, invoice_needed, invoice_title, invoice_tax_no, remark
  } = req.body;

  if (!items || items.length === 0) {
    return error(res, '购物车不能为空');
  }
  if (!payments || payments.length === 0) {
    return error(res, '请选择支付方式');
  }

  const storeId = req.user!.store_id;
  const cashierId = req.user!.id;

  if (!storeId) {
    return error(res, '请先选择门店');
  }

  let totalAmount = 0;
  const orderItems: any[] = [];

  for (const item of items) {
    const product = db.prepare("SELECT * FROM products WHERE id = ? AND status = 'active'").get(item.product_id);
    if (!product) {
      return error(res, `商品不存在或已下架: ${item.product_name || item.product_id}`);
    }
    if (product.stock < item.quantity) {
      return error(res, `商品库存不足: ${product.name}`);
    }

    const price = parseMoney(item.price || product.price);
    const qty = parseInt(item.quantity) || 1;
    const itemDiscount = parseMoney(item.discount_amount || 0);
    const subtotal = price * qty - itemDiscount;

    totalAmount += subtotal;
    orderItems.push({
      product_id: product.id,
      product_name: product.name,
      product_code: product.code,
      price,
      quantity: qty,
      discount_amount: itemDiscount,
      subtotal,
      unit: product.unit
    });
  }

  totalAmount = parseMoney(totalAmount);
  const discountAmt = parseMoney(discount_amount || 0);
  const payableAmount = parseMoney(totalAmount - discountAmt);

  let totalPayment = 0;
  for (const p of payments) {
    totalPayment += parseMoney(p.amount);
    if (p.method === 'stored_card' && member_id) {
      const member = db.prepare('SELECT * FROM members WHERE id = ?').get(member_id);
      if (!member || member.balance < parseMoney(p.amount)) {
        return error(res, '储值卡余额不足');
      }
    }
  }
  totalPayment = parseMoney(totalPayment);

  if (Math.abs(totalPayment - payableAmount) > 0.01) {
    return error(res, '支付金额与应付金额不一致');
  }

  const orderNo = generateOrderNo('ORD');
  const changeAmount = parseMoney(Math.max(0, totalPayment - payableAmount));

  const hashData = { orderNo, items: orderItems, payments, totalAmount, discountAmt, payableAmount };
  const orderHash = generateHash(hashData, '').substring(0, 64);

  const tx = db.transaction(() => {
    const orderResult = db.prepare(`
      INSERT INTO orders (
        order_no, store_id, cashier_id, member_id, total_amount, discount_amount,
        promotion_id, payable_amount, actual_amount, change_amount, status,
        invoice_needed, invoice_title, invoice_tax_no, remark, hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderNo, storeId, cashierId, member_id || null,
      totalAmount, discountAmt, promotion_id || null,
      payableAmount, totalPayment, changeAmount, 'completed',
      invoice_needed ? 1 : 0, invoice_title || null, invoice_tax_no || null,
      remark || null, orderHash
    );

    const orderId = orderResult.lastInsertRowid as number;

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, product_code, price, quantity, discount_amount, subtotal, unit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    for (const item of orderItems) {
      insertItem.run(orderId, item.product_id, item.product_name, item.product_code,
                     item.price, item.quantity, item.discount_amount, item.subtotal, item.unit);
      updateStock.run(item.quantity, item.product_id);
    }

    const insertPayment = db.prepare(`
      INSERT INTO payments (payment_no, order_id, store_id, cashier_id, amount, method, channel_order_no, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of payments) {
      const paymentNo = generateOrderNo('PAY');
      const amount = parseMoney(p.amount);
      insertPayment.run(paymentNo, orderId, storeId, cashierId, amount, p.method, p.channel_order_no || null, 'success');

      if (p.method === 'stored_card' && member_id) {
        db.prepare('UPDATE members SET balance = balance - ? WHERE id = ?').run(amount, member_id);
      }
      if (member_id) {
        const points = Math.floor(payableAmount);
        db.prepare('UPDATE members SET points = points + ? WHERE id = ?').run(points, member_id);
      }
    }

    return { orderId, orderNo };
  });

  try {
    const result = tx();
    success(res, result, '订单创建成功');
  } catch (e: any) {
    error(res, `订单创建失败: ${e.message}`);
  }
});

router.post('/:id/cancel', authenticate, requirePermission('order:cancel'), logOperation('order', 'cancel'), (req: AuthRequest, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return error(res, '订单不存在');
  }
  if (order.status !== 'completed') {
    return error(res, '订单状态不允许取消');
  }

  const refunds = db.prepare('SELECT * FROM refunds WHERE order_id = ? AND status IN ("pending", "approved")').get(req.params.id);
  if (refunds) {
    return error(res, '该订单存在待处理或已通过的退款申请，无法取消');
  }

  db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(req.params.id);

  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(req.params.id);
  for (const item of items) {
    db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(item.quantity, item.product_id);
  }

  success(res, null, '订单已取消');
});

router.get('/shift/:shift_id/payments', authenticate, (req: AuthRequest, res) => {
  const shift = db.prepare('SELECT * FROM shift_records WHERE id = ?').get(req.params.shift_id);
  if (!shift) {
    return error(res, '交班记录不存在');
  }

  const payments = db.prepare(`
    SELECT p.method, SUM(p.amount) as total_amount, COUNT(*) as count
    FROM payments p
    WHERE p.store_id = ? AND p.cashier_id = ?
      AND p.created_at >= ? AND p.created_at <= ?
    GROUP BY p.method
  `).all(shift.store_id, shift.cashier_id, shift.start_time, shift.end_time || datetime('now'));

  success(res, payments);
});

export default router;

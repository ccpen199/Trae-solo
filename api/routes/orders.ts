import { Router, type Response } from 'express';
import db from '../db.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();

function generateOrderNo() {
  const date = new Date();
  const timestamp = date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${timestamp}${random}`;
}

router.get('/my', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE (o.buyer_id = ? OR o.supplier_id = ?)';
    const params: any[] = [req.user!.id, req.user!.id];

    if (status) {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }
    if (type) {
      whereClause += ' AND o.type = ?';
      params.push(type);
    }

    const orders = db.prepare(`
      SELECT o.*, u1.real_name as buyer_name, u2.real_name as supplier_name
      FROM orders o
      LEFT JOIN users u1 ON o.buyer_id = u1.id
      LEFT JOIN users u2 ON o.supplier_id = u2.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(limit), offset);

    const { total } = db.prepare(`
      SELECT COUNT(*) as total FROM orders o ${whereClause}
    `).get(...params) as { total: number };

    res.json({
      success: true,
      data: {
        list: orders,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error('获取订单列表错误:', error);
    res.status(500).json({ success: false, error: '获取订单列表失败' });
  }
});

router.get('/:id', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = db.prepare(`
      SELECT o.*, u1.real_name as buyer_name, u2.real_name as supplier_name,
             d.title as demand_title, q.price as quote_price
      FROM orders o
      LEFT JOIN users u1 ON o.buyer_id = u1.id
      LEFT JOIN users u2 ON o.supplier_id = u2.id
      LEFT JOIN demands d ON o.demand_id = d.id
      LEFT JOIN quotes q ON o.quote_id = q.id
      WHERE o.id = ?
    `).get(id) as any;

    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' });
      return;
    }

    if (order.buyer_id !== req.user!.id && order.supplier_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '无权查看此订单' });
      return;
    }

    const payments = db.prepare('SELECT * FROM payments WHERE order_id = ?').all(id);
    const refunds = db.prepare('SELECT * FROM refunds WHERE order_id = ?').all(id);

    res.json({
      success: true,
      data: {
        order,
        payments,
        refunds,
      },
    });
  } catch (error) {
    console.error('获取订单详情错误:', error);
    res.status(500).json({ success: false, error: '获取订单详情失败' });
  }
});

router.post('/', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { demand_id, quote_id, supplier_id, title, amount, type } = req.body;

    if (!supplier_id || !title || !amount) {
      res.status(400).json({ success: false, error: '供应商ID、标题和金额不能为空' });
      return;
    }

    const orderNo = generateOrderNo();
    const result = db.prepare(`
      INSERT INTO orders (order_no, demand_id, quote_id, buyer_id, supplier_id, type, title, amount, status, payment_status, delivery_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'unpaid', 'pending')
    `).run(
      orderNo,
      demand_id || null,
      quote_id || null,
      req.user!.id,
      supplier_id,
      type || 'industrial',
      title,
      amount
    );

    res.json({
      success: true,
      data: {
        id: result.lastInsertRowid,
        order_no: orderNo,
        message: '订单创建成功',
      },
    });
  } catch (error) {
    console.error('创建订单错误:', error);
    res.status(500).json({ success: false, error: '创建订单失败' });
  }
});

router.post('/:id/pay', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { payment_method, amount } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' });
      return;
    }

    if (order.buyer_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '无权支付此订单' });
      return;
    }

    if (order.payment_status === 'paid') {
      res.status(400).json({ success: false, error: '订单已支付' });
      return;
    }

    const account = db.prepare('SELECT * FROM accounts WHERE user_id = ?').get(req.user!.id) as any;
    const payAmount = amount || order.amount;

    if (!account || account.balance < payAmount) {
      res.status(400).json({ success: false, error: '账户余额不足' });
      return;
    }

    db.prepare('UPDATE accounts SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(
      payAmount,
      req.user!.id
    );

    db.prepare('UPDATE accounts SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?').run(
      payAmount,
      order.supplier_id
    );

    const transactionNo = 'TXN' + Date.now() + Math.floor(Math.random() * 1000);
    db.prepare(`
      INSERT INTO payments (order_id, user_id, amount, type, payment_method, transaction_no, status, paid_at)
      VALUES (?, ?, ?, 'payment', ?, ?, 'success', CURRENT_TIMESTAMP)
    `).run(id, req.user!.id, payAmount, payment_method || 'balance', transactionNo);

    db.prepare('UPDATE orders SET payment_status = ?, status = ?, paid_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      'paid',
      'processing',
      id
    );

    res.json({ success: true, message: '支付成功' });
  } catch (error) {
    console.error('支付错误:', error);
    res.status(500).json({ success: false, error: '支付失败' });
  }
});

router.post('/:id/confirm', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;

    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' });
      return;
    }

    if (order.buyer_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '无权操作此订单' });
      return;
    }

    db.prepare('UPDATE orders SET delivery_status = ?, completed_at = CURRENT_TIMESTAMP, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      'delivered',
      'completed',
      id
    );

    res.json({ success: true, message: '订单已完成' });
  } catch (error) {
    console.error('确认订单错误:', error);
    res.status(500).json({ success: false, error: '确认订单失败' });
  }
});

router.post('/:id/refund', authenticate, (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as any;
    if (!order) {
      res.status(404).json({ success: false, error: '订单不存在' });
      return;
    }

    if (order.buyer_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '无权申请退款' });
      return;
    }

    db.prepare(`
      INSERT INTO refunds (order_id, user_id, amount, reason, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).run(id, req.user!.id, amount || order.amount, reason || '');

    db.prepare('UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('refunding', id);

    res.json({ success: true, message: '退款申请已提交' });
  } catch (error) {
    console.error('申请退款错误:', error);
    res.status(500).json({ success: false, error: '申请退款失败' });
  }
});

export default router;

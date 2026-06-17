import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { authenticate, getUserId } from './auth';

const router = Router();

function rowToOrder(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id as string,
    orderNo: row.order_no as string,
    category: row.category as string,
    status: row.status as string,
    amount: row.amount as number,
    goodsAmount: row.goods_amount as number,
    deliveryFee: row.delivery_fee as number,
    distance: row.distance as number,
    pickupName: row.pickup_name as string,
    pickupPhone: row.pickup_phone as string,
    pickupAddress: row.pickup_address as string,
    deliverName: row.deliver_name as string,
    deliverPhone: row.deliver_phone as string,
    deliverAddress: row.deliver_address as string,
    goodsDescription: row.goods_description as string,
    remark: row.remark as string,
    expectedAt: row.expected_at as string | null,
    acceptedAt: row.accepted_at as string | null,
    pickedUpAt: row.picked_up_at as string | null,
    completedAt: row.completed_at as string | null,
    createdAt: row.created_at as string
  };
}

router.post('/register', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { shopName, licenseNo, legalPerson, idCard, category } = req.body as {
      shopName: string; licenseNo?: string; legalPerson?: string; idCard?: string; category?: string;
    };
    if (!shopName) {
      res.json({ code: 400, message: '店铺名称不能为空', data: null });
      return;
    }
    const db = getDb();
    const exists = db.prepare('SELECT id FROM merchants WHERE user_id = ?').get(userId);
    if (exists) {
      res.json({ code: 400, message: '该用户已申请入驻', data: null });
      return;
    }
    const id = uuidv4();
    db.prepare(`
      INSERT INTO merchants (id, user_id, shop_name, license_no, legal_person, id_card, category, audit_status, commission_rate, balance)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, userId, shopName, licenseNo || '', legalPerson || '', idCard || '', category || '', 'pending', 0.1, 0);
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run('merchant', userId);
    res.json({ code: 0, message: '入驻申请已提交', data: { id, status: 'pending' } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/dashboard', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!merchant) {
      res.json({ code: 404, message: '商户不存在', data: null });
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const todayStats = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(goods_amount), 0) as total
      FROM orders WHERE merchant_id = ? AND DATE(created_at) = ?
    `).get(merchant.id, today) as { count: number; total: number };
    const completedToday = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE merchant_id = ? AND status = 'completed' AND DATE(created_at) = ?
    `).get(merchant.id, today) as { count: number };
    const totalStats = db.prepare(`
      SELECT COUNT(*) as total_orders, COALESCE(SUM(goods_amount), 0) as total_sales
      FROM orders WHERE merchant_id = ?
    `).get(merchant.id) as { total_orders: number; total_sales: number };
    const pendingOrders = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE merchant_id = ? AND status = 'pending'
    `).get(merchant.id) as { count: number };
    res.json({
      code: 0,
      message: 'ok',
      data: {
        shopName: merchant.shop_name,
        auditStatus: merchant.audit_status,
        balance: merchant.balance,
        commissionRate: merchant.commission_rate,
        todayOrders: todayStats.count,
        todaySales: Number(todayStats.total.toFixed(2)),
        completedToday: completedToday.count,
        totalOrders: totalStats.total_orders,
        totalSales: Number(totalStats.total_sales.toFixed(2)),
        pendingOrders: pendingOrders.count
      }
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/orders', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { status } = req.query as { status?: string };
    const db = getDb();
    const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!merchant) {
      res.json({ code: 404, message: '商户不存在', data: null });
      return;
    }
    let sql = 'SELECT * FROM orders WHERE merchant_id = ?';
    const params: unknown[] = [merchant.id];
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC LIMIT 100';
    const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
    res.json({ code: 0, message: 'ok', data: rows.map(rowToOrder) });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/orders/:id/accept', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const db = getDb();
    const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!merchant) {
      res.json({ code: 404, message: '商户不存在', data: null });
      return;
    }
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND merchant_id = ?').get(id, merchant.id) as Record<string, unknown> | undefined;
    if (!order) {
      res.json({ code: 404, message: '订单不存在', data: null });
      return;
    }
    if (order.status !== 'pending') {
      res.json({ code: 400, message: '当前状态无法接单', data: null });
      return;
    }
    res.json({ code: 0, message: '接单成功', data: { id, status: 'pending' } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/orders/:id/reject', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { reason } = req.body as { reason?: string };
    const db = getDb();
    const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!merchant) {
      res.json({ code: 404, message: '商户不存在', data: null });
      return;
    }
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND merchant_id = ?').get(id, merchant.id) as Record<string, unknown> | undefined;
    if (!order) {
      res.json({ code: 404, message: '订单不存在', data: null });
      return;
    }
    if (order.status !== 'pending') {
      res.json({ code: 400, message: '当前状态无法拒单', data: null });
      return;
    }
    const now = new Date().toISOString();
    db.prepare('UPDATE orders SET status = ?, cancelled_at = ?, cancel_reason = ? WHERE id = ?')
      .run('cancelled', now, reason || '商户拒单', id);
    res.json({ code: 0, message: '拒单成功', data: { id, status: 'cancelled' } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/products', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!merchant) {
      res.json({ code: 404, message: '商户不存在', data: null });
      return;
    }
    const products = db.prepare(`
      SELECT p.*, s.name as store_name
      FROM merchant_products p
      JOIN merchant_stores s ON p.store_id = s.id
      WHERE s.merchant_id = ?
      ORDER BY p.status DESC, p.id
    `).all(merchant.id) as Record<string, unknown>[];
    res.json({
      code: 0,
      message: 'ok',
      data: products.map(p => ({
        id: p.id,
        storeId: p.store_id,
        storeName: p.store_name,
        name: p.name,
        category: p.category,
        price: p.price,
        image: p.image,
        stock: p.stock,
        status: p.status
      }))
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/products', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { storeId, name, category, price, image, stock, status } = req.body as {
      storeId: string; name: string; category?: string; price?: number; image?: string; stock?: number; status?: string;
    };
    if (!storeId || !name) {
      res.json({ code: 400, message: '门店和商品名称不能为空', data: null });
      return;
    }
    const db = getDb();
    const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!merchant) {
      res.json({ code: 404, message: '商户不存在', data: null });
      return;
    }
    const store = db.prepare('SELECT id FROM merchant_stores WHERE id = ? AND merchant_id = ?').get(storeId, merchant.id);
    if (!store) {
      res.json({ code: 404, message: '门店不存在', data: null });
      return;
    }
    const id = uuidv4();
    db.prepare(`
      INSERT INTO merchant_products (id, store_id, name, category, price, image, stock, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, storeId, name, category || '', price || 0, image || '', stock || 0, status || 'on');
    res.json({
      code: 0,
      message: 'ok',
      data: { id, storeId, name, category, price, image, stock, status }
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.put('/products/:id', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const body = req.body as Record<string, unknown>;
    const db = getDb();
    const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!merchant) {
      res.json({ code: 404, message: '商户不存在', data: null });
      return;
    }
    const product = db.prepare(`
      SELECT p.* FROM merchant_products p
      JOIN merchant_stores s ON p.store_id = s.id
      WHERE p.id = ? AND s.merchant_id = ?
    `).get(id, merchant.id) as Record<string, unknown> | undefined;
    if (!product) {
      res.json({ code: 404, message: '商品不存在', data: null });
      return;
    }
    db.prepare(`
      UPDATE merchant_products SET name = ?, category = ?, price = ?, image = ?, stock = ?, status = ?
      WHERE id = ?
    `).run(
      body.name as string || product.name,
      body.category as string || product.category,
      body.price !== undefined ? Number(body.price) : product.price,
      body.image as string || product.image,
      body.stock !== undefined ? Number(body.stock) : product.stock,
      body.status as string || product.status,
      id
    );
    res.json({ code: 0, message: '更新成功', data: null });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/stats', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!merchant) {
      res.json({ code: 404, message: '商户不存在', data: null });
      return;
    }
    const last7Days: Array<{ date: string; orders: number; sales: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const stat = db.prepare(`
        SELECT COUNT(*) as orders, COALESCE(SUM(goods_amount), 0) as sales
        FROM orders WHERE merchant_id = ? AND DATE(created_at) = ?
      `).get(merchant.id, dateStr) as { orders: number; sales: number };
      last7Days.push({ date: dateStr, orders: stat.orders, sales: Number(stat.sales.toFixed(2)) });
    }
    const categoryStats = db.prepare(`
      SELECT category, COUNT(*) as count FROM orders
      WHERE merchant_id = ? GROUP BY category
    `).all(merchant.id) as Record<string, unknown>[];
    res.json({
      code: 0,
      message: 'ok',
      data: { last7Days, categoryStats }
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/finance', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!merchant) {
      res.json({ code: 404, message: '商户不存在', data: null });
      return;
    }
    const totalIncome = db.prepare(`
      SELECT COALESCE(SUM(merchant_income), 0) as total FROM settlements WHERE merchant_id = ?
    `).get(merchant.id) as { total: number };
    const settlements = db.prepare(`
      SELECT s.*, o.order_no, o.created_at as order_time
      FROM settlements s JOIN orders o ON s.order_id = o.id
      WHERE s.merchant_id = ? ORDER BY s.settled_at DESC LIMIT 50
    `).all(merchant.id) as Record<string, unknown>[];
    const withdrawals = db.prepare(`
      SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
    `).all(userId) as Record<string, unknown>[];
    res.json({
      code: 0,
      message: 'ok',
      data: {
        balance: merchant.balance as number,
        totalIncome: Number(totalIncome.total.toFixed(2)),
        commissionRate: merchant.commission_rate as number,
        settlements: settlements.map(s => ({
          id: s.id,
          orderId: s.order_id,
          orderNo: s.order_no,
          orderTime: s.order_time,
          merchantIncome: s.merchant_income,
          platformIncome: s.platform_income,
          settledAt: s.settled_at
        })),
        withdrawals: withdrawals.map(w => ({
          id: w.id,
          amount: w.amount,
          fee: w.fee,
          status: w.status,
          auditNote: w.audit_note,
          createdAt: w.created_at,
          paidAt: w.paid_at
        }))
      }
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

export default router;

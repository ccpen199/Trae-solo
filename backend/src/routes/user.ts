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
    cityId: row.city_id as string,
    userId: row.user_id as string,
    merchantId: row.merchant_id as string | null,
    riderId: row.rider_id as string | null,
    status: row.status as string,
    amount: row.amount as number,
    goodsAmount: row.goods_amount as number,
    deliveryFee: row.delivery_fee as number,
    distance: row.distance as number,
    weight: row.weight as number,
    premium: row.premium as number,
    couponId: row.coupon_id as string | null,
    payMethod: row.pay_method as string,
    payStatus: row.pay_status as string,
    pickupName: row.pickup_name as string,
    pickupPhone: row.pickup_phone as string,
    pickupAddress: row.pickup_address as string,
    pickupLat: row.pickup_lat as number,
    pickupLng: row.pickup_lng as number,
    deliverName: row.deliver_name as string,
    deliverPhone: row.deliver_phone as string,
    deliverAddress: row.deliver_address as string,
    deliverLat: row.deliver_lat as number,
    deliverLng: row.deliver_lng as number,
    goodsDescription: row.goods_description as string,
    goodsImages: row.goods_images ? JSON.parse(row.goods_images as string) : [],
    remark: row.remark as string,
    expectedAt: row.expected_at as string | null,
    acceptedAt: row.accepted_at as string | null,
    pickedUpAt: row.picked_up_at as string | null,
    completedAt: row.completed_at as string | null,
    cancelledAt: row.cancelled_at as string | null,
    cancelReason: row.cancel_reason as string | null,
    createdAt: row.created_at as string
  };
}

function rowToAddress(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    tag: row.tag as string,
    name: row.name as string,
    phone: row.phone as string,
    address: row.address as string,
    lat: row.lat as number,
    lng: row.lng as number,
    isDefault: Boolean(row.is_default)
  };
}

function generateOrderNo(): string {
  return 'SP' + Date.now() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
}

router.get('/orders', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { status } = req.query as { status?: string };
    const db = getDb();
    let sql = 'SELECT * FROM orders WHERE user_id = ?';
    const params: unknown[] = [userId];
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

router.get('/orders/:id', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const db = getDb();
    const row = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, userId) as Record<string, unknown> | undefined;
    if (!row) {
      res.json({ code: 404, message: '订单不存在', data: null });
      return;
    }
    const order = rowToOrder(row);

    if (order.riderId) {
      const riderRow = db.prepare(`
        SELECT r.*, u.nickname, u.avatar, u.phone
        FROM riders r
        JOIN users u ON r.user_id = u.id
        WHERE r.id = ?
      `).get(order.riderId) as Record<string, unknown> | undefined;
      if (riderRow) {
        order.rider = {
          id: riderRow.id,
          userId: riderRow.user_id,
          nickname: riderRow.nickname,
          avatar: riderRow.avatar,
          phone: riderRow.phone,
          level: riderRow.level,
          avgRating: riderRow.avg_rating,
          totalOrders: riderRow.total_orders
        };
      }
    }

    const tracks = db.prepare(`
      SELECT * FROM gps_tracks WHERE order_id = ? ORDER BY timestamp ASC
    `).all(id) as Record<string, unknown>[];
    order.tracks = tracks.map(t => ({
      id: t.id,
      timestamp: t.timestamp,
      lat: t.lat,
      lng: t.lng,
      speed: t.speed,
      accuracy: t.accuracy
    }));

    res.json({ code: 0, message: 'ok', data: order });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/orders', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const body = req.body as Record<string, unknown>;
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();
    const orderNo = generateOrderNo();
    const category = body.category as string || 'send';
    const goodsAmount = Number(body.goodsAmount || 0);
    const deliveryFee = Number(body.deliveryFee || 3);

    db.prepare(`
      INSERT INTO orders (id, order_no, category, city_id, user_id, merchant_id, rider_id, status, amount, goods_amount, delivery_fee, distance, weight, premium, coupon_id, pay_method, pay_status, pickup_name, pickup_phone, pickup_address, pickup_lat, pickup_lng, deliver_name, deliver_phone, deliver_address, deliver_lat, deliver_lng, goods_description, goods_images, remark, expected_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, orderNo, category, body.cityId as string || null, userId,
      body.merchantId as string || null, null, 'pending',
      Number((goodsAmount + deliveryFee).toFixed(2)), goodsAmount, deliveryFee,
      Number(body.distance || 0), Number(body.weight || 0), Number(body.premium || 0),
      body.couponId as string || null, body.payMethod as string || 'wechat', 'unpaid',
      body.pickupName as string || '', body.pickupPhone as string || '', body.pickupAddress as string || '',
      Number(body.pickupLat || 0), Number(body.pickupLng || 0),
      body.deliverName as string || '', body.deliverPhone as string || '', body.deliverAddress as string || '',
      Number(body.deliverLat || 0), Number(body.deliverLng || 0),
      body.goodsDescription as string || '',
      body.goodsImages ? JSON.stringify(body.goodsImages) : JSON.stringify([]),
      body.remark as string || '',
      body.expectedAt as string || null, now
    );

    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
    res.json({ code: 0, message: 'ok', data: rowToOrder(row) });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/orders/:id/cancel', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { reason } = req.body as { reason?: string };
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, userId) as Record<string, unknown> | undefined;
    if (!order) {
      res.json({ code: 404, message: '订单不存在', data: null });
      return;
    }
    if (!['pending', 'accepted'].includes(order.status as string)) {
      res.json({ code: 400, message: '当前状态无法取消', data: null });
      return;
    }
    const now = new Date().toISOString();
    db.prepare('UPDATE orders SET status = ?, cancelled_at = ?, cancel_reason = ? WHERE id = ?')
      .run('cancelled', now, reason || '用户取消', id);
    res.json({ code: 0, message: '取消成功', data: { id, status: 'cancelled' } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/orders/:id/review', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { rating, tags, content, images } = req.body as { rating?: number; tags?: string[]; content?: string; images?: string[] };
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, userId) as Record<string, unknown> | undefined;
    if (!order) {
      res.json({ code: 404, message: '订单不存在', data: null });
      return;
    }
    if (order.status !== 'completed') {
      res.json({ code: 400, message: '订单未完成，无法评价', data: null });
      return;
    }
    const exists = db.prepare('SELECT id FROM reviews WHERE order_id = ?').get(id);
    if (exists) {
      res.json({ code: 400, message: '该订单已评价', data: null });
      return;
    }
    const reviewId = uuidv4();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO reviews (id, order_id, user_id, rating, tags, content, images, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reviewId, id, userId,
      rating && rating >= 1 && rating <= 5 ? rating : 5,
      tags ? JSON.stringify(tags) : JSON.stringify([]),
      content || '',
      images ? JSON.stringify(images) : JSON.stringify([]),
      now
    );
    res.json({ code: 0, message: '评价成功', data: { id: reviewId, createdAt: now } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/orders/:id/dispute', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { type, description, evidences } = req.body as { type?: string; description?: string; evidences?: string[] };
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, userId) as Record<string, unknown> | undefined;
    if (!order) {
      res.json({ code: 404, message: '订单不存在', data: null });
      return;
    }
    const ticketId = uuidv4();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO dispute_tickets (id, order_id, initiator, type, description, evidences, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      ticketId, id, 'user',
      type || 'complaint', description || '',
      evidences ? JSON.stringify(evidences) : JSON.stringify([]),
      'pending', now
    );
    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('disputed', id);
    res.json({ code: 0, message: '申诉已提交', data: { id: ticketId, status: 'pending', createdAt: now } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/addresses', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    const rows = db.prepare('SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(userId) as Record<string, unknown>[];
    res.json({ code: 0, message: 'ok', data: rows.map(rowToAddress) });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/addresses', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const body = req.body as Record<string, unknown>;
    const db = getDb();
    const id = uuidv4();
    const isDefault = body.isDefault ? 1 : 0;
    if (isDefault) {
      db.prepare('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?').run(userId);
    }
    db.prepare(`
      INSERT INTO user_addresses (id, user_id, tag, name, phone, address, lat, lng, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, userId, body.tag as string || '',
      body.name as string || '', body.phone as string || '',
      body.address as string || '',
      Number(body.lat || 0), Number(body.lng || 0),
      isDefault
    );
    const row = db.prepare('SELECT * FROM user_addresses WHERE id = ?').get(id) as Record<string, unknown>;
    res.json({ code: 0, message: 'ok', data: rowToAddress(row) });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.put('/addresses/:id', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const body = req.body as Record<string, unknown>;
    const db = getDb();
    const exists = db.prepare('SELECT id FROM user_addresses WHERE id = ? AND user_id = ?').get(id, userId);
    if (!exists) {
      res.json({ code: 404, message: '地址不存在', data: null });
      return;
    }
    const isDefault = body.isDefault ? 1 : 0;
    if (isDefault) {
      db.prepare('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?').run(userId);
    }
    db.prepare(`
      UPDATE user_addresses SET tag = ?, name = ?, phone = ?, address = ?, lat = ?, lng = ?, is_default = ?
      WHERE id = ? AND user_id = ?
    `).run(
      body.tag as string || '',
      body.name as string || '', body.phone as string || '',
      body.address as string || '',
      Number(body.lat || 0), Number(body.lng || 0),
      isDefault, id, userId
    );
    const row = db.prepare('SELECT * FROM user_addresses WHERE id = ?').get(id) as Record<string, unknown>;
    res.json({ code: 0, message: 'ok', data: rowToAddress(row) });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.delete('/addresses/:id', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const db = getDb();
    const exists = db.prepare('SELECT id FROM user_addresses WHERE id = ? AND user_id = ?').get(id, userId);
    if (!exists) {
      res.json({ code: 404, message: '地址不存在', data: null });
      return;
    }
    db.prepare('DELETE FROM user_addresses WHERE id = ? AND user_id = ?').run(id, userId);
    res.json({ code: 0, message: '删除成功', data: null });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/wallet', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!user) {
      res.json({ code: 404, message: '用户不存在', data: null });
      return;
    }
    const coupons = db.prepare(`
      SELECT id, name, type, value, min_amount, valid_from, valid_to, used_at
      FROM coupons WHERE user_id = ? ORDER BY valid_to ASC
    `).all(userId) as Record<string, unknown>[];
    res.json({
      code: 0,
      message: 'ok',
      data: {
        balance: user.balance as number,
        coupons: coupons.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          value: c.value,
          minAmount: c.min_amount,
          validFrom: c.valid_from,
          validTo: c.valid_to,
          usedAt: c.used_at,
          isUsed: !!c.used_at,
          isValid: !c.used_at && new Date(c.valid_to as string) > new Date()
        }))
      }
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/profile', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as Record<string, unknown> | undefined;
    if (!user) {
      res.json({ code: 404, message: '用户不存在', data: null });
      return;
    }
    const profile: Record<string, unknown> = {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      realName: user.real_name,
      idCard: user.id_card,
      role: user.role,
      balance: user.balance,
      cityId: user.city_id,
      status: user.status,
      createdAt: user.created_at
    };
    if (user.role === 'rider') {
      const rider = db.prepare('SELECT * FROM riders WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
      if (rider) {
        profile.rider = {
          id: rider.id,
          level: rider.level,
          totalOrders: rider.total_orders,
          creditScore: rider.credit_score,
          fulfillmentRate: rider.fulfillment_rate,
          avgRating: rider.avg_rating,
          onlineStatus: rider.online_status,
          acceptMode: rider.accept_mode
        };
      }
    } else if (user.role === 'merchant') {
      const merchant = db.prepare('SELECT * FROM merchants WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
      if (merchant) {
        profile.merchant = {
          id: merchant.id,
          shopName: merchant.shop_name,
          category: merchant.category,
          auditStatus: merchant.audit_status,
          commissionRate: merchant.commission_rate
        };
      }
    }
    res.json({ code: 0, message: 'ok', data: profile });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.put('/profile', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const body = req.body as Record<string, unknown>;
    const db = getDb();
    db.prepare(`
      UPDATE users SET nickname = ?, avatar = ?, real_name = ?, id_card = ?, city_id = ?
      WHERE id = ?
    `).run(
      body.nickname as string || '',
      body.avatar as string || '',
      body.realName as string || '',
      body.idCard as string || '',
      body.cityId as string || null,
      userId
    );
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as Record<string, unknown>;
    res.json({
      code: 0,
      message: 'ok',
      data: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        realName: user.real_name,
        idCard: user.id_card,
        role: user.role,
        balance: user.balance,
        cityId: user.city_id,
        status: user.status,
        createdAt: user.created_at
      }
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

export default router;

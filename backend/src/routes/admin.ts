import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db';
import { authenticate, getUserId } from './auth';

const router = Router();

function requireAdmin(userId: string, db: ReturnType<typeof getDb>): Record<string, unknown> | null {
  const adminUser = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as Record<string, unknown> | undefined;
  if (!adminUser || adminUser.role !== 'admin') {
    return null;
  }
  return adminUser as Record<string, unknown>;
}

router.get('/stats', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    if (!requireAdmin(userId, db)) {
      res.json({ code: 403, message: '无权限访问', data: null });
      return;
    }
    const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
    const totalRiders = (db.prepare('SELECT COUNT(*) as count FROM riders').get() as { count: number }).count;
    const totalMerchants = (db.prepare('SELECT COUNT(*) as count FROM merchants').get() as { count: number }).count;
    const totalOrders = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number }).count;
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = (db.prepare('SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = ?').get(today) as { count: number }).count;
    const todaySalesRaw = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE DATE(created_at) = ? AND status != ?').get(today, 'cancelled') as { total: number };
    const totalRevenueRaw = db.prepare('SELECT COALESCE(SUM(platform_income), 0) as total FROM settlements').get() as { total: number };
    const activeRiders = (db.prepare('SELECT COUNT(*) as count FROM riders WHERE online_status != ?').get('offline') as { count: number }).count;
    const completedOrders = (db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = ?').get('completed') as { count: number }).count;
    const trend: Array<{ date: string; orders: number; revenue: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOrders = (db.prepare('SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = ?').get(dateStr) as { count: number }).count;
      const dayRevenueRaw = db.prepare('SELECT COALESCE(SUM(platform_income), 0) as total FROM settlements WHERE DATE(settled_at) = ?').get(dateStr) as { total: number };
      trend.push({ date: dateStr, orders: dayOrders, revenue: Number(dayRevenueRaw.total.toFixed(2)) });
    }
    res.json({
      code: 0,
      message: 'ok',
      data: {
        totalUsers,
        totalRiders,
        totalMerchants,
        totalOrders,
        todayOrders,
        todaySales: Number(todaySalesRaw.total.toFixed(2)),
        totalRevenue: Number(totalRevenueRaw.total.toFixed(2)),
        activeRiders,
        completedOrders,
        kpi: {
          completionRate: totalOrders > 0 ? Number((completedOrders / totalOrders * 100).toFixed(2)) : 0,
          riderActiveRate: totalRiders > 0 ? Number((activeRiders / totalRiders * 100).toFixed(2)) : 0
        },
        trend
      }
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/heatmap', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    if (!requireAdmin(userId, db)) {
      res.json({ code: 403, message: '无权限访问', data: null });
      return;
    }
    const centerLat = 39.9042;
    const centerLng = 116.4074;
    const gridSize = 10;
    const grid: Array<{ lat: number; lng: number; count: number }> = [];
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        grid.push({
          lat: Number((centerLat + (i - gridSize / 2) * 0.02).toFixed(4)),
          lng: Number((centerLng + (j - gridSize / 2) * 0.02).toFixed(4)),
          count: Math.floor(Math.random() * 50)
        });
      }
    }
    res.json({ code: 0, message: 'ok', data: { grid, center: { lat: centerLat, lng: centerLng } } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/riders', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    if (!requireAdmin(userId, db)) {
      res.json({ code: 403, message: '无权限访问', data: null });
      return;
    }
    const rows = db.prepare(`
      SELECT r.*, u.nickname, u.avatar, u.phone, u.status as user_status
      FROM riders r JOIN users u ON r.user_id = u.id
      ORDER BY r.total_orders DESC
      LIMIT 100
    `).all() as Record<string, unknown>[];
    res.json({
      code: 0,
      message: 'ok',
      data: rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        nickname: r.nickname,
        avatar: r.avatar,
        phone: r.phone,
        level: r.level,
        totalOrders: r.total_orders,
        creditScore: r.credit_score,
        fulfillmentRate: r.fulfillment_rate,
        avgRating: r.avg_rating,
        currentOrders: r.current_orders,
        onlineStatus: r.online_status,
        acceptMode: r.accept_mode,
        userStatus: r.user_status,
        currentLat: r.current_lat,
        currentLng: r.current_lng,
        onlineAt: r.online_at
      }))
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/anomaly', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    if (!requireAdmin(userId, db)) {
      res.json({ code: 403, message: '无权限访问', data: null });
      return;
    }
    const cancelled = (db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = ?').get('cancelled') as { count: number }).count;
    const disputed = (db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = ?').get('disputed') as { count: number }).count;
    const timeout = (db.prepare(`
      SELECT COUNT(*) as count FROM orders
      WHERE status IN ('accepted', 'picked_up', 'delivering')
      AND expected_at IS NOT NULL AND datetime(expected_at) < datetime('now')
    `).get() as { count: number }).count;
    const attribution = [
      { reason: '用户取消', count: Math.floor(cancelled * 0.4) },
      { reason: '商户拒单', count: Math.floor(cancelled * 0.3) },
      { reason: '骑手超时', count: timeout },
      { reason: '服务投诉', count: disputed }
    ];
    const anomalyOrders = db.prepare(`
      SELECT o.*, u.nickname as user_name, u.phone as user_phone
      FROM orders o JOIN users u ON o.user_id = u.id
      WHERE o.status IN ('cancelled', 'disputed') OR (o.status IN ('accepted', 'picked_up', 'delivering') AND o.expected_at IS NOT NULL AND datetime(o.expected_at) < datetime('now'))
      ORDER BY o.created_at DESC LIMIT 50
    `).all() as Record<string, unknown>[];
    res.json({
      code: 0,
      message: 'ok',
      data: {
        totalCancelled: cancelled,
        totalDisputed: disputed,
        totalTimeout: timeout,
        attribution,
        orders: anomalyOrders.map(o => ({
          id: o.id,
          orderNo: o.order_no,
          category: o.category,
          status: o.status,
          amount: o.amount,
          userId: o.user_id,
          userName: o.user_name,
          userPhone: o.user_phone,
          cancelReason: o.cancel_reason,
          expectedAt: o.expected_at,
          createdAt: o.created_at
        }))
      }
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/tickets', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    if (!requireAdmin(userId, db)) {
      res.json({ code: 403, message: '无权限访问', data: null });
      return;
    }
    const { status } = req.query as { status?: string };
    let sql = `
      SELECT t.*, o.order_no, o.amount
      FROM dispute_tickets t JOIN orders o ON t.order_id = o.id
    `;
    const params: unknown[] = [];
    if (status) {
      sql += ' WHERE t.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY t.created_at DESC LIMIT 100';
    const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
    res.json({
      code: 0,
      message: 'ok',
      data: rows.map(t => ({
        id: t.id,
        orderId: t.order_id,
        orderNo: t.order_no,
        orderAmount: t.amount,
        initiator: t.initiator,
        type: t.type,
        description: t.description,
        status: t.status,
        responsibleParty: t.responsible_party,
        compensation: t.compensation,
        assignee: t.assignee,
        createdAt: t.created_at,
        resolvedAt: t.resolved_at
      }))
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/tickets/:id', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const db = getDb();
    if (!requireAdmin(userId, db)) {
      res.json({ code: 403, message: '无权限访问', data: null });
      return;
    }
    const ticket = db.prepare(`
      SELECT t.*, o.order_no, o.amount, o.category, o.status as order_status, o.user_id, o.deliver_address,
             u.nickname as user_name, u.phone as user_phone
      FROM dispute_tickets t
      JOIN orders o ON t.order_id = o.id
      JOIN users u ON o.user_id = u.id
      WHERE t.id = ?
    `).get(id) as Record<string, unknown> | undefined;
    if (!ticket) {
      res.json({ code: 404, message: '工单不存在', data: null });
      return;
    }
    res.json({
      code: 0,
      message: 'ok',
      data: {
        id: ticket.id,
        orderId: ticket.order_id,
        orderNo: ticket.order_no,
        orderAmount: ticket.amount,
        orderCategory: ticket.category,
        orderStatus: ticket.order_status,
        initiator: ticket.initiator,
        type: ticket.type,
        description: ticket.description,
        evidences: ticket.evidences ? JSON.parse(ticket.evidences as string) : [],
        status: ticket.status,
        responsibleParty: ticket.responsible_party,
        compensation: ticket.compensation,
        assignee: ticket.assignee,
        userId: ticket.user_id,
        userName: ticket.user_name,
        userPhone: ticket.user_phone,
        deliverAddress: ticket.deliver_address,
        createdAt: ticket.created_at,
        resolvedAt: ticket.resolved_at
      }
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/tickets/:id/resolve', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { responsibleParty, compensation, note } = req.body as { responsibleParty?: string; compensation?: number; note?: string };
    const db = getDb();
    if (!requireAdmin(userId, db)) {
      res.json({ code: 403, message: '无权限访问', data: null });
      return;
    }
    const ticket = db.prepare('SELECT * FROM dispute_tickets WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!ticket) {
      res.json({ code: 404, message: '工单不存在', data: null });
      return;
    }
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE dispute_tickets SET status = ?, responsible_party = ?, compensation = ?, assignee = ?, resolved_at = ?
      WHERE id = ?
    `).run('resolved', responsibleParty || 'shared', compensation || 0, userId, now, id);
    db.prepare(`
      INSERT INTO operation_logs (id, admin_id, action, target_type, target_id, detail, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), userId, '处理工单', 'ticket', id, JSON.stringify({ responsibleParty, compensation, note }), now);
    res.json({ code: 0, message: '处理成功', data: { id, status: 'resolved', resolvedAt: now } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/intervention/transfer', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { orderId, targetRiderId } = req.query as { orderId?: string; targetRiderId?: string };
    const db = getDb();
    if (!requireAdmin(userId, db)) {
      res.json({ code: 403, message: '无权限访问', data: null });
      return;
    }
    if (!orderId || !targetRiderId) {
      res.json({ code: 400, message: '订单ID和目标骑手ID不能为空', data: null });
      return;
    }
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Record<string, unknown> | undefined;
    if (!order) {
      res.json({ code: 404, message: '订单不存在', data: null });
      return;
    }
    const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(targetRiderId) as Record<string, unknown> | undefined;
    if (!rider) {
      res.json({ code: 404, message: '目标骑手不存在', data: null });
      return;
    }
    const now = new Date().toISOString();
    const fromRiderId = order.rider_id as string | null;
    db.prepare('UPDATE orders SET rider_id = ? WHERE id = ?').run(targetRiderId, orderId);
    db.prepare(`
      INSERT INTO operation_logs (id, admin_id, action, target_type, target_id, detail, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), userId, '强制转单', 'order', orderId, JSON.stringify({ fromRiderId, toRiderId: targetRiderId }), now);
    res.json({ code: 0, message: '转单成功', data: { orderId, targetRiderId, transferredAt: now } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/intervention/fuse', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { cityId, enabled, reason } = req.body as { cityId?: string; enabled?: boolean; reason?: string };
    const db = getDb();
    if (!requireAdmin(userId, db)) {
      res.json({ code: 403, message: '无权限访问', data: null });
      return;
    }
    if (!cityId) {
      res.json({ code: 400, message: '城市ID不能为空', data: null });
      return;
    }
    const now = new Date().toISOString();
    const status = enabled === false ? 'paused' : 'active';
    db.prepare('UPDATE cities SET status = ? WHERE id = ?').run(status, cityId);
    db.prepare(`
      INSERT INTO operation_logs (id, admin_id, action, target_type, target_id, detail, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), userId, '熔断调度', 'city', cityId, JSON.stringify({ status, reason }), now);
    res.json({ code: 0, message: 'ok', data: { cityId, status, updatedAt: now } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/cities', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    if (!requireAdmin(userId, db)) {
      res.json({ code: 403, message: '无权限访问', data: null });
      return;
    }
    const cities = db.prepare('SELECT * FROM cities ORDER BY name').all() as Record<string, unknown>[];
    const result = cities.map(c => {
      const geofences = db.prepare('SELECT * FROM city_geofences WHERE city_id = ?').all(c.id as string) as Record<string, unknown>[];
      return {
        id: c.id,
        name: c.name,
        province: c.province,
        tier: c.tier,
        centerLat: c.center_lat,
        centerLng: c.center_lng,
        pricingConfig: c.pricing_config ? JSON.parse(c.pricing_config as string) : {},
        status: c.status,
        geofences: geofences.map((g: Record<string, unknown>) => ({
          id: g.id,
          name: g.name,
          type: g.type,
          polygon: g.polygon ? JSON.parse(g.polygon as string) : [],
          config: g.config ? JSON.parse(g.config as string) : {}
        }))
      };
    });
    res.json({ code: 0, message: 'ok', data: result });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/finance', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    if (!requireAdmin(userId, db)) {
      res.json({ code: 403, message: '无权限访问', data: null });
      return;
    }
    const totalPlatformIncomeRaw = db.prepare('SELECT COALESCE(SUM(platform_income), 0) as total FROM settlements').get() as { total: number };
    const totalRiderPayoutRaw = db.prepare('SELECT COALESCE(SUM(rider_income), 0) as total FROM settlements').get() as { total: number };
    const totalMerchantPayoutRaw = db.prepare('SELECT COALESCE(SUM(merchant_income), 0) as total FROM settlements').get() as { total: number };
    const totalInsuranceRaw = db.prepare('SELECT COALESCE(SUM(insurance_fee), 0) as total FROM settlements').get() as { total: number };
    const totalTaxRaw = db.prepare('SELECT COALESCE(SUM(tax), 0) as total FROM settlements').get() as { total: number };
    const pendingWithdrawals = db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE status = ?').get('pending') as { count: number; total: number };
    const today = new Date().toISOString().split('T')[0];
    const todayIncomeRaw = db.prepare('SELECT COALESCE(SUM(platform_income), 0) as total FROM settlements WHERE DATE(settled_at) = ?').get(today) as { total: number };
    res.json({
      code: 0,
      message: 'ok',
      data: {
        totalPlatformIncome: Number(totalPlatformIncomeRaw.total.toFixed(2)),
        totalRiderPayout: Number(totalRiderPayoutRaw.total.toFixed(2)),
        totalMerchantPayout: Number(totalMerchantPayoutRaw.total.toFixed(2)),
        totalInsurance: Number(totalInsuranceRaw.total.toFixed(2)),
        totalTax: Number(totalTaxRaw.total.toFixed(2)),
        pendingWithdrawalsCount: pendingWithdrawals.count,
        pendingWithdrawalsAmount: Number(pendingWithdrawals.total.toFixed(2)),
        todayIncome: Number(todayIncomeRaw.total.toFixed(2))
      }
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.get('/withdrawals', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const db = getDb();
    if (!requireAdmin(userId, db)) {
      res.json({ code: 403, message: '无权限访问', data: null });
      return;
    }
    const { status } = req.query as { status?: string };
    let sql = 'SELECT w.*, u.nickname, u.phone, u.role FROM withdrawals w JOIN users u ON w.user_id = u.id';
    const params: unknown[] = [];
    if (status) {
      sql += ' WHERE w.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY w.created_at DESC LIMIT 100';
    const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
    res.json({
      code: 0,
      message: 'ok',
      data: rows.map(w => ({
        id: w.id,
        userId: w.user_id,
        userName: w.nickname,
        userPhone: w.phone,
        userRole: w.role,
        amount: w.amount,
        fee: w.fee,
        bankName: w.bank_name,
        bankCard: w.bank_card,
        holderName: w.holder_name,
        status: w.status,
        auditNote: w.audit_note,
        createdAt: w.created_at,
        paidAt: w.paid_at
      }))
    });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/withdrawals/:id/approve', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { approved, note } = req.body as { approved?: boolean; note?: string };
    const db = getDb();
    if (!requireAdmin(userId, db)) {
      res.json({ code: 403, message: '无权限访问', data: null });
      return;
    }
    const withdrawal = db.prepare('SELECT * FROM withdrawals WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!withdrawal) {
      res.json({ code: 404, message: '提现申请不存在', data: null });
      return;
    }
    if (withdrawal.status !== 'pending') {
      res.json({ code: 400, message: '该申请已处理', data: null });
      return;
    }
    const now = new Date().toISOString();
    const newStatus = approved === false ? 'rejected' : 'approved';
    const paidAt = newStatus === 'approved' ? now : null;
    db.prepare('UPDATE withdrawals SET status = ?, audit_note = ?, paid_at = ? WHERE id = ?')
      .run(newStatus, note || '', paidAt, id);
    if (newStatus === 'rejected') {
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?')
        .run(withdrawal.amount as number, withdrawal.user_id as string);
    }
    db.prepare(`
      INSERT INTO operation_logs (id, admin_id, action, target_type, target_id, detail, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), userId, newStatus === 'approved' ? '审核通过提现' : '审核拒绝提现', 'withdrawal', id, JSON.stringify({ note }), now);
    res.json({ code: 0, message: '处理成功', data: { id, status: newStatus } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

router.post('/riders/:id/ban', authenticate, (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { banned, reason } = req.body as { banned?: boolean; reason?: string };
    const db = getDb();
    if (!requireAdmin(userId, db)) {
      res.json({ code: 403, message: '无权限访问', data: null });
      return;
    }
    const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!rider) {
      res.json({ code: 404, message: '骑手不存在', data: null });
      return;
    }
    const now = new Date().toISOString();
    const newStatus = banned === false ? 'normal' : 'frozen';
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(newStatus, rider.user_id as string);
    db.prepare(`
      INSERT INTO operation_logs (id, admin_id, action, target_type, target_id, detail, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), userId, newStatus === 'frozen' ? '封禁骑手' : '解封骑手', 'rider', id, JSON.stringify({ reason }), now);
    res.json({ code: 0, message: 'ok', data: { riderId: id, status: newStatus } });
  } catch (err) {
    res.json({ code: 500, message: (err as Error).message, data: null });
  }
});

export default router;

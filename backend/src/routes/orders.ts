import { Router } from 'express';
import { authMiddleware, AuthRequest, clientInfoMiddleware, adminMiddleware } from '../middleware/auth';
import { orderService } from '../services/order';
import { db } from '../database';
import { now } from '../utils';

const router = Router();

router.post('/', authMiddleware, clientInfoMiddleware, async (req: AuthRequest, res) => {
  try {
    const { productId, rechargeAccount, quantity = 1 } = req.body;

    if (!productId || !rechargeAccount) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }

    const result = await orderService.createOrder({
      userId: req.userId!,
      productId,
      rechargeAccount,
      quantity,
      ip: req.clientIp || '',
      region: req.clientRegion || ''
    });

    if (!result.success) {
      const status = result.riskBlocked ? 403 : 400;
      return res.status(status).json({ success: false, message: result.error });
    }

    res.json({ success: true, data: result.order });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/:id/pay', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await orderService.payOrder(req.params.id, req.userId!);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }
    res.json({ success: true, data: result.order });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/:id/retry', authMiddleware, (req: AuthRequest, res) => {
  try {
    const result = orderService.retryOrder(req.params.id, req.userId!);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { status, page = 1, pageSize = 20 }: any = req.query;
    const result = orderService.getUserOrders(req.userId!, status, Number(page), Number(pageSize));
    res.json({ success: true, data: result });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/:id', authMiddleware, (req: AuthRequest, res) => {
  try {
    const order = orderService.getOrderDetail(req.params.id, req.userId);
    if (!order) return res.status(404).json({ success: false, message: '订单不存在' });
    res.json({ success: true, data: order });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/:id/cards', authMiddleware, (req: AuthRequest, res) => {
  try {
    const cards = orderService.getOrderCards(req.params.id, req.userId!);
    if (!cards) return res.status(400).json({ success: false, message: '暂无卡密信息' });
    res.json({ success: true, data: cards });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/:id/diagnostic', authMiddleware, (req: AuthRequest, res) => {
  try {
    const order: any = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!order) return res.status(404).json({ success: false, message: '订单不存在' });

    const { rechargeDiagnosticService } = require('../services/diagnostic');
    const diagnostic = rechargeDiagnosticService.diagnose(req.params.id);
    res.json({ success: true, data: diagnostic });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/stats/summary', authMiddleware, adminMiddleware, (_req, res) => {
  try {
    const t = now();
    const todayStart = t - (t % 86400);
    const weekStart = t - 86400 * 7;
    const monthStart = t - 86400 * 30;

    const todayRow: any = db.prepare('SELECT COUNT(*) as cnt, COALESCE(SUM(final_amount),0) as amount FROM orders WHERE created_at >= ?').get(todayStart);
    const weekRow: any = db.prepare('SELECT COUNT(*) as cnt, COALESCE(SUM(final_amount),0) as amount FROM orders WHERE created_at >= ?').get(weekStart);
    const monthRow: any = db.prepare('SELECT COUNT(*) as cnt, COALESCE(SUM(final_amount),0) as amount FROM orders WHERE created_at >= ?').get(monthStart);
    const userRow: any = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
    const productRow: any = db.prepare('SELECT COUNT(*) as cnt FROM products WHERE status = 1').get();
    const failRow: any = db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE status = 'failed' AND created_at >= ?").get(todayStart);
    const commissionRow: any = db.prepare('SELECT COALESCE(SUM(amount),0) as amount FROM commission_records WHERE created_at >= ?').get(monthStart);

    res.json({
      success: true,
      data: {
        today: { orders: todayRow.cnt, amount: todayRow.amount },
        week: { orders: weekRow.cnt, amount: weekRow.amount },
        month: { orders: monthRow.cnt, amount: monthRow.amount },
        totalUsers: userRow.cnt,
        totalProducts: productRow.cnt,
        todayFailures: failRow.cnt,
        monthCommission: commissionRow.amount
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/admin/list', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { status, keyword, page = 1, pageSize = 20, startDate, endDate }: any = req.query;
    const wheres: string[] = [];
    const params: any[] = [];

    if (status && status !== 'all') {
      wheres.push('o.status = ?');
      params.push(status);
    }
    if (keyword) {
      wheres.push('(o.order_no LIKE ? OR o.recharge_account LIKE ? OR u.phone LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (startDate) {
      wheres.push('o.created_at >= ?');
      params.push(Math.floor(new Date(startDate).getTime() / 1000));
    }
    if (endDate) {
      wheres.push('o.created_at <= ?');
      params.push(Math.floor(new Date(endDate).getTime() / 1000) + 86399);
    }

    const whereSql = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';

    const totalRow: any = db.prepare(`SELECT COUNT(*) as cnt FROM orders o LEFT JOIN users u ON o.user_id = u.id ${whereSql}`).get(...params);

    const offset = (Number(page) - 1) * Number(pageSize);
    params.push(Number(pageSize), offset);

    const orders = db.prepare(`
      SELECT o.*, u.phone as user_phone, u.nickname as user_name, p.name as product_name, s.name as supplier_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN suppliers s ON o.supplier_id = s.id
      ${whereSql}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params);

    res.json({ success: true, data: { list: orders, total: totalRow.cnt, page: Number(page), pageSize: Number(pageSize) } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;

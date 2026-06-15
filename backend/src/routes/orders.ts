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

    const switchHistory: any[] = db.prepare(`
      SELECT cs.*, rc.name as channel_name, s.name as supplier_name
      FROM channel_switch_logs cs
      LEFT JOIN recharge_channels rc ON cs.to_channel_id = rc.id
      LEFT JOIN suppliers s ON cs.to_supplier_id = s.id
      WHERE cs.order_id = ?
      ORDER BY cs.created_at DESC
    `).all(req.params.id);

    const errorCode = order.fail_reason || 'UNKNOWN_ERROR';
    let category = 'system_error';
    let severity = 'medium';
    if (errorCode.includes('TIMEOUT') || errorCode.includes('timeout')) {
      category = 'network_timeout'; severity = 'high';
    } else if (errorCode.includes('STOCK') || errorCode.includes('stock') || errorCode.includes('库存')) {
      category = 'stock_empty'; severity = 'high';
    } else if (errorCode.includes('ACCOUNT') || errorCode.includes('account') || errorCode.includes('账号')) {
      category = 'account_error'; severity = 'low';
    } else if (errorCode.includes('region') || errorCode.includes('REGION') || errorCode.includes('地域')) {
      category = 'region_limit'; severity = 'medium';
    } else if (errorCode.includes('maintain') || errorCode.includes('MAINTAIN') || errorCode.includes('维护')) {
      category = 'supplier_maintenance'; severity = 'medium';
    }

    const severityLabel: Record<string, string> = { low: '轻微', medium: '中等', high: '严重' };
    const categoryLabel: Record<string, string> = {
      network_timeout: '网络超时',
      stock_empty: '库存不足',
      account_error: '账号错误',
      region_limit: '地域限制',
      supplier_maintenance: '供应商维护',
      system_error: '系统错误'
    };

    const enriched = {
      ...diagnostic,
      errorCode,
      category,
      categoryLabel: categoryLabel[category] || '其他错误',
      severity,
      severityLabel: severityLabel[severity] || '中等',
      userMessage: diagnostic.userMessage,
      rootCause: diagnostic.rootCause,
      suggestions: diagnostic.suggestions,
      autoAction: diagnostic.autoActions.length > 0 ? diagnostic.autoActions.join(', ') : '无',
      switchChannelAvailable: diagnostic.switchChannel,
      switchHistory
    };

    res.json({ success: true, data: enriched });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/:id/retry-switch-channel', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const order: any = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!order) return res.status(404).json({ success: false, message: '订单不存在' });
    if (order.status !== 'failed') return res.status(400).json({ success: false, message: '只有失败订单可以重试' });

    const channels: any[] = db.prepare(`
      SELECT rc.*, s.name as supplier_name
      FROM recharge_channels rc
      LEFT JOIN suppliers s ON rc.supplier_id = s.id
      WHERE rc.product_id = ? AND rc.status = 1 AND rc.id != ?
      ORDER BY rc.priority ASC
    `).all(order.product_id, order.channel_id || 0);

    if (channels.length === 0) {
      return res.status(400).json({ success: false, message: '没有可用的备用通道' });
    }

    const nextChannel = channels[0];
    const t = now();
    const switchId = require('../utils').generateId();

    db.prepare(`
      INSERT INTO channel_switch_logs (id, order_id, from_channel_id, to_channel_id, from_supplier_id, to_supplier_id, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(switchId, order.id, order.channel_id, nextChannel.id, order.supplier_id, nextChannel.supplier_id, '用户手动重试切换', t);

    db.prepare('UPDATE orders SET channel_id = ?, supplier_id = ?, status = ?, updated_at = ? WHERE id = ?')
      .run(nextChannel.id, nextChannel.supplier_id, 'processing', t, order.id);

    setTimeout(async () => {
      const success = Math.random() > 0.3;
      const { rechargeDiagnosticService } = require('../services/diagnostic');
      if (success) {
        db.prepare("UPDATE orders SET status = 'completed', finish_time = ?, updated_at = ? WHERE id = ?")
          .run(now(), now(), order.id);
      } else {
        const diag = rechargeDiagnosticService.diagnose(order.id);
        db.prepare("UPDATE orders SET status = 'failed', fail_reason = ?, diagnostic_result = ?, updated_at = ? WHERE id = ?")
          .run(diag.userMessage, JSON.stringify(diag), now(), order.id);
      }
    }, 2000);

    res.json({
      success: true,
      data: {
        switchId,
        newChannel: { id: nextChannel.id, name: nextChannel.name, supplierName: nextChannel.supplier_name },
        newStatus: 'processing',
        message: `已切换到 ${nextChannel.supplier_name} - ${nextChannel.name}，正在重试...`
      }
    });
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

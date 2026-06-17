import { Router } from 'express';
import { authMiddleware, AuthRequest, clientInfoMiddleware, adminMiddleware } from '../middleware/auth';
import { orderService } from '../services/order';
import { db } from '../database';
import { now, generateId } from '../utils';

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

router.get('/error-codes', authMiddleware, adminMiddleware, (_req, res) => {
  try {
    const rows: any[] = db.prepare('SELECT * FROM error_code_mapping ORDER BY supplier_code, error_code').all();
    res.json({ success: true, data: rows });
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
    const order: any = req.userRole === 'admin'
      ? db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
      : db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!order) return res.status(404).json({ success: false, message: '订单不存在' });

    const { rechargeDiagnosticService } = require('../services/diagnostic');
    const diagnostic = rechargeDiagnosticService.diagnose(req.params.id);

    const switchHistory: any[] = db.prepare(`
      SELECT cs.*, COALESCE(rc.name, '通道' || COALESCE(rc.priority, 0)) as channel_name, s.name as supplier_name
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

router.get('/admin/:id', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  try {
    const order: any = db.prepare(`
      SELECT o.*, u.phone as user_phone, u.nickname as user_name, p.name as product_name, p.sku_type, p.face_value,
             s.name as supplier_name, s.code as supplier_code,
             COALESCE(rc.name, '通道' || COALESCE(rc.priority, 0)) as channel_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN suppliers s ON o.supplier_id = s.id
      LEFT JOIN recharge_channels rc ON o.channel_id = rc.id
      WHERE o.id = ?
    `).get(req.params.id);
    
    if (!order) return res.status(404).json({ success: false, message: '订单不存在' });
    
    if (order.diagnostic_result) {
      try { order.diagnostic_result = JSON.parse(order.diagnostic_result); } catch {}
    }
    
    const statusHistory: any[] = [
      { status: 'pending', label: '订单创建', time: order.created_at, operator: '用户', remark: '订单提交成功' }
    ];
    if (order.pay_time) {
      statusHistory.push({ status: 'paid', label: '支付成功', time: order.pay_time, operator: '系统', remark: '用户支付完成' });
    }
    if (order.status === 'recharging' || order.status === 'completed' || order.status === 'failed') {
      statusHistory.push({ status: 'recharging', label: '充值中', time: order.recharge_time || order.updated_at, operator: '系统', remark: '开始充值处理' });
    }
    if (order.status === 'completed') {
      statusHistory.push({ status: 'completed', label: '充值成功', time: order.finish_time, operator: '系统', remark: '充值已到账' });
    }
    if (order.status === 'failed') {
      statusHistory.push({ status: 'failed', label: '充值失败', time: order.finish_time || order.updated_at, operator: '系统', remark: order.fail_reason || '充值失败' });
    }
    if (order.status === 'refunded') {
      statusHistory.push({ status: 'refunded', label: '已退款', time: order.finish_time || order.updated_at, operator: '管理员', remark: '订单已退款' });
    }
    
    order.statusHistory = statusHistory;
    
    res.json({ success: true, data: order });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/:id/refund', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const order: any = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!order) return res.status(404).json({ success: false, message: '订单不存在' });
    if (order.status !== 'failed') return res.status(400).json({ success: false, message: '只有失败订单可以退款' });
    if (order.refund_status === 'refunded') return res.status(400).json({ success: false, message: '订单已退款' });
    
    const t = now();
    const tx = db.transaction(() => {
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(order.final_amount, order.user_id);
      db.prepare("UPDATE orders SET status = 'refunded', refund_status = 'refunded', refund_time = ?, updated_at = ?, finish_time = ? WHERE id = ?")
        .run(t, t, t, order.id);
      
      db.prepare(`
        INSERT INTO commission_records (id, user_id, order_id, amount, type, status, created_at, remark)
        VALUES (?, ?, ?, ?, 'refund', 'completed', ?, '订单退款')
      `).run(generateId(), order.user_id, order.id, -order.final_amount, t);
    });
    
    try {
      tx();
      res.json({ success: true, message: '退款成功', data: { refundedAmount: order.final_amount, newStatus: 'refunded' } });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
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

router.get('/abnormal/summary', authMiddleware, (req: AuthRequest, res) => {
  try {
    const t = now();
    const userId = req.userId!;

    const failedCount: any = db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE user_id = ? AND status = 'failed'").get(userId);
    const pendingReview: any = db.prepare("SELECT COUNT(*) as cnt FROM review_records WHERE user_id = ? AND status = 'pending'").get(userId);
    const processingReview: any = db.prepare("SELECT COUNT(*) as cnt FROM review_records WHERE user_id = ? AND status = 'processing'").get(userId);
    const completedReview: any = db.prepare("SELECT COUNT(*) as cnt FROM review_records WHERE user_id = ? AND status = 'resolved'").get(userId);
    const recentFlow: any = db.prepare(`
      SELECT COUNT(*) as cnt FROM orders
      WHERE user_id = ? AND status = 'completed' AND created_at >= ?
    `).get(userId, t - 86400 * 7);

    res.json({
      success: true,
      data: {
        failedOrders: failedCount.cnt || 0,
        pendingReviews: pendingReview.cnt || 0,
        processingReviews: processingReview.cnt || 0,
        resolvedReviews: completedReview.cnt || 0,
        recentSuccessFlow: recentFlow.cnt || 0
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/abnormal/list', authMiddleware, (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { page = 1, pageSize = 20, status }: any = req.query;

    const whereClauses: string[] = ["o.user_id = ?"];
    const params: any[] = [userId];

    if (status) {
      whereClauses.push("o.status = ?");
      params.push(status);
    } else {
      whereClauses.push("o.status IN ('failed', 'refunded', 'recharging')");
    }

    const whereSql = "WHERE " + whereClauses.join(" AND ");
    const offset = (Number(page) - 1) * Number(pageSize);

    const totalRow: any = db.prepare(`SELECT COUNT(*) as cnt FROM orders o ${whereSql}`).get(...params);
    params.push(Number(pageSize), offset);

    const orders: any[] = db.prepare(`
      SELECT o.id, o.order_no, o.product_id, o.recharge_account, o.final_amount, o.status, o.fail_reason,
             o.created_at, o.finish_time, o.updated_at,
             p.name as product_name, p.face_value, p.sku_type,
             s.name as supplier_name,
             COALESCE(rc.name, '通道' || COALESCE(rc.priority, 0)) as channel_name,
             rr.id as review_id, rr.status as review_status, rr.type as review_type,
             rr.appeal_reason, rr.reviewed_at
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN suppliers s ON o.supplier_id = s.id
      LEFT JOIN recharge_channels rc ON o.channel_id = rc.id
      LEFT JOIN review_records rr ON rr.order_id = o.id
      ${whereSql}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params);

    res.json({
      success: true,
      data: {
        list: orders,
        total: totalRow.cnt || 0,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/:id/appeal', authMiddleware, (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { reason, evidence } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: '请填写申诉理由' });

    const order: any = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, userId);
    if (!order) return res.status(404).json({ success: false, message: '订单不存在' });

    const t = now();
    const reviewId = generateId();

    db.prepare(`
      INSERT INTO review_records (id, user_id, order_id, type, reason, amount, status, appeal_reason, appeal_evidence, appeal_at, created_at)
      VALUES (?, ?, ?, 'order_appeal', ?, ?, 'pending', ?, ?, ?, ?)
    `).run(reviewId, userId, order.id, reason, order.final_amount, reason, evidence || '', t, t);

    res.json({
      success: true,
      data: { reviewId, status: 'pending', message: '申诉已提交，客服将在24小时内处理' }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/flow/recent', authMiddleware, (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { limit = 10 }: any = req.query;

    const orders: any[] = db.prepare(`
      SELECT o.id, o.order_no, o.product_id, o.recharge_account, o.final_amount, o.status,
             o.created_at, o.finish_time,
             p.name as product_name
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.user_id = ? AND o.status IN ('completed', 'failed', 'refunded')
      ORDER BY o.created_at DESC
      LIMIT ?
    `).all(userId, Number(limit));

    const reviews: any[] = db.prepare(`
      SELECT id, order_id, type, status, appeal_reason, created_at, reviewed_at
      FROM review_records
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, Number(limit));

    res.json({ success: true, data: { orders, reviews } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;

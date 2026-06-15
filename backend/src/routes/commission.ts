import { Router } from 'express';
import { authMiddleware, AuthRequest, adminMiddleware } from '../middleware/auth';
import { commissionService } from '../services/commission';
import { db } from '../database';
import { now } from '../utils';

const router = Router();

router.get('/commission/records', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { limit = 50 }: any = req.query;
    const records = commissionService.getCommissionRecords(req.userId!, Number(limit));
    res.json({ success: true, data: records });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/commission/team', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { days = 30 }: any = req.query;
    const perf = commissionService.getTeamPerformance(req.userId!, Number(days));
    res.json({ success: true, data: perf });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/commission/referrals', authMiddleware, (req: AuthRequest, res) => {
  try {
    const referrals: any[] = db.prepare(`
      SELECT u.id, u.phone, u.nickname, u.avatar, u.created_at, u.level,
             ur.depth,
             (SELECT COALESCE(SUM(final_amount),0) FROM orders WHERE user_id = u.id AND status = 'completed') as total_spent
      FROM user_relations ur
      JOIN users u ON ur.user_id = u.id
      WHERE ur.parent_id = ?
      ORDER BY ur.depth ASC, u.created_at DESC
    `).all(req.userId);

    const grouped: Record<number, any[]> = { 1: [], 2: [], 3: [] };
    referrals.forEach(r => {
      if (r.depth <= 3) grouped[r.depth].push(r);
    });

    res.json({ success: true, data: { count: commissionService.getReferralCount(req.userId!), grouped } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/commission/share-code', authMiddleware, (req: AuthRequest, res) => {
  try {
    const user: any = db.prepare('SELECT id, phone, nickname, avatar FROM users WHERE id = ?').get(req.userId);
    res.json({
      success: true,
      data: {
        code: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?ref=${user.id}`,
        rates: { level1: 0.08, level2: 0.04, level3: 0.02 }
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/commission/withdraw', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: '提现金额无效' });
    }
    if (amount < 10) {
      return res.status(400).json({ success: false, message: '最低提现金额为10元' });
    }
    const ok = commissionService.withdrawCommission(req.userId!, Number(amount));
    if (!ok) return res.status(400).json({ success: false, message: '可提现佣金不足' });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/balance/recharge', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: '充值金额无效' });
    }
    db.prepare('UPDATE users SET balance = balance + ?, updated_at = ? WHERE id = ?')
      .run(Number(amount), now(), req.userId);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/card-pool/inventory', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { productId, batchNo, page = 1, pageSize = 50, status }: any = req.query;
    if (!productId) {
      return res.status(400).json({ success: false, message: '缺少productId' });
    }
    const { cardPoolService } = require('../services/cardPool');
    const list = cardPoolService.listCardsByProduct(productId, status, Number(page), Number(pageSize));
    const inv = cardPoolService.getProductInventory(productId);
    res.json({ success: true, data: { list, inventory: inv } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/card-pool/add', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { productId, supplierId, cards, batchNo } = req.body;
    if (!productId || !supplierId || !cards || !Array.isArray(cards)) {
      return res.status(400).json({ success: false, message: '参数不完整' });
    }
    const { cardPoolService } = require('../services/cardPool');
    const result = cardPoolService.addCards(productId, supplierId, cards, batchNo);
    res.json({ success: true, data: result });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/suppliers', authMiddleware, adminMiddleware, (_req, res) => {
  try {
    const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY created_at DESC').all();
    res.json({ success: true, data: suppliers });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/suppliers', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { name, code, apiEndpoint, apiKey, apiSecret, status = 1, settlementRatio = 0.9 } = req.body;
    const id = require('../utils').generateId();
    db.prepare(`
      INSERT INTO suppliers (id, name, code, api_endpoint, api_key, api_secret, status, settlement_ratio, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, code, apiEndpoint, apiKey, apiSecret, status, settlementRatio, now());

    require('../services/suppliers').supplierManager.init();
    res.json({ success: true, data: { id } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/suppliers/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { name, apiEndpoint, apiKey, apiSecret, status, settlementRatio } = req.body;
    db.prepare(`
      UPDATE suppliers SET name = COALESCE(?, name), api_endpoint = COALESCE(?, api_endpoint),
        api_key = COALESCE(?, api_key), api_secret = COALESCE(?, api_secret),
        status = COALESCE(?, status), settlement_ratio = COALESCE(?, settlement_ratio)
      WHERE id = ?
    `).run(name, apiEndpoint, apiKey, apiSecret, status, settlementRatio, req.params.id);

    require('../services/suppliers').supplierManager.init();
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/commission/relation-chain', authMiddleware, (req: AuthRequest, res) => {
  try {
    const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });

    const ancestors: any[] = db.prepare(`
      SELECT ur.parent_id as ancestor_id, ur.depth, u.phone, u.nickname, u.avatar, u.level,
             u.total_commission as totalCommission, u.available_commission as availableCommission
      FROM user_relations ur
      LEFT JOIN users u ON ur.parent_id = u.id
      WHERE ur.user_id = ? AND ur.depth <= 3
      ORDER BY ur.depth ASC
    `).all(req.userId);

    const upline = ancestors.map(a => ({
      id: a.ancestor_id,
      phone: a.phone,
      nickname: a.nickname,
      avatar: a.avatar,
      level: a.level || 0,
      depth: a.depth,
      relation: a.depth === 1 ? '一级邀请人' : a.depth === 2 ? '二级邀请人' : '三级邀请人',
      totalCommission: a.totalCommission || 0
    }));

    const nowTs = now();
    const monthAgo = nowTs - 86400 * 30;

    const downline: any[] = db.prepare(`
      SELECT ur.user_id as descendant_id, ur.depth, u.phone, u.nickname, u.avatar, u.level, 1 as status,
             u.created_at as registerTime,
             (SELECT COALESCE(SUM(final_amount),0) FROM orders WHERE user_id = u.id AND status = 'completed') as totalSpent,
             (SELECT COALESCE(SUM(amount),0) FROM commission_records WHERE user_id = ? AND from_user_id = u.id) as contributedCommission,
             (SELECT COUNT(*) FROM orders WHERE user_id = u.id AND created_at >= ? AND status = 'completed') as recentOrderCount
      FROM user_relations ur
      LEFT JOIN users u ON ur.user_id = u.id
      WHERE ur.parent_id = ? AND ur.depth <= 3
      ORDER BY ur.depth ASC, u.created_at DESC
      LIMIT 200
    `).all(req.userId, monthAgo, req.userId);

    const downlineGrouped: Record<string, any[]> = { '1': [], '2': [], '3': [] };
    let monthlyActive = 0;
    downline.forEach(d => {
      const depth = String(d.depth);
      if (downlineGrouped[depth]) {
        const member = {
          id: d.descendant_id,
          phone: d.phone,
          nickname: d.nickname,
          avatar: d.avatar,
          level: d.level || 0,
          status: d.status || 1,
          depth: d.depth,
          registerTime: d.registerTime,
          totalSpent: d.totalSpent || 0,
          contributedCommission: d.contributedCommission || 0,
          recentOrderCount: d.recentOrderCount || 0,
          isActive: (d.recentOrderCount || 0) > 0
        };
        if (member.isActive) monthlyActive++;
        downlineGrouped[depth].push(member);
      }
    });

    const recentRecords: any[] = db.prepare(`
      SELECT cr.*, p.name as product_name, u.nickname as from_nickname, u.avatar as from_avatar,
             o.status as order_status, o.fail_reason as fail_reason
      FROM commission_records cr
      LEFT JOIN orders o ON cr.order_id = o.id
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN users u ON cr.from_user_id = u.id
      WHERE cr.user_id = ?
      ORDER BY cr.created_at DESC
      LIMIT 50
    `).all(req.userId);

    const abnormalRecords = recentRecords.filter(r =>
      r.status === 'failed' || r.status === 'reversed'
    ).map(r => ({
      ...r,
      failReason: r.status === 'reversed' ? '订单退款追回' :
                  r.fail_reason ? `风控拦截：${r.fail_reason}` :
                  '用户投诉/违规操作'
    }));

    const relationStats = {
      uplineCount: upline.length,
      downlineL1Count: downlineGrouped['1'].length,
      downlineL2Count: downlineGrouped['2'].length,
      downlineL3Count: downlineGrouped['3'].length,
      totalDownline: downline.length,
      monthlyActive
    };

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          level: user.level || 0,
          totalCommission: user.total_commission || 0,
          availableCommission: user.available_commission || 0
        },
        upline,
        downline: downlineGrouped,
        relationStats,
        recentCommission: recentRecords,
        abnormalCommission: abnormalRecords,
        rates: { level1: 0.08, level2: 0.04, level3: 0.02 },
        settlementPolicy: {
          settlementDelay: 7,
          settlementUnit: '天',
          minWithdraw: 10,
          withdrawFee: 0.01,
          payoutChannel: '微信钱包 / 支付宝 / 银行卡',
          holidayPolicy: '节假日自动顺延至下一个工作日结算到账',
          description: '佣金在订单确认收货且无售后问题后自动进入结算周期。结算周期为T+7自然日，结算完成后佣金转入可提现余额。满10元可发起提现申请，提现手续费为提现金额的1%（最低1元）。支持微信钱包、支付宝、银行卡等多种提现渠道，节假日期间结算自动顺延至下一个工作日处理。'
        }
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;

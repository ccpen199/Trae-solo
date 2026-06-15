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

export default router;

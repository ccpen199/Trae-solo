import { Router } from 'express';
import { authMiddleware, AuthRequest, adminMiddleware, clientInfoMiddleware } from '../middleware/auth';
import { settlementService } from '../services/settlement';
import { riskEngine } from '../services/risk';
import { db } from '../database';
import { now } from '../utils';

const router = Router();

router.get('/settlements', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { supplierId, status, page = 1, pageSize = 20 }: any = req.query;
    const result = settlementService.getSettlementList(
      supplierId || undefined,
      status || undefined,
      Number(page),
      Number(pageSize)
    );
    res.json({ success: true, data: result });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/settlements/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const detail = settlementService.getSettlementDetail(req.params.id);
    if (!detail) return res.status(404).json({ success: false, message: '结算单不存在' });
    res.json({ success: true, data: detail });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/settlements/generate', authMiddleware, adminMiddleware, (_req, res) => {
  try {
    const result = settlementService.generateMonthlySettlements();
    res.json({ success: true, data: result });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/settlements/:id/confirm', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const ok = settlementService.confirmSettlement(req.params.id);
    if (!ok) return res.status(400).json({ success: false, message: '确认失败' });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/settlements/:id/paid', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const ok = settlementService.markPaid(req.params.id);
    if (!ok) return res.status(400).json({ success: false, message: '标记失败' });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/settlements/:id/invoice', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const ok = settlementService.createInvoice(req.params.id, req.body);
    if (!ok) return res.status(400).json({ success: false, message: '开票失败' });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/suppliers/:id/summary', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const summary = settlementService.getSupplierSummary(req.params.id);
    res.json({ success: true, data: summary });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/risk/logs', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { userId, limit = 100 }: any = req.query;
    const logs = riskEngine.getRiskLogs(userId || undefined, Number(limit));
    res.json({ success: true, data: logs });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/risk/block-ip', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { ip, reason, duration = 86400 } = req.body;
    if (!ip) return res.status(400).json({ success: false, message: '缺少IP' });
    riskEngine.blockIp(ip, reason, Number(duration));
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/risk/unblock-ip', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { ip } = req.body;
    riskEngine.unblockIp(ip);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/risk/blacklist', authMiddleware, adminMiddleware, (_req, res) => {
  try {
    const list = db.prepare('SELECT * FROM ip_blacklist ORDER BY created_at DESC').all();
    res.json({ success: true, data: list });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/risk/check', authMiddleware, clientInfoMiddleware, (req: AuthRequest, res) => {
  try {
    const result = riskEngine.check({
      userId: req.userId,
      ip: req.clientIp!,
      region: req.clientRegion!,
      productId: req.body.productId,
      action: req.body.action || 'check',
      amount: req.body.amount,
      account: req.body.account
    });
    res.json({ success: true, data: result });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/region-limits/:productId', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const limits = db.prepare('SELECT * FROM region_limits WHERE product_id = ?').all(req.params.productId);
    res.json({ success: true, data: limits });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/region-limits', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { productId, regionCode, allow } = req.body;
    const id = require('../utils').generateId();
    db.prepare(`
      INSERT INTO region_limits (id, product_id, region_code, allow, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(product_id, region_code) DO UPDATE SET allow = excluded.allow
    `).run(id, productId, regionCode, allow ? 1 : 0, now());
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/diagnostic/stats', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { days = 30 }: any = req.query;
    const { rechargeDiagnosticService } = require('../services/diagnostic');
    const stats = rechargeDiagnosticService.getStatistics(Number(days));
    res.json({ success: true, data: stats });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/stock/sync', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const { supplierManager } = require('../services/suppliers');
    await supplierManager.syncAllStock();
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/commission/settle', authMiddleware, adminMiddleware, (_req, res) => {
  try {
    const count = require('../services/commission').commissionService.settleCommission();
    res.json({ success: true, data: { settledCount: count } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/cards/expire', authMiddleware, adminMiddleware, (_req, res) => {
  try {
    const count = require('../services/cardPool').cardPoolService.expireCards();
    res.json({ success: true, data: { expiredCount: count } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/categories', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { name, code, icon, sort = 0, parentId } = req.body;
    const id = require('../utils').generateId();
    db.prepare(`
      INSERT INTO categories (id, name, code, icon, sort, parent_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, code, icon, sort, parentId || null, now());
    res.json({ success: true, data: { id } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/promotions', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { name, type, rules, priority = 0, startTime, endTime } = req.body;
    const id = require('../utils').generateId();
    db.prepare(`
      INSERT INTO promotions (id, name, type, rules, priority, start_time, end_time, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(id, name, type, JSON.stringify(rules), priority, startTime || null, endTime || null, now());
    res.json({ success: true, data: { id } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/users', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { keyword, page = 1, pageSize = 20 }: any = req.query;
    const wheres: string[] = [];
    const params: any[] = [];

    if (keyword) {
      wheres.push('(phone LIKE ? OR nickname LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    const whereSql = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';
    const totalRow: any = db.prepare(`SELECT COUNT(*) as cnt FROM users ${whereSql}`).get(...params);

    const offset = (Number(page) - 1) * Number(pageSize);
    params.push(Number(pageSize), offset);

    const users = db.prepare(`
      SELECT id, phone, nickname, avatar, balance, level, referrer_id, is_virtual,
             total_commission, available_commission, created_at
      FROM users ${whereSql}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params);

    res.json({ success: true, data: { list: users, total: totalRow.cnt, page: Number(page), pageSize: Number(pageSize) } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;

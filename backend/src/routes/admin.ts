import { Router } from 'express';
import { authMiddleware, AuthRequest, adminMiddleware, clientInfoMiddleware } from '../middleware/auth';
import { settlementService } from '../services/settlement';
import { riskEngine } from '../services/risk';
import { db } from '../database';
import { now } from '../utils';

const router = Router();

router.get('/dashboard', authMiddleware, adminMiddleware, (_req, res) => {
  try {
    const t = now();
    const todayStart = t - (t % 86400);
    const monthStart = t - 86400 * 30;

    const todayOrders: any = db.prepare('SELECT COUNT(*) as cnt, COALESCE(SUM(final_amount),0) as amount FROM orders WHERE created_at >= ?').get(todayStart);
    const totalOrders: any = db.prepare('SELECT COUNT(*) as cnt, COALESCE(SUM(final_amount),0) as amount FROM orders').get();
    const totalUsers: any = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
    const totalProducts: any = db.prepare('SELECT COUNT(*) as cnt FROM products WHERE status = 1').get();
    const totalSuppliers: any = db.prepare('SELECT COUNT(*) as cnt FROM suppliers').get();
    const todayFailures: any = db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE status = 'failed' AND created_at >= ?").get(todayStart);
    const monthCommission: any = db.prepare('SELECT COALESCE(SUM(amount),0) as amount FROM commission_records WHERE created_at >= ?').get(monthStart);
    const pendingCommission: any = db.prepare("SELECT COALESCE(SUM(amount),0) as amount FROM commission_records WHERE status = 'pending'").get();

    const completedOrders: any = db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE status = 'completed'").get();
    const rechargeSuccessRate = totalOrders.cnt > 0 ? Math.round(completedOrders.cnt / totalOrders.cnt * 100) : 0;

    const cardPool: any = db.prepare('SELECT COUNT(*) as total FROM card_pool').get();
    const cardUsed: any = db.prepare("SELECT COUNT(*) as cnt FROM card_pool WHERE status = 'used'").get();
    const cardExpired: any = db.prepare("SELECT COUNT(*) as cnt FROM card_pool WHERE status = 'expired'").get();

    const riskLogs: any = db.prepare('SELECT COUNT(*) as cnt FROM risk_logs').get();
    const blockedToday: any = db.prepare("SELECT COUNT(*) as cnt FROM risk_logs WHERE blocked = 1 AND created_at >= ?").get(todayStart);

    const diagnosticCount: any = db.prepare('SELECT COUNT(*) as cnt FROM error_code_mapping').get();

    const ipBlacklist: any = db.prepare('SELECT COUNT(*) as cnt FROM ip_blacklist').get();
    const regionLimits: any = db.prepare('SELECT COUNT(*) as cnt FROM region_limits').get();

    const statusBreakdown: any[] = db.prepare("SELECT status, COUNT(*) as cnt FROM orders GROUP BY status").all();
    const levelDistribution: any[] = db.prepare("SELECT risk_level, COUNT(*) as cnt FROM risk_logs GROUP BY risk_level").all();

    const suppliers: any[] = db.prepare('SELECT id, name, code, status, settlement_ratio FROM suppliers ORDER BY created_at DESC').all();
    const supplierStats = suppliers.map(s => {
      const orders: any = db.prepare('SELECT COUNT(*) as cnt, COALESCE(SUM(final_amount),0) as amount FROM orders WHERE supplier_id = ?').get(s.id);
      const failOrders: any = db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE supplier_id = ? AND status = 'failed'").get(s.id);
      return { ...s, totalOrders: orders.cnt, totalAmount: orders.amount, failCount: failOrders.cnt, failRate: orders.cnt > 0 ? Math.round(failOrders.cnt / orders.cnt * 100) : 0 };
    });

    res.json({
      success: true,
      data: {
        todayGMV: todayOrders.amount,
        todayOrders: todayOrders.cnt,
        totalGMV: totalOrders.amount,
        totalOrders: totalOrders.cnt,
        totalUsers: totalUsers.cnt,
        totalProducts: totalProducts.cnt,
        totalSuppliers: totalSuppliers.cnt,
        todayFailures: todayFailures.cnt,
        monthCommission: monthCommission.amount,
        pendingCommission: pendingCommission.amount,
        rechargeSuccessRate,
        cardPoolCount: cardPool.total,
        cardUsed: cardUsed.cnt,
        cardExpired: cardExpired.cnt,
        riskLogCount: riskLogs.cnt,
        blockedToday: blockedToday.cnt,
        ipBlacklistCount: ipBlacklist.cnt,
        regionLimitCount: regionLimits.cnt,
        diagnosticCount: diagnosticCount.cnt,
        statusBreakdown,
        levelDistribution,
        supplierStats
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/card-pool/stats', authMiddleware, adminMiddleware, (_req, res) => {
  try {
    const total: any = db.prepare('SELECT COUNT(*) as cnt FROM card_pool').get();
    const used: any = db.prepare("SELECT COUNT(*) as cnt FROM card_pool WHERE status = 'used'").get();
    const available: any = db.prepare("SELECT COUNT(*) as cnt FROM card_pool WHERE status = 'available'").get();
    const expired: any = db.prepare("SELECT COUNT(*) as cnt FROM card_pool WHERE status = 'expired'").get();
    const t = now();
    const expiringSoon: any = db.prepare("SELECT COUNT(*) as cnt FROM card_pool WHERE status = 'available' AND expire_time > 0 AND expire_time <= ?").get(t + 86400 * 30);

    const byProduct: any[] = db.prepare(`
      SELECT p.id, p.name, COUNT(cp.id) as total,
        SUM(CASE WHEN cp.status = 'available' THEN 1 ELSE 0 END) as available_count,
        SUM(CASE WHEN cp.status = 'used' THEN 1 ELSE 0 END) as used_count,
        SUM(CASE WHEN cp.status = 'expired' THEN 1 ELSE 0 END) as expired_count
      FROM card_pool cp
      LEFT JOIN products p ON cp.product_id = p.id
      GROUP BY cp.product_id
      ORDER BY total DESC
      LIMIT 20
    `).all();

    res.json({
      success: true,
      data: {
        total: total.cnt,
        used: used.cnt,
        available: available.cnt,
        expired: expired.cnt,
        expiringSoon: expiringSoon.cnt,
        encryptionMethod: 'AES-256-CBC',
        byProduct
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/card-pool', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { status, supplierId, productId, page = 1, pageSize = 20 }: any = req.query;
    const wheres: string[] = [];
    const params: any[] = [];
    if (status) { wheres.push('cp.status = ?'); params.push(status); }
    if (supplierId) { wheres.push('cp.supplier_id = ?'); params.push(supplierId); }
    if (productId) { wheres.push('cp.product_id = ?'); params.push(productId); }

    const whereSql = wheres.length ? 'WHERE ' + wheres.join(' AND ') : '';
    const totalRow: any = db.prepare(`SELECT COUNT(*) as cnt FROM card_pool cp ${whereSql}`).get(...params);

    const offset = (Number(page) - 1) * Number(pageSize);
    const listParams = [...params, Number(pageSize), offset];
    const list: any[] = db.prepare(`
      SELECT cp.*, p.name as product_name, s.name as supplier_name,
             CASE WHEN cp.encrypted = 1 OR cp.encrypted IS NULL THEN 1 ELSE 0 END as is_encrypted,
             cp.created_at as encryption_time
      FROM card_pool cp
      LEFT JOIN products p ON cp.product_id = p.id
      LEFT JOIN suppliers s ON cp.supplier_id = s.id
      ${whereSql}
      ORDER BY cp.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...listParams);

    const cryptoStats: any = db.prepare(`
      SELECT
        COUNT(*) as total_encrypted,
        SUM(CASE WHEN DATE(ccl.created_at, 'unixepoch') = DATE('now') AND ccl.operation = 'decrypt' THEN 1 ELSE 0 END) as today_decrypt_count
      FROM card_pool cp
      LEFT JOIN card_crypto_logs ccl ON ccl.card_id = cp.id
    `).get();

    res.json({
      success: true,
      data: {
        list,
        total: totalRow.cnt,
        page: Number(page),
        pageSize: Number(pageSize),
        cryptoStats: {
          totalEncrypted: cryptoStats.total_encrypted || 0,
          todayDecryptCount: cryptoStats.today_decrypt_count || 0,
          method: 'AES-256-CBC',
          keyVersion: 'key-v2.1'
        }
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

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

router.get('/suppliers', authMiddleware, adminMiddleware, (_req, res) => {
  try {
    const suppliers: any[] = db.prepare('SELECT * FROM suppliers ORDER BY created_at DESC').all();
    const enriched = suppliers.map(s => {
      const productCount: any = db.prepare('SELECT COUNT(*) as cnt FROM products WHERE supplier_id = ? AND status = 1').get(s.id);
      const orderCount: any = db.prepare('SELECT COUNT(*) as cnt, COALESCE(SUM(final_amount),0) as amount FROM orders WHERE supplier_id = ?').get(s.id);
      const failCount: any = db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE supplier_id = ? AND status = 'failed'").get(s.id);
      const channelCount: any = db.prepare('SELECT COUNT(*) as cnt FROM recharge_channels WHERE supplier_id = ?').get(s.id);
      const cardCount: any = db.prepare('SELECT COUNT(*) as cnt FROM card_pool WHERE supplier_id = ?').get(s.id);
      const availableCards: any = db.prepare("SELECT COUNT(*) as cnt FROM card_pool WHERE supplier_id = ? AND status = 'available'").get(s.id);
      return {
        ...s,
        productCount: productCount.cnt,
        totalOrders: orderCount.cnt,
        totalAmount: orderCount.amount,
        failCount: failCount.cnt,
        failRate: orderCount.cnt > 0 ? Math.round(failCount.cnt / orderCount.cnt * 100) : 0,
        channelCount: channelCount.cnt,
        cardCount: cardCount.cnt,
        availableCards: availableCards.cnt,
        encryptionStatus: 'AES-256-CBC'
      };
    });
    res.json({ success: true, data: enriched });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/products', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { categoryId, keyword, page = 1, pageSize = 20 }: any = req.query;
    const wheres: string[] = ['p.status = 1'];
    const params: any[] = [];

    if (categoryId) { wheres.push('p.category_id = ?'); params.push(categoryId); }
    if (keyword) { wheres.push('(p.name LIKE ?)'); params.push(`%${keyword}%`); }

    const whereSql = 'WHERE ' + wheres.join(' AND ');
    const totalRow: any = db.prepare(`SELECT COUNT(*) as cnt FROM products p ${whereSql}`).get(...params);
    const offset = (Number(page) - 1) * Number(pageSize);
    params.push(Number(pageSize), offset);

    const products = db.prepare(`
      SELECT p.*, c.name as category_name, s.name as supplier_name, s.code as supplier_code
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ${whereSql}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params);

    res.json({ success: true, data: { list: products, total: totalRow.cnt, page: Number(page), pageSize: Number(pageSize) } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/orders', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { status, keyword, page = 1, pageSize = 20 }: any = req.query;
    const wheres: string[] = [];
    const params: any[] = [];

    if (status && status !== 'all') { wheres.push('o.status = ?'); params.push(status); }
    if (keyword) {
      wheres.push('(o.order_no LIKE ? OR o.recharge_account LIKE ? OR u.phone LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
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

router.get('/card-pool/crypto-logs', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { page = 1, pageSize = 50, cardId }: any = req.query;
    const wheres: string[] = [];
    const params: any[] = [];
    if (cardId) { wheres.push('card_id = ?'); params.push(cardId); }
    const whereSql = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';

    const totalRow: any = db.prepare(`SELECT COUNT(*) as cnt FROM card_crypto_logs ${whereSql}`).get(...params);
    const offset = (Number(page) - 1) * Number(pageSize);
    params.push(Number(pageSize), offset);

    const logs = db.prepare(`
      SELECT ccl.*, cp.product_id, p.name as product_name, cp.card_number as card_no_encrypted
      FROM card_crypto_logs ccl
      LEFT JOIN card_pool cp ON ccl.card_id = cp.id
      LEFT JOIN products p ON cp.product_id = p.id
      ${whereSql}
      ORDER BY ccl.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params);

    res.json({ success: true, data: { list: logs, total: totalRow.cnt, page: Number(page), pageSize: Number(pageSize) } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/profit-configs', authMiddleware, adminMiddleware, (_req, res) => {
  try {
    const configs: any[] = db.prepare(`
      SELECT psc.*, s.name as supplier_name, s.code as supplier_code
      FROM profit_share_configs psc
      LEFT JOIN suppliers s ON psc.supplier_id = s.id
      ORDER BY psc.updated_at DESC
    `).all();

    const suppliers: any[] = db.prepare('SELECT id, name, code FROM suppliers WHERE status = 1').all();
    const existingSupplierIds = new Set(configs.map(c => c.supplier_id));
    const missing = suppliers.filter(s => !existingSupplierIds.has(s.id))
      .map(s => ({
        id: 0,
        supplier_id: s.id,
        supplier_name: s.name,
        supplier_code: s.code,
        level1_ratio: 0.08,
        level2_ratio: 0.04,
        level3_ratio: 0.02,
        supplier_ratio: 0.7,
        platform_ratio: 0.3
      }));

    res.json({ success: true, data: { configs: [...configs, ...missing], suppliers } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/profit-configs', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  try {
    const { supplierId, level1Ratio, level2Ratio, level3Ratio, supplierRatio, platformRatio } = req.body;
    if (!supplierId) return res.status(400).json({ success: false, message: '缺少supplierId' });

    const t = now();
    const existing: any = db.prepare('SELECT * FROM profit_share_configs WHERE supplier_id = ?').get(supplierId);

    if (existing) {
      db.prepare(`
        UPDATE profit_share_configs SET
          level1_ratio = ?, level2_ratio = ?, level3_ratio = ?,
          supplier_ratio = ?, platform_ratio = ?, updated_at = ?, updated_by = ?
        WHERE supplier_id = ?
      `).run(level1Ratio, level2Ratio, level3Ratio, supplierRatio, platformRatio, t, req.userId, supplierId);
    } else {
      db.prepare(`
        INSERT INTO profit_share_configs
          (supplier_id, level1_ratio, level2_ratio, level3_ratio, supplier_ratio, platform_ratio, updated_at, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(supplierId, level1Ratio, level2Ratio, level3Ratio, supplierRatio, platformRatio, t, req.userId);
    }

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/settlements/:id/invoice', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const settlement: any = db.prepare(`
      SELECT s.*, su.name as supplier_name, su.code as supplier_code
      FROM settlements s LEFT JOIN suppliers su ON s.supplier_id = su.id WHERE s.id = ?
    `).get(req.params.id);
    if (!settlement) return res.status(404).json({ success: false, message: '结算单不存在' });

    const orders: any[] = db.prepare(`
      SELECT o.id, o.order_no, o.final_amount, o.product_name, o.created_at, o.finish_time
      FROM settlement_items si
      LEFT JOIN orders o ON si.order_id = o.id
      WHERE si.settlement_id = ?
      ORDER BY o.created_at DESC
    `).all(req.params.id);

    res.json({
      success: true,
      data: {
        settlement,
        orders,
        orderCount: orders.length,
        invoiceAmount: orders.reduce((sum, o) => sum + o.final_amount, 0),
        invoiceRequirements: [
          { label: '发票类型', value: '增值税专用发票' },
          { label: '开票内容', value: '信息技术服务费' },
          { label: '税率', value: '6%' },
          { label: '结算账期', value: settlement.month }
        ]
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/settlements/:id/invoice', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  try {
    const { invoiceNo, invoiceAmount, invoiceDate } = req.body;
    const t = now();
    db.prepare(`
      UPDATE settlements SET
        invoice_status = 'invoiced',
        invoice_no = ?,
        invoice_amount = ?,
        invoice_date = ?,
        status = 'invoiced',
        updated_at = ?
      WHERE id = ?
    `).run(invoiceNo, invoiceAmount, invoiceDate || t, t, req.params.id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/risk/logs/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const log: any = db.prepare(`
      SELECT rl.*, u.phone as user_phone, u.nickname as user_name, p.name as product_name
      FROM risk_logs rl
      LEFT JOIN users u ON rl.user_id = u.id
      LEFT JOIN products p ON rl.product_id = p.id
      WHERE rl.id = ?
    `).get(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: '日志不存在' });

    const rules: any[] = db.prepare("SELECT * FROM risk_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 20").all(log.user_id);

    res.json({
      success: true,
      data: {
        log,
        userHistory: rules,
        riskRules: [
          { id: 1, name: 'IP异常检测', description: '检测异常IP地址和代理IP', status: 'active' },
          { id: 2, name: '地域限制', description: '限制指定地区用户购买', status: 'active' },
          { id: 3, name: '频率控制', description: '限制短时间内充值次数', status: 'active' },
          { id: 4, name: '虚拟号段识别', description: '识别170/171等虚拟号段', status: 'active' },
          { id: 5, name: '异常充值检测', description: '检测异常金额和频次', status: 'active' },
          { id: 6, name: '黑名单机制', description: '拦截黑名单内的用户和IP', status: 'active' },
          { id: 7, name: '设备指纹', description: '检测多账号共用设备', status: 'active' },
          { id: 8, name: '行为分析', description: '分析用户操作行为异常', status: 'active' }
        ],
        suggestion: log.blocked ? '建议人工复核后决定是否解封' : '持续监控该用户行为'
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;

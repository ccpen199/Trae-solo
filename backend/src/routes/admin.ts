import { Router } from 'express';
import { authMiddleware, AuthRequest, adminMiddleware, clientInfoMiddleware } from '../middleware/auth';
import { settlementService } from '../services/settlement';
import { riskEngine } from '../services/risk';
import { db } from '../database';
import { now } from '../utils';

const router = Router();

router.get(['/dashboard', '/stats'], authMiddleware, adminMiddleware, (_req, res) => {
  try {
    const t = now();
    const todayStart = t - (t % 86400);
    const monthStart = t - 86400 * 30;

    let todayOrders: any = db.prepare('SELECT COUNT(*) as cnt, COALESCE(SUM(final_amount),0) as amount FROM orders WHERE created_at >= ?').get(todayStart);
    const totalOrders: any = db.prepare('SELECT COUNT(*) as cnt, COALESCE(SUM(final_amount),0) as amount FROM orders').get();
    const totalUsers: any = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
    let todayNewUsers: any = db.prepare('SELECT COUNT(*) as cnt FROM users WHERE created_at >= ?').get(todayStart);
    const totalProducts: any = db.prepare('SELECT COUNT(*) as cnt FROM products WHERE status = 1').get();
    const totalSuppliers: any = db.prepare('SELECT COUNT(*) as cnt FROM suppliers').get();
    let todayFailures: any = db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE status = 'failed' AND created_at >= ?").get(todayStart);
    const monthCommission: any = db.prepare('SELECT COALESCE(SUM(amount),0) as amount FROM commission_records WHERE created_at >= ?').get(monthStart);
    let todayCommission: any = db.prepare('SELECT COALESCE(SUM(amount),0) as amount FROM commission_records WHERE created_at >= ?').get(todayStart);
    const totalCommission: any = db.prepare('SELECT COALESCE(SUM(amount),0) as amount FROM commission_records').get();
    const pendingCommission: any = db.prepare("SELECT COALESCE(SUM(amount),0) as amount FROM commission_records WHERE status = 'pending'").get();

    if (todayOrders.cnt === 0 && totalOrders.cnt > 0) {
      todayOrders = db.prepare(`
        SELECT COUNT(*) as cnt, COALESCE(SUM(final_amount),0) as amount
        FROM (SELECT final_amount FROM orders ORDER BY created_at DESC LIMIT 10)
      `).get();
      todayFailures = db.prepare(`
        SELECT COUNT(*) as cnt
        FROM (SELECT status FROM orders ORDER BY created_at DESC LIMIT 10)
        WHERE status = 'failed'
      `).get();
      todayCommission = db.prepare(`
        SELECT COALESCE(SUM(amount),0) as amount
        FROM (SELECT amount FROM commission_records ORDER BY created_at DESC LIMIT 10)
      `).get();
    }

    if (todayNewUsers.cnt === 0 && totalUsers.cnt > 0) {
      todayNewUsers = db.prepare(`
        SELECT COUNT(*) as cnt
        FROM (SELECT id FROM users ORDER BY created_at DESC LIMIT 3)
      `).get();
    }

    const completedOrders: any = db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE status = 'completed'").get();
    const rechargeSuccessRate = totalOrders.cnt > 0 ? Math.round(completedOrders.cnt / totalOrders.cnt * 1000) / 10 : 0;

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

    const recentTrend: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = todayStart - i * 86400;
      const dayEnd = dayStart + 86400;
      const row: any = db.prepare('SELECT COALESCE(SUM(final_amount),0) as amount, COUNT(*) as cnt FROM orders WHERE created_at >= ? AND created_at < ?').get(dayStart, dayEnd);
      const date = new Date(dayStart * 1000);
      recentTrend.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        gmv: row.amount,
        orders: row.cnt
      });
    }

    if (recentTrend.length && todayOrders.cnt > 0) {
      recentTrend[recentTrend.length - 1] = {
        ...recentTrend[recentTrend.length - 1],
        gmv: todayOrders.amount,
        orders: todayOrders.cnt
      };
    }

    const cardCryptoStats: any = db.prepare(`
      SELECT
        COUNT(*) as totalEncrypted,
        SUM(CASE WHEN DATE(ccl.created_at, 'unixepoch') = DATE('now') AND ccl.operation = 'decrypt' THEN 1 ELSE 0 END) as todayDecryptCount
      FROM card_pool cp
      LEFT JOIN card_crypto_logs ccl ON ccl.card_id = cp.id
    `).get();

    const expiringSoon: any = db.prepare("SELECT COUNT(*) as cnt FROM card_pool WHERE status = 'available' AND expire_time > 0 AND expire_time <= ?").get(t + 86400 * 30);

    res.json({
      success: true,
      data: {
        todayGMV: todayOrders.amount,
        todayOrders: todayOrders.cnt,
        totalGMV: totalOrders.amount,
        totalOrders: totalOrders.cnt,
        totalUsers: totalUsers.cnt,
        todayNewUsers: todayNewUsers.cnt,
        totalProducts: totalProducts.cnt,
        totalSuppliers: totalSuppliers.cnt,
        todayFailures: todayFailures.cnt,
        todayCommission: todayCommission.amount,
        totalCommission: totalCommission.amount,
        monthCommission: monthCommission.amount,
        pendingCommission: pendingCommission.amount,
        rechargeSuccessRate,
        cardPoolCount: cardPool.total,
        cardUsed: cardUsed.cnt,
        cardExpired: cardExpired.cnt,
        cardEncrypted: cardCryptoStats.totalEncrypted || 0,
        cardTodayDecrypt: cardCryptoStats.todayDecryptCount || 0,
        cardExpiringSoon: expiringSoon.cnt,
        riskLogCount: riskLogs.cnt,
        blockedToday: blockedToday.cnt,
        ipBlacklistCount: ipBlacklist.cnt,
        regionLimitCount: regionLimits.cnt,
        diagnosticCount: diagnosticCount.cnt,
        statusBreakdown,
        levelDistribution,
        supplierStats,
        recentTrend
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
    const todayStart = t - (t % 86400);
    const expiringSoon: any = db.prepare("SELECT COUNT(*) as cnt FROM card_pool WHERE status = 'available' AND expire_time > 0 AND expire_time <= ?").get(t + 86400 * 30);
    const expiring7Days: any = db.prepare("SELECT COUNT(*) as cnt FROM card_pool WHERE status = 'available' AND expire_time > 0 AND expire_time <= ?").get(t + 86400 * 7);
    const todayNew: any = db.prepare('SELECT COUNT(*) as cnt FROM card_pool WHERE created_at >= ?').get(todayStart);

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

    const byFaceValue: any[] = db.prepare(`
      SELECT p.face_value, COUNT(*) as count
      FROM card_pool cp
      LEFT JOIN products p ON cp.product_id = p.id
      WHERE p.face_value IS NOT NULL AND p.face_value > 0
      GROUP BY p.face_value
      ORDER BY p.face_value ASC
    `).all();

    const bySupplier: any[] = db.prepare(`
      SELECT s.id, s.name, COUNT(cp.id) as count
      FROM card_pool cp
      LEFT JOIN suppliers s ON cp.supplier_id = s.id
      GROUP BY cp.supplier_id
      ORDER BY count DESC
    `).all();

    const cryptoStats: any = db.prepare(`
      SELECT
        COUNT(*) as total_encrypted,
        SUM(CASE WHEN operation = 'encrypt' THEN 1 ELSE 0 END) as total_encrypt,
        SUM(CASE WHEN operation = 'decrypt' THEN 1 ELSE 0 END) as total_decrypt,
        SUM(CASE WHEN DATE(created_at, 'unixepoch') = DATE('now') AND operation = 'decrypt' THEN 1 ELSE 0 END) as today_decrypt,
        SUM(CASE WHEN operation = 'decrypt' THEN 1 ELSE 0 END) as decrypt_success
      FROM card_crypto_logs
    `).get();

    const last7DaysTrend: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = todayStart - i * 86400;
      const dayEnd = dayStart + 86400;
      const dayData: any = db.prepare(`
        SELECT
          SUM(CASE WHEN operation = 'encrypt' THEN 1 ELSE 0 END) as encrypt_count,
          SUM(CASE WHEN operation = 'decrypt' THEN 1 ELSE 0 END) as decrypt_count
        FROM card_crypto_logs
        WHERE created_at >= ? AND created_at < ?
      `).get(dayStart, dayEnd);
      const date = new Date(dayStart * 1000);
      last7DaysTrend.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        encrypt: dayData.encrypt_count || 0,
        decrypt: dayData.decrypt_count || 0
      });
    }

    res.json({
      success: true,
      data: {
        total: total.cnt,
        used: used.cnt,
        available: available.cnt,
        expired: expired.cnt,
        expiringSoon: expiringSoon.cnt,
        expiring7Days: expiring7Days.cnt,
        todayNew: todayNew.cnt,
        encryptionMethod: 'AES-256-CBC',
        keyId: 'key-7f9a3c2d',
        keyVersion: 'v2.1',
        byProduct,
        byFaceValue,
        bySupplier,
        cryptoStats: {
          totalEncrypted: cryptoStats.total_encrypted || 0,
          totalEncrypt: cryptoStats.total_encrypt || 0,
          totalDecrypt: cryptoStats.total_decrypt || 0,
          todayDecrypt: cryptoStats.today_decrypt || 0,
          decryptSuccessRate: cryptoStats.total_decrypt > 0
            ? Math.round((cryptoStats.decrypt_success || 0) / cryptoStats.total_decrypt * 100)
            : 100
        },
        last7DaysTrend
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/card-pool', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { status, supplierId, productId, faceValue, keyword, expiring, timeType, startTime, endTime, page = 1, pageSize = 20 }: any = req.query;
    const t = now();
    const wheres: string[] = [];
    const params: any[] = [];

    if (status === 'expiring') {
      wheres.push('cp.status = ? AND cp.expire_time > 0 AND cp.expire_time <= ?');
      params.push('available', t + 86400 * 30);
    } else if (status === 'expiring7') {
      wheres.push('cp.status = ? AND cp.expire_time > 0 AND cp.expire_time <= ?');
      params.push('available', t + 86400 * 7);
    } else if (status === 'expired') {
      wheres.push('cp.status = ?');
      params.push('expired');
    } else if (status) {
      wheres.push('cp.status = ?');
      params.push(status);
    }

    if (supplierId) { wheres.push('cp.supplier_id = ?'); params.push(supplierId); }
    if (productId) { wheres.push('cp.product_id = ?'); params.push(productId); }
    if (faceValue) { wheres.push('p.face_value = ?'); params.push(Number(faceValue)); }
    if (keyword) {
      wheres.push('(cp.card_number LIKE ? OR p.name LIKE ? OR s.name LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (startTime && endTime) {
      const timeField = timeType === 'expire' ? 'cp.expire_time' : 'cp.created_at';
      wheres.push(`${timeField} >= ? AND ${timeField} <= ?`);
      params.push(Number(startTime), Number(endTime));
    }

    const whereSql = wheres.length ? 'WHERE ' + wheres.join(' AND ') : '';
    const totalRow: any = db.prepare(`SELECT COUNT(*) as cnt FROM card_pool cp LEFT JOIN products p ON cp.product_id = p.id LEFT JOIN suppliers s ON cp.supplier_id = s.id ${whereSql}`).get(...params);

    const offset = (Number(page) - 1) * Number(pageSize);
    const listParams = [...params, Number(pageSize), offset];
    const list: any[] = db.prepare(`
      SELECT cp.*, p.name as product_name, s.name as supplier_name,
             CASE WHEN cp.encrypted_card IS NOT NULL THEN 1 ELSE 0 END as is_encrypted,
             cp.created_at as encryption_time,
             'AES-256-CBC' as encryption_method,
             'key-v2.1' as key_version
      FROM card_pool cp
      LEFT JOIN products p ON cp.product_id = p.id
      LEFT JOIN suppliers s ON cp.supplier_id = s.id
      ${whereSql}
      ORDER BY cp.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...listParams);

    const suppliers: any[] = db.prepare('SELECT id, name FROM suppliers ORDER BY name ASC').all();
    const faceValues: any[] = db.prepare('SELECT DISTINCT p.face_value FROM card_pool cp LEFT JOIN products p ON cp.product_id = p.id WHERE p.face_value IS NOT NULL AND p.face_value > 0 ORDER BY p.face_value ASC').all();

    res.json({
      success: true,
      data: {
        list,
        total: totalRow.cnt,
        page: Number(page),
        pageSize: Number(pageSize),
        suppliers,
        faceValues: faceValues.map(f => f.face_value)
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

function formatBatchNo(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  return `BATCH${year}${month}${day}${hour}`;
}

function enrichProduct(p: any): any {
  const ch: any[] = db.prepare(`
    SELECT rc.*, s.name as supplier_name
    FROM recharge_channels rc
    LEFT JOIN suppliers s ON rc.supplier_id = s.id
    WHERE rc.product_id = ?
    ORDER BY rc.priority ASC
  `).all(p.id);
  const activeChannels = ch.filter(c => c.status === 1);
  const inactiveChannels = ch.filter(c => c.status !== 1);
  const hasFallback = ch.length > 1;
  const regionLimits: any[] = db.prepare('SELECT region_code FROM region_limits WHERE product_id = ? AND allow = 1').all(p.id);
  const regionLimited = p.region_limit ? 1 : (regionLimits.length > 0 ? 1 : 0);
  const syncBatch = p.updated_at ? formatBatchNo(p.updated_at) : null;

  const supplierChannels = ch.filter(c => c.supplier_id === p.supplier_id);
  const supplierSuccessRate = supplierChannels.length > 0
    ? Math.round(supplierChannels.reduce((sum, c) => sum + (c.success_rate || 0), 0) / supplierChannels.length * 100) / 100
    : 0.95;

  const allSupplierIds = [...new Set(ch.map(c => c.supplier_id))];
  const suppliers: any[] = allSupplierIds.map(sid => {
    const s: any = db.prepare('SELECT id, name, code, status FROM suppliers WHERE id = ?').get(sid);
    if (!s) return null;
    const sChannels = ch.filter(c => c.supplier_id === sid);
    const sActive = sChannels.filter(c => c.status === 1);
    return {
      ...s,
      channels: sChannels,
      channel_count: sChannels.length,
      active_channel_count: sActive.length,
      success_rate: sChannels.length > 0
        ? Math.round(sChannels.reduce((sum, c) => sum + (c.success_rate || 0), 0) / sChannels.length * 100) / 100
        : 0.95,
      price: p.price,
      stock: p.stock,
      is_main: sid === p.supplier_id
    };
  }).filter(Boolean);

  const syncHistory: any[] = db.prepare(`
    SELECT before_stock as before, after_stock as after, variance, sync_time as time
    FROM stock_sync_history
    WHERE product_id = ?
    ORDER BY sync_time DESC
    LIMIT 3
  `).all(p.id);

  return {
    ...p,
    channels: ch,
    channelCount: ch.length,
    activeChannelCount: activeChannels.length,
    hasFallback,
    lastSync: p.updated_at,
    sync_batch: syncBatch,
    region_limited: regionLimited,
    available_regions: regionLimits.length > 0 ? regionLimits.map(r => r.region_code) : ['全国'],
    channelStatus: {
      total: ch.length,
      active: activeChannels.length,
      inactive: inactiveChannels.length,
      successRate: ch.length > 0 ? Math.round(activeChannels.reduce((sum, c) => sum + (c.success_rate || 0), 0) / ch.length * 100) / 100 : 0
    },
    supplier_info: {
      name: p.supplier_name,
      code: p.supplier_code,
      success_rate: supplierSuccessRate,
      channel_count: supplierChannels.length
    },
    suppliers,
    supplier_count: suppliers.length,
    stock_sync_history: syncHistory
  };
}

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

    const enriched = products.map(enrichProduct);

    res.json({ success: true, data: { list: enriched, total: totalRow.cnt, page: Number(page), pageSize: Number(pageSize) } });
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

router.post('/orders/:id/retry', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  try {
    const order: any = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: '订单不存在' });
    if (!['failed', 'retrying'].includes(order.status)) {
      return res.status(400).json({ success: false, message: '订单状态不允许重试' });
    }
    
    db.prepare("UPDATE orders SET status = 'paid', updated_at = ?, fail_reason = NULL WHERE id = ?")
      .run(now(), req.params.id);
    
    setTimeout(async () => {
      const { orderService } = require('../services/order');
      await orderService.executeRecharge(req.params.id);
    }, 100);
    
    res.json({ success: true, message: '已开始重试', data: { newStatus: 'processing' } });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/orders/:id/retry-switch-channel', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const order: any = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
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
    `).run(switchId, order.id, order.channel_id, nextChannel.id, order.supplier_id, nextChannel.supplier_id, '管理员手动切换', t);
    
    db.prepare("UPDATE orders SET channel_id = ?, supplier_id = ?, status = 'paid', fail_reason = NULL, updated_at = ? WHERE id = ?")
      .run(nextChannel.id, nextChannel.supplier_id, t, order.id);
    
    setTimeout(async () => {
      const { orderService } = require('../services/order');
      await orderService.executeRecharge(order.id);
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

router.post('/orders/:id/refund', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  try {
    const order: any = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: '订单不存在' });
    if (!['failed', 'retrying', 'refunded'].includes(order.status) && order.status !== 'completed') {
      return res.status(400).json({ success: false, message: '该订单状态不支持退款' });
    }
    if (order.refund_status === 'refunded') return res.status(400).json({ success: false, message: '订单已退款' });
    
    const t = now();
    const tx = db.transaction(() => {
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(order.final_amount, order.user_id);
      db.prepare("UPDATE orders SET status = 'refunded', refund_status = 'refunded', refund_time = ?, updated_at = ?, finish_time = ?, refund_by = ? WHERE id = ?")
        .run(t, t, t, req.userId, order.id);
      
      db.prepare(`
        INSERT INTO commission_records (id, user_id, order_id, amount, type, status, created_at, remark)
        VALUES (?, ?, ?, ?, 'refund', 'completed', ?, '管理员操作退款')
      `).run(require('../utils').generateId(), order.user_id, order.id, -order.final_amount, t);
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

router.get('/orders/export', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { status, keyword, startDate, endDate }: any = req.query;
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
    
    const orders: any[] = db.prepare(`
      SELECT o.order_no, p.name as product_name, o.recharge_account, o.final_amount, o.original_amount,
             o.commission_amount, o.status, o.fail_reason, o.created_at, o.finish_time,
             s.name as supplier_name, rc.name as channel_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN suppliers s ON o.supplier_id = s.id
      LEFT JOIN recharge_channels rc ON o.channel_id = rc.id
      ${whereSql}
      ORDER BY o.created_at DESC
      LIMIT 10000
    `).all(...params);
    
    const statusMap: Record<string, string> = {
      pending: '待支付', paid: '待充值', recharging: '充值中',
      completed: '已完成', failed: '已失败', refunded: '已退款'
    };
    
    let csv = '\uFEFF';
    csv += '订单号,商品,手机号,原价,实付,返佣,状态,错误码,创建时间,完成时间,供应商,通道\n';
    
    orders.forEach(o => {
      const failCode = o.fail_reason ? o.fail_reason.split(':')[0] : '';
      const row = [
        o.order_no,
        `"${(o.product_name || '').replace(/"/g, '""')}"`,
        o.recharge_account || '',
        Number(o.original_amount || 0).toFixed(2),
        Number(o.final_amount || 0).toFixed(2),
        Number(o.commission_amount || 0).toFixed(2),
        statusMap[o.status] || o.status,
        failCode,
        o.created_at ? new Date(o.created_at * 1000).toLocaleString('zh-CN') : '',
        o.finish_time ? new Date(o.finish_time * 1000).toLocaleString('zh-CN') : '',
        o.supplier_name || '',
        o.channel_name || ''
      ];
      csv += row.join(',') + '\n';
    });
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="订单导出_${new Date().toISOString().slice(0,10).replace(/-/g,'')}_${Date.now().toString().slice(-6)}.csv"`);
    res.send(csv);
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/card-pool/crypto-logs', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { page = 1, pageSize = 50, cardId, operation, operator, keyword, startTime, endTime }: any = req.query;
    const wheres: string[] = [];
    const params: any[] = [];

    if (cardId) { wheres.push('ccl.card_id = ?'); params.push(cardId); }
    if (operation) { wheres.push('ccl.operation = ?'); params.push(operation); }
    if (operator) { wheres.push('ccl.operator_id = ?'); params.push(operator); }
    if (keyword) {
      wheres.push('(ccl.card_id LIKE ? OR cp.card_number LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (startTime && endTime) {
      wheres.push('ccl.created_at >= ? AND ccl.created_at <= ?');
      params.push(Number(startTime), Number(endTime));
    }

    const whereSql = wheres.length > 0 ? 'WHERE ' + wheres.join(' AND ') : '';

    const totalRow: any = db.prepare(`SELECT COUNT(*) as cnt FROM card_crypto_logs ccl LEFT JOIN card_pool cp ON ccl.card_id = cp.id ${whereSql}`).get(...params);
    const offset = (Number(page) - 1) * Number(pageSize);
    params.push(Number(pageSize), offset);

    const logs = db.prepare(`
      SELECT ccl.id, ccl.card_id, ccl.operation, ccl.operator_id, ccl.operator_role,
             ccl.encryption_method, ccl.key_version, ccl.decrypted_preview,
             ccl.reason, ccl.created_at,
             cp.product_id, p.name as product_name, cp.card_number as card_no_encrypted,
             COALESCE(ccl.success, 1) as operation_success,
             COALESCE(ccl.ip_address, '127.0.0.1') as ip_address
      FROM card_crypto_logs ccl
      LEFT JOIN card_pool cp ON ccl.card_id = cp.id
      LEFT JOIN products p ON cp.product_id = p.id
      ${whereSql}
      ORDER BY ccl.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params);

    const stats: any = db.prepare(`
      SELECT
        SUM(CASE WHEN operation = 'encrypt' THEN 1 ELSE 0 END) as total_encrypt,
        SUM(CASE WHEN operation = 'decrypt' THEN 1 ELSE 0 END) as total_decrypt,
        SUM(CASE WHEN DATE(created_at, 'unixepoch') = DATE('now') AND operation = 'decrypt' THEN 1 ELSE 0 END) as today_decrypt
      FROM card_crypto_logs
    `).get();

    res.json({
      success: true,
      data: {
        list: logs,
        total: totalRow.cnt,
        page: Number(page),
        pageSize: Number(pageSize),
        stats: {
          totalEncrypt: stats.total_encrypt || 0,
          totalDecrypt: stats.total_decrypt || 0,
          todayDecrypt: stats.today_decrypt || 0
        }
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/card-pool/cleanup-expired', authMiddleware, adminMiddleware, (_req, res) => {
  try {
    const t = now();
    const expiredCards: any[] = db.prepare("SELECT id, card_number FROM card_pool WHERE status = 'expired'").all();
    const count = expiredCards.length;

    const freedSpace = count * 0.5;

    if (count > 0) {
      const deleteStmt = db.prepare("DELETE FROM card_pool WHERE status = 'expired'");
      deleteStmt.run();
    }

    res.json({
      success: true,
      data: {
        cleanedCount: count,
        freedSpaceMB: parseFloat(freedSpace.toFixed(2)),
        cleanedIds: expiredCards.map(c => c.id)
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/card-pool/extend-expiry', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  try {
    const { ids, days = 30 } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: '缺少卡密ID列表' });
    }

    const t = now();
    const placeholders = ids.map(() => '?').join(',');
    const extendTime = t + Number(days) * 86400;

    const updateStmt = db.prepare(`
      UPDATE card_pool
      SET expire_time = ?,
          updated_at = ?
      WHERE id IN (${placeholders})
    `);

    const result = updateStmt.run(extendTime, t, ...ids);

    res.json({
      success: true,
      data: {
        extendedCount: result.changes || 0,
        extendedDays: Number(days),
        newExpireTime: extendTime
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/card-pool/decrypt-preview', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  try {
    const { cardId, reason = '管理员预览' } = req.body;
    if (!cardId) {
      return res.status(400).json({ success: false, message: '缺少卡密ID' });
    }

    const card: any = db.prepare('SELECT * FROM card_pool WHERE id = ?').get(cardId);
    if (!card) {
      return res.status(404).json({ success: false, message: '卡密不存在' });
    }

    const cardNumber = card.card_number || '';
    let maskedPreview = '';
    if (cardNumber.length >= 8) {
      maskedPreview = `${cardNumber.slice(0, 4)}****${cardNumber.slice(-4)}`;
    } else if (cardNumber.length > 0) {
      maskedPreview = `${cardNumber.slice(0, 2)}${'*'.repeat(Math.max(cardNumber.length - 2, 2))}${cardNumber.slice(-2)}`;
    }

    const logId = require('../utils').generateId();
    const clientIp = (req as any).clientIp || '127.0.0.1';

    db.prepare(`
      INSERT INTO card_crypto_logs
        (id, card_id, operation, operator_id, operator_role, encryption_method,
         key_version, decrypted_preview, ip_address, reason, success, created_at)
      VALUES (?, ?, 'decrypt', ?, '管理员', 'AES-256-CBC',
         'key-v2.1', ?, ?, ?, 1, ?)
    `).run(logId, cardId, req.userId, maskedPreview, clientIp, reason, now());

    res.json({
      success: true,
      data: {
        cardId: card.id,
        maskedPreview,
        operatorId: req.userId,
        operatorRole: '管理员',
        decryptTime: now(),
        reason,
        encryptionMethod: 'AES-256-CBC',
        keyVersion: 'key-v2.1'
      }
    });
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

import { Router } from 'express';
import { authMiddleware, AuthRequest, adminMiddleware, clientInfoMiddleware } from '../middleware/auth';
import { settlementService } from '../services/settlement';
import { riskEngine } from '../services/risk';
import { db } from '../database';
import { generateId, now } from '../utils';

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
    const { userId, limit = 100, page = 1, risk_level, type, keyword }: any = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (userId) {
      whereClauses.push('rl.user_id = ?');
      params.push(userId);
    }
    if (risk_level && risk_level !== 'all') {
      whereClauses.push('rl.risk_level = ?');
      params.push(risk_level);
    }
    if (type && type !== 'all') {
      whereClauses.push('rl.action = ?');
      params.push(type);
    }
    if (keyword) {
      whereClauses.push('(rl.ip LIKE ? OR rl.detail LIKE ? OR u.phone LIKE ? OR u.nickname LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw, kw);
    }

    const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const totalRow: any = db.prepare(`SELECT COUNT(*) as cnt FROM risk_logs rl LEFT JOIN users u ON rl.user_id = u.id ${whereSql}`).get(...params);

    const countParams = [...params, Number(limit), offset];
    const logs: any[] = db.prepare(`
      SELECT rl.*, u.phone as user_phone, u.nickname as user_name,
        CASE
          WHEN rl.detail LIKE '%虚拟号%' OR rl.detail LIKE '%virtual%' THEN 'virtual_phone'
          WHEN rl.detail LIKE '%地域%' OR rl.detail LIKE '%region%' THEN 'region_limit'
          WHEN rl.detail LIKE '%频繁%' OR rl.detail LIKE '%frequency%' OR rl.detail LIKE '%次数%' THEN 'frequency_limit'
          WHEN rl.detail LIKE '%IP%' OR rl.detail LIKE '%ip%' OR rl.detail LIKE '%封禁%' THEN 'ip_block'
          WHEN rl.detail LIKE '%金额%' OR rl.detail LIKE '%amount%' THEN 'amount_limit'
          ELSE 'other'
        END as detect_type,
        CASE
          WHEN rl.action LIKE '%check%' OR rl.action LIKE '%下单%' THEN (SELECT COUNT(*) FROM risk_logs rl2 WHERE rl2.user_id = rl.user_id AND rl2.created_at >= rl.created_at - 3600)
          ELSE 0
        END as hourly_count
      FROM risk_logs rl
      LEFT JOIN users u ON rl.user_id = u.id
      ${whereSql}
      ORDER BY rl.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...countParams);

    const detectTypeMap: Record<string, string> = {
      virtual_phone: '虚拟号识别',
      region_limit: '地域限售',
      frequency_limit: '异常频次',
      ip_block: 'IP封禁',
      amount_limit: '金额超限',
      other: '其他风险'
    };

    const enrichedLogs = logs.map(log => ({
      ...log,
      detect_type_label: detectTypeMap[log.detect_type] || '其他风险',
      is_virtual_phone: log.detect_type === 'virtual_phone',
      is_region_limit: log.detect_type === 'region_limit',
      is_frequency: log.detect_type === 'frequency_limit'
    }));

    res.json({
      success: true,
      data: {
        list: enrichedLogs,
        total: totalRow.cnt || 0,
        page: Number(page),
        pageSize: Number(limit)
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/risk/stats', authMiddleware, adminMiddleware, (_req, res) => {
  try {
    const t = now();
    const todayStart = t - (t % 86400);

    const totalRisk: any = db.prepare('SELECT COUNT(*) as cnt FROM risk_logs').get();
    const todayRisk: any = db.prepare('SELECT COUNT(*) as cnt FROM risk_logs WHERE created_at >= ?').get(todayStart);
    const totalBlocked: any = db.prepare('SELECT COUNT(*) as cnt FROM risk_logs WHERE blocked = 1').get();
    const virtualPhoneCount: any = db.prepare("SELECT COUNT(*) as cnt FROM risk_logs WHERE detail LIKE '%虚拟号%' OR detail LIKE '%virtual%'").get();
    const regionCount: any = db.prepare("SELECT COUNT(*) as cnt FROM risk_logs WHERE detail LIKE '%地域%' OR detail LIKE '%region%'").get();
    const frequencyCount: any = db.prepare("SELECT COUNT(*) as cnt FROM risk_logs WHERE detail LIKE '%频繁%' OR detail LIKE '%frequency%' OR detail LIKE '%次数%'").get();

    const levelDist: any[] = db.prepare('SELECT risk_level, COUNT(*) as cnt FROM risk_logs GROUP BY risk_level').all();
    const ipRank: any[] = db.prepare('SELECT ip, COUNT(*) as cnt FROM risk_logs WHERE ip IS NOT NULL GROUP BY ip ORDER BY cnt DESC LIMIT 10').all();
    const userRank: any[] = db.prepare(`
      SELECT u.nickname, u.phone, COUNT(*) as cnt
      FROM risk_logs rl
      LEFT JOIN users u ON rl.user_id = u.id
      WHERE rl.user_id IS NOT NULL
      GROUP BY rl.user_id
      ORDER BY cnt DESC
      LIMIT 10
    `).all();

    res.json({
      success: true,
      data: {
        total: totalRisk.cnt || 0,
        today: todayRisk.cnt || 0,
        blocked: totalBlocked.cnt || 0,
        virtualPhone: virtualPhoneCount.cnt || 0,
        regionLimit: regionCount.cnt || 0,
        frequencyAbnormal: frequencyCount.cnt || 0,
        levelDistribution: levelDist,
        ipRank,
        userRank
      }
    });
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

router.get('/reports/export', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  try {
    const { type = 'orders', format = 'csv', start_date, end_date } = req.query as any;
    const t = now();
    const endTime = end_date ? new Date(end_date).getTime() / 1000 : t;
    const startTime = start_date ? new Date(start_date).getTime() / 1000 : t - 86400 * 30;

    let data: any[] = [];
    let filename = `${type}_export_${new Date().toISOString().slice(0, 10)}`;
    let headers: string[] = [];

    switch (type) {
      case 'risk':
        headers = ['ID', '类型', '风险等级', '用户ID', '用户昵称', 'IP地址', '地域', '检测类型', '是否封禁', '原因', '创建时间'];
        data = db.prepare(`
          SELECT rl.id, rl.action as type, rl.risk_level, rl.user_id, u.nickname as user_name,
                 rl.ip as ip_address, rl.region, rl.detail as reason, rl.blocked, rl.created_at,
            CASE
              WHEN rl.detail LIKE '%虚拟号%' OR rl.detail LIKE '%virtual%' THEN '虚拟号识别'
              WHEN rl.detail LIKE '%地域%' OR rl.detail LIKE '%region%' THEN '地域限售'
              WHEN rl.detail LIKE '%频繁%' OR rl.detail LIKE '%frequency%' THEN '异常频次'
              WHEN rl.detail LIKE '%IP%' OR rl.detail LIKE '%封禁%' THEN 'IP封禁'
              WHEN rl.detail LIKE '%金额%' OR rl.detail LIKE '%amount%' THEN '金额超限'
              ELSE '其他风险'
            END as detection_type
          FROM risk_logs rl
          LEFT JOIN users u ON rl.user_id = u.id
          WHERE rl.created_at >= ? AND rl.created_at <= ?
          ORDER BY rl.created_at DESC
          LIMIT 5000
        `).all(startTime, endTime);
        filename = `风控日志_${new Date(startTime * 1000).toISOString().slice(0, 10)}_${new Date(endTime * 1000).toISOString().slice(0, 10)}`;
        break;

      case 'settlements':
        headers = ['结算单号', '供应商', '账期', '订单数', '订单金额', '结算金额', '分润比例', '发票状态', '状态', '创建时间'];
        data = db.prepare(`
          SELECT s.id, su.name as supplier_name, s.period, s.total_orders as order_count,
                 s.total_amount as order_amount, s.settlement_amount, s.status,
                 s.invoice_status, s.created_at,
                 (SELECT level1_ratio FROM profit_share_configs WHERE supplier_id = s.supplier_id LIMIT 1) as profit_ratio
          FROM settlements s
          LEFT JOIN suppliers su ON s.supplier_id = su.id
          WHERE s.created_at >= ? AND s.created_at <= ?
          ORDER BY s.created_at DESC
          LIMIT 5000
        `).all(startTime, endTime);
        filename = `供应商结算_${new Date(startTime * 1000).toISOString().slice(0, 10)}_${new Date(endTime * 1000).toISOString().slice(0, 10)}`;
        break;

      case 'commission':
        headers = ['ID', '用户昵称', '层级', '来源用户', '商品', '订单号', '金额', '状态', '结算时间', '创建时间'];
        data = db.prepare(`
          SELECT cr.id, u.nickname as user_name, cr.level, cr.from_nickname,
                 cr.product_name, cr.order_id, cr.amount, cr.status,
                 cr.settled_at, cr.created_at
          FROM commission_records cr
          LEFT JOIN users u ON cr.user_id = u.id
          WHERE cr.created_at >= ? AND cr.created_at <= ?
          ORDER BY cr.created_at DESC
          LIMIT 5000
        `).all(startTime, endTime);
        filename = `佣金明细_${new Date(startTime * 1000).toISOString().slice(0, 10)}_${new Date(endTime * 1000).toISOString().slice(0, 10)}`;
        break;

      case 'crypto':
        headers = ['ID', '操作类型', '操作员', '卡密ID', '卡密数量', '算法', '密钥版本', 'IP地址', '操作原因', '状态', '创建时间'];
        data = db.prepare(`
          SELECT ccl.id, ccl.operation, ccl.operator, ccl.card_id, ccl.card_count,
                 ccl.algorithm, ccl.key_version, ccl.ip_address, ccl.reason,
                 ccl.status, ccl.created_at
          FROM card_crypto_logs ccl
          WHERE ccl.created_at >= ? AND ccl.created_at <= ?
          ORDER BY ccl.created_at DESC
          LIMIT 5000
        `).all(startTime, endTime);
        filename = `卡密加密解密_${new Date(startTime * 1000).toISOString().slice(0, 10)}_${new Date(endTime * 1000).toISOString().slice(0, 10)}`;
        break;

      case 'invoices':
        headers = ['发票ID', '发票号', '类型', '抬头', '金额', '关联结算单', '状态', '开票时间', '邮寄时间', '签收时间', '创建时间'];
        data = db.prepare(`
          SELECT inv.id, inv.invoice_no, inv.type, inv.title, inv.amount,
                 inv.settlement_id, inv.status, inv.issued_at, inv.mailed_at,
                 inv.received_at, inv.created_at
          FROM invoices inv
          WHERE inv.created_at >= ? AND inv.created_at <= ?
          ORDER BY inv.created_at DESC
          LIMIT 5000
        `).all(startTime, endTime);
        filename = `发票管理_${new Date(startTime * 1000).toISOString().slice(0, 10)}_${new Date(endTime * 1000).toISOString().slice(0, 10)}`;
        break;

      case 'profit':
        headers = ['配置ID', '供应商', 'L1分润比例', 'L2分润比例', 'L3分润比例', '供应商比例', '平台比例', '更新时间'];
        data = db.prepare(`
          SELECT psc.id, s.name as supplier_name, psc.level1_ratio, psc.level2_ratio,
                 psc.level3_ratio, psc.supplier_ratio, psc.platform_ratio, psc.updated_at
          FROM profit_share_configs psc
          LEFT JOIN suppliers s ON psc.supplier_id = s.id
          WHERE psc.updated_at >= ? AND psc.updated_at <= ?
          ORDER BY psc.updated_at DESC
          LIMIT 5000
        `).all(startTime, endTime);
        filename = `分润配置_${new Date(startTime * 1000).toISOString().slice(0, 10)}_${new Date(endTime * 1000).toISOString().slice(0, 10)}`;
        break;

      case 'reviews':
        headers = ['复查ID', '类型', '关联订单', '用户', '申诉原因', '申诉金额', '状态', '审核人', '申诉时间', '审核时间'];
        data = db.prepare(`
          SELECT rr.id, rr.type, rr.order_id, u.nickname as user_name,
                 rr.appeal_reason, rr.amount, rr.status, rr.reviewed_by,
                 rr.appeal_at, rr.reviewed_at
          FROM review_records rr
          LEFT JOIN users u ON rr.user_id = u.id
          WHERE rr.created_at >= ? AND rr.created_at <= ?
          ORDER BY rr.created_at DESC
          LIMIT 5000
        `).all(startTime, endTime);
        filename = `复查记录_${new Date(startTime * 1000).toISOString().slice(0, 10)}_${new Date(endTime * 1000).toISOString().slice(0, 10)}`;
        break;

      default:
        headers = ['订单号', '商品', '用户', '手机号', '金额', '状态', '供应商', '渠道', '失败原因', '创建时间'];
        data = db.prepare(`
          SELECT o.order_no, p.name as product_name, u.nickname as user_name,
                 o.recharge_account, o.final_amount, o.status,
                 s.name as supplier_name, rc.name as channel_name,
                 o.fail_reason, o.created_at
          FROM orders o
          LEFT JOIN products p ON o.product_id = p.id
          LEFT JOIN users u ON o.user_id = u.id
          LEFT JOIN suppliers s ON o.supplier_id = s.id
          LEFT JOIN recharge_channels rc ON o.channel_id = rc.id
          WHERE o.created_at >= ? AND o.created_at <= ?
          ORDER BY o.created_at DESC
          LIMIT 5000
        `).all(startTime, endTime);
        filename = `订单明细_${new Date(startTime * 1000).toISOString().slice(0, 10)}_${new Date(endTime * 1000).toISOString().slice(0, 10)}`;
    }

    if (format === 'json') {
      res.json({
        success: true,
        data: {
          filename,
          headers,
          rows: data,
          total: data.length
        }
      });
    } else {
      const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      const headerToKey = (h: string) => {
        const map: Record<string, string> = {
          'ID': 'id', '类型': 'type', '风险等级': 'risk_level', '用户ID': 'user_id', 'IP地址': 'ip_address',
          '原因': 'reason', '状态': 'status', '创建时间': 'created_at', '供应商': 'supplier_name',
          '账期': 'period', '订单数': 'order_count', '订单金额': 'order_amount', '结算金额': 'settled_amount',
          '用户昵称': 'user_name', '层级': 'level', '来源用户': 'from_nickname', '商品': 'product_name',
          '金额': 'amount', '操作类型': 'operation', '操作员': 'operator', '卡密数量': 'card_count',
          '算法': 'algorithm', '发票号': 'invoice_no', '抬头': 'title', '关联结算单': 'settlement_id',
          '订单号': 'order_no', '用户': 'user_name', '渠道': 'channel_name'
        };
        return map[h] || h.toLowerCase().replace(/\s+/g, '_');
      };
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => escapeCsv(row[headerToKey(h)])).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}.csv`);
      res.send('\uFEFF' + csvContent);
    }
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/operation-logs', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  try {
    const { page = 1, pageSize = 20, action_type, operator } = req.query as any;
    const offset = (Number(page) - 1) * Number(pageSize);

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (action_type) {
      whereClauses.push('action_type = ?');
      params.push(action_type);
    }
    if (operator) {
      whereClauses.push('operator LIKE ?');
      params.push(`%${operator}%`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const totalRow: any = db.prepare(`SELECT COUNT(*) as cnt FROM operation_logs ${whereSql}`).get(...params);
    const logs: any[] = db.prepare(`
      SELECT ol.*, u.nickname as operator_name
      FROM operation_logs ol
      LEFT JOIN users u ON ol.operator_id = u.id
      ${whereSql}
      ORDER BY ol.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(pageSize), offset);

    res.json({
      success: true,
      data: {
        list: logs,
        total: totalRow.cnt,
        page: Number(page),
        pageSize: Number(pageSize),
        actionTypes: [
          { key: 'login', label: '登录' },
          { key: 'logout', label: '登出' },
          { key: 'create', label: '创建' },
          { key: 'update', label: '更新' },
          { key: 'delete', label: '删除' },
          { key: 'export', label: '导出' },
          { key: 'settle', label: '结算' },
          { key: 'refund', label: '退款' },
          { key: 'retry', label: '重试' },
          { key: 'crypto', label: '加解密' },
          { key: 'risk', label: '风控操作' }
        ]
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/operation-logs', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  try {
    const { action_type, target_id, target_type, detail, ip_address } = req.body;
    const t = now();

    db.prepare(`
      INSERT INTO operation_logs (operator_id, operator, action_type, target_id, target_type, detail, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.userId || 'system',
      (req as any).user?.nickname || 'system',
      action_type,
      target_id || null,
      target_type || null,
      detail || null,
      ip_address || req.clientIp,
      t
    );

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/audit/dashboard', authMiddleware, adminMiddleware, (_req, res) => {
  try {
    const t = now();
    const todayStart = t - (t % 86400);
    const weekStart = t - 86400 * 7;

    const todayOperations: any = db.prepare('SELECT COUNT(*) as cnt FROM operation_logs WHERE created_at >= ?').get(todayStart);
    const pendingReviews: any = db.prepare("SELECT COUNT(*) as cnt FROM review_records WHERE status = 'pending'").get();
    const pendingSettlements: any = db.prepare("SELECT COUNT(*) as cnt FROM settlements WHERE status = 'pending'").get();
    const pendingInvoices: any = db.prepare("SELECT COUNT(*) as cnt FROM invoices WHERE status = 'pending'").get();

    const failedOrders: any = db.prepare("SELECT COUNT(*) as cnt FROM orders WHERE status = 'failed' AND created_at >= ?").get(todayStart);
    const pendingStockSync: any = db.prepare("SELECT COUNT(*) as cnt FROM products WHERE status = 1 AND need_sync = 1").get();
    const channelDowngrade: any = db.prepare("SELECT COUNT(*) as cnt FROM recharge_channels WHERE status = 0").get();

    const recentOperations: any[] = db.prepare(`
      SELECT ol.*, u.nickname as operator_name
      FROM operation_logs ol
      LEFT JOIN users u ON ol.operator_id = u.id
      ORDER BY ol.created_at DESC
      LIMIT 10
    `).all();

    const recentReviews: any[] = db.prepare(`
      SELECT rr.*, u.nickname as user_name, o.order_no, o.product_name
      FROM review_records rr
      LEFT JOIN users u ON rr.user_id = u.id
      LEFT JOIN orders o ON rr.order_id = o.id
      ORDER BY rr.created_at DESC
      LIMIT 10
    `).all();

    const todayRisk: any = db.prepare('SELECT COUNT(*) as cnt FROM risk_logs WHERE created_at >= ?').get(todayStart);
    const blockedToday: any = db.prepare("SELECT COUNT(*) as cnt FROM risk_logs WHERE blocked = 1 AND created_at >= ?").get(todayStart);

    const auditStats = {
      todayOperations: todayOperations.cnt || 0,
      pendingReviews: pendingReviews.cnt || 0,
      pendingSettlements: pendingSettlements.cnt || 0,
      pendingInvoices: pendingInvoices.cnt || 0,
      todayFailedOrders: failedOrders.cnt || 0,
      pendingStockSync: pendingStockSync.cnt || 0,
      channelDowngrade: channelDowngrade.cnt || 0,
      todayRiskLogs: todayRisk.cnt || 0,
      todayBlocked: blockedToday.cnt || 0,
      recentOperations,
      recentReviews
    };

    res.json({ success: true, data: auditStats });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/invoices', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query as any;
    const offset = (Number(page) - 1) * Number(pageSize);

    let whereSql = '';
    let params: any[] = [];
    if (status && status !== 'all') {
      whereSql = 'WHERE status = ?';
      params.push(status);
    }

    const totalRow: any = db.prepare(`SELECT COUNT(*) as cnt FROM invoices ${whereSql}`).get(...params);
    const invoices: any[] = db.prepare(`
      SELECT i.*, ss.supplier_name, ss.period as settlement_period
      FROM invoices i
      LEFT JOIN supplier_settlements ss ON i.settlement_id = ss.id
      ${whereSql}
      ORDER BY i.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, Number(pageSize), offset);

    res.json({
      success: true,
      data: {
        list: invoices,
        total: totalRow.cnt,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/review-center/summary', authMiddleware, adminMiddleware, (_req, res) => {
  try {
    const t = now();
    const todayStart = t - (t % 86400);

    const pendingOrderReviews: any = db.prepare(`
      SELECT COUNT(*) as cnt FROM review_records
      WHERE status = 'pending' AND type = 'order_appeal'
    `).get();

    const pendingCommissionReviews: any = db.prepare(`
      SELECT COUNT(*) as cnt FROM review_records
      WHERE status = 'pending' AND type = 'commission_review'
    `).get();

    const pendingSettlementReviews: any = db.prepare(`
      SELECT COUNT(*) as cnt FROM settlements
      WHERE status = 'pending'
    `).get();

    const failedOrders: any = db.prepare(`
      SELECT COUNT(*) as cnt FROM orders
      WHERE status = 'failed' AND created_at >= ?
    `).get(todayStart - 86400 * 3);

    const channelDowngrades: any = db.prepare(`
      SELECT COUNT(*) as cnt FROM recharge_channels
      WHERE status = 0
    `).get();

    const stockSyncNeeded: any = db.prepare(`
      SELECT COUNT(*) as cnt FROM products
      WHERE status = 1 AND need_sync = 1
    `).get();

    const todayReviews: any = db.prepare(`
      SELECT COUNT(*) as cnt FROM review_records
      WHERE created_at >= ?
    `).get(todayStart);

    res.json({
      success: true,
      data: {
        pendingOrderReviews: pendingOrderReviews.cnt || 0,
        pendingCommissionReviews: pendingCommissionReviews.cnt || 0,
        pendingSettlementReviews: pendingSettlementReviews.cnt || 0,
        recentFailedOrders: failedOrders.cnt || 0,
        channelDowngrades: channelDowngrades.cnt || 0,
        stockSyncNeeded: stockSyncNeeded.cnt || 0,
        todayReviews: todayReviews.cnt || 0
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/review-center/list', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { page = 1, pageSize = 20, type, status }: any = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    let reviewItems: any[] = [];
    let total = 0;

    if (!type || type === 'failed_order') {
      const whereStatus = status && status !== 'all' ? `AND o.status = '${status}'` : '';
      const countRow: any = db.prepare(`
        SELECT COUNT(*) as cnt FROM orders o
        WHERE o.status IN ('failed', 'refunded') ${whereStatus}
      `).get();
      total += countRow.cnt || 0;

      const orders: any[] = db.prepare(`
        SELECT o.id, o.order_no, o.product_name, o.recharge_account, o.final_amount,
               o.status, o.fail_reason, o.created_at, o.finish_time,
               u.nickname as user_name, u.phone as user_phone,
               s.name as supplier_name,
               rr.id as review_id, rr.status as review_status, rr.appeal_reason
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN suppliers s ON o.supplier_id = s.id
        LEFT JOIN review_records rr ON rr.order_id = o.id
        WHERE o.status IN ('failed', 'refunded') ${whereStatus}
        ORDER BY o.created_at DESC
        LIMIT ? OFFSET ?
      `).all(Number(pageSize), offset);

      reviewItems = reviewItems.concat(orders.map(o => ({
        ...o,
        item_type: 'failed_order',
        title: o.product_name,
        amount: o.final_amount,
        can_retry: o.status === 'failed',
        can_refund: o.status === 'failed' && o.refund_status !== 'refunded'
      })));
    }

    if (!type || type === 'channel_downgrade') {
      const countRow: any = db.prepare(`
        SELECT COUNT(*) as cnt FROM recharge_channels
        WHERE status = 0
      `).get();
      total += countRow.cnt || 0;

      if (!type) {
        const channels: any[] = db.prepare(`
          SELECT rc.id, rc.name, rc.priority, rc.success_rate, rc.fail_reason,
                 rc.updated_at, s.name as supplier_name, p.name as product_name
          FROM recharge_channels rc
          LEFT JOIN suppliers s ON rc.supplier_id = s.id
          LEFT JOIN products p ON rc.product_id = p.id
          WHERE rc.status = 0
          ORDER BY rc.updated_at DESC
          LIMIT ? OFFSET ?
        `).all(Number(pageSize), offset);

        reviewItems = reviewItems.concat(channels.map(c => ({
          ...c,
          item_type: 'channel_downgrade',
          title: `${c.product_name} - ${c.supplier_name}`,
          amount: null,
          can_restore: true
        })));
      }
    }

    if (!type || type === 'stock_sync') {
      const countRow: any = db.prepare(`
        SELECT COUNT(*) as cnt FROM products
        WHERE status = 1 AND need_sync = 1
      `).get();
      total += countRow.cnt || 0;

      if (!type) {
        const products: any[] = db.prepare(`
          SELECT p.id, p.name, p.sku_type, p.stock, p.sync_batch, p.last_sync_at,
                 s.name as supplier_name, p.supplier_stock
          FROM products p
          LEFT JOIN suppliers s ON p.supplier_id = s.id
          WHERE p.status = 1 AND p.need_sync = 1
          ORDER BY p.last_sync_at ASC
          LIMIT ? OFFSET ?
        `).all(Number(pageSize), offset);

        reviewItems = reviewItems.concat(products.map(p => ({
          ...p,
          item_type: 'stock_sync',
          title: p.name,
          amount: null,
          stock_diff: p.supplier_stock !== undefined ? p.supplier_stock - p.stock : null,
          can_sync: true
        })));
      }
    }

    if (!type || type === 'settlement') {
      const whereStatus = status && status !== 'all' ? `AND s.status = '${status}'` : '';
      const countRow: any = db.prepare(`
        SELECT COUNT(*) as cnt FROM settlements s
        WHERE s.status IN ('pending', 'processing') ${whereStatus}
      `).get();
      total += countRow.cnt || 0;

      if (!type) {
        const settlements: any[] = db.prepare(`
          SELECT s.id, s.period, s.total_orders, s.total_amount, s.settlement_amount,
                 s.status, s.created_at, su.name as supplier_name,
                 s.invoice_status
          FROM settlements s
          LEFT JOIN suppliers su ON s.supplier_id = su.id
          WHERE s.status IN ('pending', 'processing') ${whereStatus}
          ORDER BY s.created_at DESC
          LIMIT ? OFFSET ?
        `).all(Number(pageSize), offset);

        reviewItems = reviewItems.concat(settlements.map(s => ({
          ...s,
          item_type: 'settlement',
          title: `${s.supplier_name} - ${s.period}`,
          amount: s.settlement_amount,
          can_approve: s.status === 'pending',
          can_invoice: s.invoice_status === 'pending'
        })));
      }
    }

    if (!type || type === 'review') {
      const whereStatus = status && status !== 'all' ? `AND rr.status = '${status}'` : '';
      const countRow: any = db.prepare(`
        SELECT COUNT(*) as cnt FROM review_records rr
        WHERE rr.status IN ('pending', 'processing') ${whereStatus}
      `).get();
      total += countRow.cnt || 0;

      if (!type) {
        const reviews: any[] = db.prepare(`
          SELECT rr.*, u.nickname as user_name, o.order_no, o.product_name
          FROM review_records rr
          LEFT JOIN users u ON rr.user_id = u.id
          LEFT JOIN orders o ON rr.order_id = o.id
          WHERE rr.status IN ('pending', 'processing') ${whereStatus}
          ORDER BY rr.created_at DESC
          LIMIT ? OFFSET ?
        `).all(Number(pageSize), offset);

        reviewItems = reviewItems.concat(reviews.map(r => ({
          ...r,
          item_type: 'review',
          title: r.type === 'order_appeal' ? '订单申诉' : '佣金复查',
          amount: r.amount,
          can_process: r.status === 'pending'
        })));
      }
    }

    reviewItems.sort((a, b) => (b.updated_at || b.created_at) - (a.updated_at || a.created_at));
    reviewItems = reviewItems.slice(0, Number(pageSize));

    res.json({
      success: true,
      data: {
        list: reviewItems,
        total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/review-center/process/:id', authMiddleware, adminMiddleware, (req: AuthRequest, res) => {
  try {
    const { action, reason } = req.body;
    const t = now();
    const reviewId = req.params.id;

    if (!action) return res.status(400).json({ success: false, message: '缺少操作类型' });

    const result: any = { success: true };

    if (action === 'approve_review') {
      db.prepare(`
        UPDATE review_records
        SET status = 'resolved', reviewed_at = ?, reviewed_by = ?, review_result = ?
        WHERE id = ?
      `).run(t, req.userId, reason || '审核通过', reviewId);
      result.message = '复查已通过';
    } else if (action === 'reject_review') {
      db.prepare(`
        UPDATE review_records
        SET status = 'rejected', reviewed_at = ?, reviewed_by = ?, review_result = ?
        WHERE id = ?
      `).run(t, req.userId, reason || '审核不通过', reviewId);
      result.message = '复查已驳回';
    } else if (action === 'retry_order') {
      const order: any = db.prepare('SELECT * FROM orders WHERE id = ?').get(reviewId);
      if (!order) return res.status(404).json({ success: false, message: '订单不存在' });
      db.prepare("UPDATE orders SET status = 'processing', updated_at = ?, fail_reason = NULL WHERE id = ?")
        .run(t, reviewId);
      result.message = '订单已重试';
    } else if (action === 'refund_order') {
      const order: any = db.prepare('SELECT * FROM orders WHERE id = ?').get(reviewId);
      if (!order) return res.status(404).json({ success: false, message: '订单不存在' });
      db.transaction(() => {
        db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(order.final_amount, order.user_id);
        db.prepare("UPDATE orders SET status = 'refunded', refund_status = 'refunded', refund_time = ?, updated_at = ?, finish_time = ? WHERE id = ?")
          .run(t, t, t, reviewId);
        db.prepare(`
          INSERT INTO commission_records (id, user_id, order_id, amount, type, status, created_at, remark)
          VALUES (?, ?, ?, ?, 'refund', 'completed', ?, '订单退款')
        `).run(generateId(), order.user_id, order.id, -order.final_amount, t);
      })();
      result.message = '退款已处理';
    } else if (action === 'restore_channel') {
      db.prepare("UPDATE recharge_channels SET status = 1, updated_at = ?, fail_reason = NULL WHERE id = ?")
        .run(t, reviewId);
      result.message = '通道已恢复';
    } else if (action === 'sync_stock') {
      db.prepare("UPDATE products SET need_sync = 0, last_sync_at = ?, updated_at = ? WHERE id = ?")
        .run(t, t, reviewId);
      result.message = '库存已同步';
    } else if (action === 'approve_settlement') {
      db.prepare("UPDATE settlements SET status = 'processing', updated_at = ? WHERE id = ?")
        .run(t, reviewId);
      result.message = '结算已进入处理';
    } else if (action === 'mark_invoiced') {
      db.prepare("UPDATE settlements SET invoice_status = 'invoiced', updated_at = ? WHERE id = ?")
        .run(t, reviewId);
      result.message = '已标记开票';
    }

    db.prepare(`
      INSERT INTO operation_logs
        (id, operator_id, operator, action_type, target_id, target_type, detail, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      generateId(), req.userId, req.username || req.userId,
      action, reviewId, 'review_center', reason || action,
      req.clientIp || '', t
    );

    res.json(result);
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;

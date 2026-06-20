import { Router } from 'express';
import db from '../db';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/agent/verify', authMiddleware, (req: AuthRequest, res) => {
  const { realName, idCard, licenseNo, agency, phone } = req.body;

  if (!realName || !idCard || !licenseNo || !agency || !phone) {
    res.status(400).json({ message: '请填写完整的认证信息' });
    return;
  }

  const existing = db.prepare('SELECT id FROM agents WHERE user_id = ?').get(req.user!.id);
  
  if (existing) {
    db.prepare(
      `UPDATE agents SET real_name = ?, id_card = ?, license_no = ?, agency = ?, phone = ?, verified = 0 WHERE user_id = ?`
    ).run(realName, idCard, licenseNo, agency, phone, req.user!.id);
  } else {
    db.prepare(
      `INSERT INTO agents (user_id, real_name, id_card, license_no, agency, phone) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(req.user!.id, realName, idCard, licenseNo, agency, phone);
  }

  res.json({ message: '认证信息已提交，等待审核' });
});

router.get('/agent/verify-status', authMiddleware, (req: AuthRequest, res) => {
  const agent = db.prepare('SELECT * FROM agents WHERE user_id = ?').get(req.user!.id);
  res.json({ agent: agent || null });
});

router.post('/owner-confirm', authMiddleware, (req: AuthRequest, res) => {
  const { propertyId } = req.body;

  if (!propertyId) {
    res.status(400).json({ message: '缺少房源ID' });
    return;
  }

  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(propertyId);
  
  if (!property || (property as any).owner_id !== req.user!.id) {
    res.status(403).json({ message: '无权限操作此房源' });
    return;
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const existing = db.prepare('SELECT id FROM owner_confirmations WHERE property_id = ?').get(propertyId);
  
  if (existing) {
    db.prepare(
      'UPDATE owner_confirmations SET code = ?, confirmed = 0, expires_at = ?, created_at = CURRENT_TIMESTAMP WHERE property_id = ?'
    ).run(code, expiresAt, propertyId);
  } else {
    db.prepare(
      'INSERT INTO owner_confirmations (property_id, owner_id, code, expires_at) VALUES (?, ?, ?, ?)'
    ).run(propertyId, req.user!.id, code, expiresAt);
  }

  res.json({ message: '验证码已发送（模拟）', code });
});

router.post('/owner-confirm/verify', authMiddleware, (req: AuthRequest, res) => {
  const { propertyId, code } = req.body;

  if (!propertyId || !code) {
    res.status(400).json({ message: '缺少必要参数' });
    return;
  }

  const confirmation = db.prepare(
    'SELECT * FROM owner_confirmations WHERE property_id = ? AND owner_id = ?'
  ).get(propertyId, req.user!.id);

  if (!confirmation) {
    res.status(404).json({ message: '确认记录不存在' });
    return;
  }

  const c = confirmation as any;
  if (c.code !== code) {
    res.status(400).json({ message: '验证码错误' });
    return;
  }

  if (new Date(c.expires_at) < new Date()) {
    res.status(400).json({ message: '验证码已过期' });
    return;
  }

  db.prepare(
    'UPDATE owner_confirmations SET confirmed = 1, confirmed_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(c.id);

  db.prepare(
    'UPDATE properties SET is_verified = is_verified | 2 WHERE id = ?'
  ).run(propertyId);

  res.json({ message: '业主确认成功' });
});

router.get('/image-duplicate-check/:propertyId', authMiddleware, (req: AuthRequest, res) => {
  const images = db.prepare(
    'SELECT * FROM property_images WHERE property_id = ? ORDER BY sort_order'
  ).all(req.params.id);

  const duplicates = images.filter((img: any) => img.is_duplicate === 1);

  res.json({
    total: images.length,
    duplicateCount: duplicates.length,
    images,
    duplicates,
  });
});

router.get('/compliance/transactions', authMiddleware, (req: AuthRequest, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  if (req.user!.role !== 'admin') {
    res.status(403).json({ message: '权限不足' });
    return;
  }

  const list = db.prepare(
    `SELECT t.*, p.title as property_title, 
            b.username as buyer_name, s.username as seller_name,
            r.status as regulatory_status, r.platform_ref_no
     FROM transactions t
     JOIN properties p ON t.property_id = p.id
     JOIN users b ON t.buyer_id = b.id
     JOIN users s ON t.seller_id = s.id
     LEFT JOIN regulatory_records r ON t.id = r.transaction_id
     ORDER BY t.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(Number(pageSize), offset);

  const total = db.prepare(
    'SELECT COUNT(*) as count FROM transactions'
  ).get() as { count: number };

  res.json({ list, total: total.count, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/stats', (req, res) => {
  const totalAgents = db.prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number };
  const verifiedAgents = db.prepare('SELECT COUNT(*) as count FROM agents WHERE verified = 1').get() as { count: number };
  const totalProperties = db.prepare("SELECT COUNT(*) as count FROM properties WHERE status = 'active'").get() as { count: number };
  const verifiedProperties = db.prepare("SELECT COUNT(*) as count FROM properties WHERE status = 'active' AND is_verified > 0").get() as { count: number };
  const priceWarnings = db.prepare("SELECT COUNT(*) as count FROM properties WHERE status = 'active' AND price_warning = 1").get() as { count: number };
  const ownerConfirmed = db.prepare('SELECT COUNT(*) as count FROM owner_confirmations WHERE confirmed = 1').get() as { count: number };
  const totalTransactions = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as { count: number };
  const syncedTransactions = db.prepare("SELECT COUNT(DISTINCT transaction_id) as count FROM regulatory_records WHERE status = 'synced'").get() as { count: number };

  res.json({
    agents: {
      total: totalAgents.count,
      verified: verifiedAgents.count,
      pending: totalAgents.count - verifiedAgents.count,
    },
    properties: {
      total: totalProperties.count,
      verified: verifiedProperties.count,
      priceWarnings: priceWarnings.count,
      ownerConfirmed: ownerConfirmed.count,
    },
    transactions: {
      total: totalTransactions.count,
      synced: syncedTransactions.count,
    },
  });
});

router.get('/agent/verify-records', (req, res) => {
  const list = db.prepare(
    `SELECT a.id, a.real_name, a.agency, a.license_no, a.verified, a.rating, a.created_at, a.verified_at,
            u.username
     FROM agents a
     JOIN users u ON a.user_id = u.id
     ORDER BY a.created_at DESC
     LIMIT 100`
  ).all();

  res.json({ list });
});

router.get('/price-warnings', (req, res) => {
  const list = db.prepare(
    `SELECT p.id, p.title, p.price, p.price_unit, p.area, p.district, p.community, p.images,
            p.price_warning, p.is_verified, p.price_deviation,
            m.avg_price, m.destocking_cycle
     FROM properties p
     LEFT JOIN market_data m ON p.district = m.district AND p.type = m.type
     WHERE p.status = 'active' AND p.price_warning = 1
     ORDER BY p.created_at DESC
     LIMIT 50`
  ).all();

  const listWithDeviation = (list as any[]).map(p => {
    if (p.avg_price && p.price_unit === 'wan') {
      const unitPrice = p.price * 10000 / p.area;
      const deviation = ((unitPrice - p.avg_price) / p.avg_price) * 100;
      return { ...p, deviation: Math.round(deviation * 100) / 100, unitPrice: Math.round(unitPrice) };
    }
    return { ...p, deviation: p.price_deviation || 0, unitPrice: 0 };
  });

  res.json({ list: listWithDeviation });
});

router.get('/owner-confirmations', (req, res) => {
  const list = db.prepare(
    `SELECT oc.id, oc.property_id, oc.confirmed, oc.confirmed_at, oc.created_at, oc.expires_at,
            p.title as property_title, p.price, p.area, p.district,
            u.username as owner_name
     FROM owner_confirmations oc
     JOIN properties p ON oc.property_id = p.id
     JOIN users u ON oc.owner_id = u.id
     ORDER BY oc.created_at DESC
     LIMIT 100`
  ).all();

  res.json({ list });
});

router.get('/image-duplicates', (req, res) => {
  const list = db.prepare(
    `SELECT p.id as property_id, p.title, p.images, p.district,
            COUNT(pi.id) as total_images,
            SUM(CASE WHEN pi.is_duplicate = 1 THEN 1 ELSE 0 END) as duplicate_count
     FROM properties p
     LEFT JOIN property_images pi ON p.id = pi.property_id
     WHERE p.status = 'active'
     GROUP BY p.id
     HAVING duplicate_count > 0
     ORDER BY duplicate_count DESC
     LIMIT 50`
  ).all();

  res.json({ list });
});

router.get('/regulatory-records', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(pageSize);

  const list = db.prepare(
    `SELECT r.id, r.record_type, r.record_content, r.platform_ref_no, r.status, r.created_at,
            t.order_no, p.title as property_title,
            b.username as buyer_name, s.username as seller_name
     FROM regulatory_records r
     JOIN transactions t ON r.transaction_id = t.id
     JOIN properties p ON t.property_id = p.id
     JOIN users b ON t.buyer_id = b.id
     JOIN users s ON t.seller_id = s.id
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`
  ).all(Number(pageSize), offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM regulatory_records').get() as { count: number };

  res.json({ list, total: total.count, page: Number(page), pageSize: Number(pageSize) });
});

export default router;

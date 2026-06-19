import { Router } from 'express';
import { getDb } from '../database';
import { verifyToken, requireCommunity } from '../middleware/auth';
import type { AuthenticatedRequest, Partner, Order, Wallet } from '../types';

const router = Router();

router.post('/apply', verifyToken, requireCommunity, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const { shop_name, shop_type, parent_partner_id } = req.body;

  if (!shop_name) {
    res.status(400).json({ success: false, error: '店铺名称不能为空' });
    return;
  }

  const db = getDb();
  const existing = db.prepare('SELECT * FROM partners WHERE resident_id = ? AND status = ?').get(authReq.user!.id, 'active') as Partner | undefined;

  if (existing) {
    res.status(409).json({ success: false, error: '您已经是合伙人' });
    return;
  }

  let level = 1;
  let commissionRate = 0.1;

  if (parent_partner_id) {
    const parent = db.prepare('SELECT * FROM partners WHERE id = ? AND status = ?').get(parent_partner_id, 'active') as Partner | undefined;
    if (!parent) {
      res.status(404).json({ success: false, error: '上级合伙人不存在' });
      return;
    }
    level = parent.level + 1;
    commissionRate = Math.max(0.02, parent.commission_rate * 0.5);
  }

  const result = db.prepare(
    `INSERT INTO partners (community_id, resident_id, shop_name, shop_type, commission_rate, parent_partner_id, level, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`
  ).run(authReq.community!.id, authReq.user!.id, shop_name, shop_type || '', commissionRate, parent_partner_id || null, level);

  const partner = db.prepare('SELECT * FROM partners WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: partner });
});

router.get('/my', verifyToken, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const db = getDb();
  const partner = db.prepare(
    `SELECT p.*, r.real_name as resident_name FROM partners p JOIN residents r ON p.resident_id = r.id WHERE p.resident_id = ? AND p.status = ?`
  ).get(authReq.user!.id, 'active');

  if (!partner) {
    res.status(404).json({ success: false, error: '您还不是合伙人' });
    return;
  }

  res.json({ success: true, data: partner });
});

router.get('/settlements', verifyToken, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  const db = getDb();
  const partner = db.prepare('SELECT * FROM partners WHERE resident_id = ? AND status = ?').get(authReq.user!.id, 'active') as Partner | undefined;

  if (!partner) {
    res.status(404).json({ success: false, error: '您还不是合伙人' });
    return;
  }

  const total = (db.prepare('SELECT COUNT(*) as cnt FROM partner_settlements WHERE partner_id = ?').get(partner.id) as any).cnt;
  const settlements = db.prepare(
    'SELECT * FROM partner_settlements WHERE partner_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(partner.id, limit, offset);

  res.json({
    success: true,
    data: { items: settlements, total, page, limit, totalPages: Math.ceil(total / limit) }
  });
});

router.get('/tree', verifyToken, requireCommunity, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const db = getDb();
  const partners = db.prepare(
    `SELECT p.*, r.real_name as resident_name FROM partners p JOIN residents r ON p.resident_id = r.id WHERE p.community_id = ? AND p.status = ?`
  ).all(authReq.community!.id, 'active') as (Partner & { resident_name: string })[];

  const tree = buildTree(partners, null);
  res.json({ success: true, data: tree });
});

router.post('/settle/:orderId', verifyToken, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const orderId = parseInt(req.params.orderId as string);
  const db = getDb();

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as Order | undefined;
  if (!order) {
    res.status(404).json({ success: false, error: '订单不存在' });
    return;
  }

  if (order.status !== 'confirmed') {
    res.status(400).json({ success: false, error: '订单未确认，无法结算' });
    return;
  }

  const sku = db.prepare('SELECT * FROM skus WHERE id = ?').get(order.sku_id);
  if (!sku) {
    res.status(404).json({ success: false, error: '商品不存在' });
    return;
  }

  const existingSettlement = db.prepare('SELECT * FROM partner_settlements WHERE order_id = ?').get(orderId);
  if (existingSettlement) {
    res.status(400).json({ success: false, error: '该订单已结算' });
    return;
  }

  const skuPartner = db.prepare('SELECT * FROM partners WHERE community_id = ? AND status = ? LIMIT 1').get(order.community_id, 'active') as Partner | undefined;

  if (!skuPartner) {
    res.status(404).json({ success: false, error: '无合伙人可结算' });
    return;
  }

  const transaction = db.transaction(() => {
    const chain = getPartnerChain(db, skuPartner.id);
    let remaining = order.total_amount;

    for (const partner of chain) {
      const commission = remaining * partner.commission_rate;
      remaining -= commission;

      db.prepare(
        `INSERT INTO partner_settlements (partner_id, order_id, amount, level, status, settled_at) VALUES (?, ?, ?, ?, 'settled', datetime('now'))`
      ).run(partner.id, orderId, commission, partner.level);

      db.prepare('UPDATE partners SET total_earnings = total_earnings + ? WHERE id = ?').run(commission, partner.id);

      const wallet = db.prepare('SELECT * FROM wallets WHERE resident_id = ?').get(partner.resident_id) as Wallet | undefined;
      if (wallet) {
        db.prepare('UPDATE wallets SET balance = balance + ?, total_earned = total_earned + ? WHERE resident_id = ?').run(commission, commission, partner.resident_id);
        db.prepare(
          `INSERT INTO wallet_transactions (wallet_id, type, amount, ref_type, ref_id, description) VALUES (?, 'earning', ?, 'partner_settlement', ?, ?)`
        ).run(wallet.id, commission, partner.id, `合伙人L${partner.level}佣金结算-订单${orderId}`);
      }
    }
  });

  transaction();

  const settlements = db.prepare('SELECT * FROM partner_settlements WHERE order_id = ?').all(orderId);
  res.json({ success: true, data: settlements });
});

function getPartnerChain(db: any, partnerId: number): Partner[] {
  const chain: Partner[] = [];
  let currentId: number | null = partnerId;

  while (currentId) {
    const partner = db.prepare('SELECT * FROM partners WHERE id = ?').get(currentId) as Partner | undefined;
    if (!partner) break;
    chain.push(partner);
    currentId = partner.parent_partner_id;
  }

  return chain;
}

function buildTree(partners: (Partner & { resident_name: string })[], parentId: number | null): any[] {
  return partners
    .filter(p => p.parent_partner_id === parentId)
    .map(p => ({
      ...p,
      children: buildTree(partners, p.id)
    }));
}

export default router;

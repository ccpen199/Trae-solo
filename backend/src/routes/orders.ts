import { Router } from 'express';
import { getDb } from '../database';
import { verifyToken, requireCommunity } from '../middleware/auth';
import type { AuthenticatedRequest, Order, Sku, Wallet } from '../types';

const router = Router();

router.post('/', verifyToken, requireCommunity, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const { sku_id, quantity, payment_method, shipping_address } = req.body;

  if (!sku_id || !quantity) {
    res.status(400).json({ success: false, error: '商品ID和数量不能为空' });
    return;
  }

  const db = getDb();
  const sku = db.prepare('SELECT * FROM skus WHERE id = ? AND status = ?').get(sku_id, 'active') as Sku | undefined;

  if (!sku) {
    res.status(404).json({ success: false, error: '商品不存在' });
    return;
  }

  const totalStock = sku.stock_self + sku.stock_property;
  if (totalStock < quantity) {
    res.status(400).json({ success: false, error: '库存不足' });
    return;
  }

  const totalAmount = sku.price * quantity;
  const communityId = authReq.community!.id;

  const orderResult = db.prepare(
    `INSERT INTO orders (community_id, buyer_id, sku_id, quantity, total_amount, status, escrow_status, payment_method, shipping_address)
     VALUES (?, ?, ?, ?, ?, 'paid', 'held', ?, ?)`
  ).run(communityId, authReq.user!.id, sku_id, quantity, totalAmount, payment_method || null, shipping_address || null);

  if (sku.stock_self >= quantity) {
    db.prepare('UPDATE skus SET stock_self = stock_self - ? WHERE id = ?').run(quantity, sku_id);
  } else {
    const fromProperty = quantity - sku.stock_self;
    db.prepare('UPDATE skus SET stock_self = 0, stock_property = stock_property - ? WHERE id = ?').run(fromProperty, sku_id);
  }

  logFraud(db, 'order', orderResult.lastInsertRowid as number, 'create', authReq.user!.id, req);

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderResult.lastInsertRowid);
  res.status(201).json({ success: true, data: order });
});

router.get('/', verifyToken, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) as cnt FROM orders WHERE buyer_id = ?').get(authReq.user!.id) as any).cnt;
  const orders = db.prepare(
    `SELECT o.*, s.title as sku_title FROM orders o JOIN skus s ON o.sku_id = s.id WHERE o.buyer_id = ? ORDER BY o.created_at DESC LIMIT ? OFFSET ?`
  ).all(authReq.user!.id, limit, offset);

  res.json({
    success: true,
    data: { items: orders, total, page, limit, totalPages: Math.ceil(total / limit) }
  });
});

router.get('/:id', verifyToken, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const db = getDb();
  const order = db.prepare(
    `SELECT o.*, s.title as sku_title FROM orders o JOIN skus s ON o.sku_id = s.id WHERE o.id = ?`
  ).get(req.params.id) as (Order & { sku_title: string }) | undefined;

  if (!order) {
    res.status(404).json({ success: false, error: '订单不存在' });
    return;
  }

  if (authReq.user!.role !== 'platform_admin' && order.buyer_id !== authReq.user!.id) {
    res.status(403).json({ success: false, error: '无权查看该订单' });
    return;
  }

  res.json({ success: true, data: order });
});

router.post('/:id/confirm', verifyToken, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as Order | undefined;

  if (!order) {
    res.status(404).json({ success: false, error: '订单不存在' });
    return;
  }

  if (order.buyer_id !== authReq.user!.id) {
    res.status(403).json({ success: false, error: '只有买家可以确认收货' });
    return;
  }

  if (order.status !== 'delivered') {
    res.status(400).json({ success: false, error: '订单状态不允许确认收货' });
    return;
  }

  if (order.escrow_status !== 'held') {
    res.status(400).json({ success: false, error: '托管状态异常' });
    return;
  }

  const transaction = db.transaction(() => {
    db.prepare("UPDATE orders SET status = 'confirmed', escrow_status = 'released', confirmed_at = datetime('now') WHERE id = ?").run(order.id);

    if (order.seller_id) {
      const sellerWallet = db.prepare('SELECT * FROM wallets WHERE resident_id = ?').get(order.seller_id) as Wallet | undefined;
      if (sellerWallet) {
        db.prepare('UPDATE wallets SET balance = balance + ?, total_earned = total_earned + ? WHERE resident_id = ?').run(order.total_amount, order.total_amount, order.seller_id);
        db.prepare(
          `INSERT INTO wallet_transactions (wallet_id, type, amount, ref_type, ref_id, description) VALUES (?, 'escrow_in', ?, 'order', ?, ?)`
        ).run(sellerWallet.id, order.total_amount, order.id, `订单${order.id}托管款释放`);
      }
    }

    logFraud(db, 'order', order.id, 'confirm_release_escrow', authReq.user!.id, req);
  });

  transaction();

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
  res.json({ success: true, data: updated });
});

router.post('/:id/refund', verifyToken, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as Order | undefined;

  if (!order) {
    res.status(404).json({ success: false, error: '订单不存在' });
    return;
  }

  if (order.buyer_id !== authReq.user!.id && authReq.user!.role !== 'platform_admin') {
    res.status(403).json({ success: false, error: '只有买家或平台管理员可以申请退款' });
    return;
  }

  if (!['paid', 'shipped'].includes(order.status)) {
    res.status(400).json({ success: false, error: '订单状态不允许退款' });
    return;
  }

  if (order.escrow_status !== 'held') {
    res.status(400).json({ success: false, error: '托管状态异常，无法退款' });
    return;
  }

  const transaction = db.transaction(() => {
    db.prepare("UPDATE orders SET status = 'refunded', escrow_status = 'refunded' WHERE id = ?").run(order.id);

    db.prepare('UPDATE skus SET stock_self = stock_self + ? WHERE id = ?').run(order.quantity, order.sku_id);

    const buyerWallet = db.prepare('SELECT * FROM wallets WHERE resident_id = ?').get(order.buyer_id) as Wallet | undefined;
    if (buyerWallet) {
      db.prepare('UPDATE wallets SET balance = balance + ? WHERE resident_id = ?').run(order.total_amount, order.buyer_id);
      db.prepare(
        `INSERT INTO wallet_transactions (wallet_id, type, amount, ref_type, ref_id, description) VALUES (?, 'refund', ?, 'order', ?, ?)`
      ).run(buyerWallet.id, order.total_amount, order.id, `订单${order.id}退款`);
    }

    logFraud(db, 'order', order.id, 'refund', authReq.user!.id, req);
  });

  transaction();

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
  res.json({ success: true, data: updated });
});

function logFraud(db: any, entityType: string, entityId: number, action: string, actorId: number, req: any): void {
  db.prepare(
    `INSERT INTO fraud_logs (entity_type, entity_id, action, actor_id, actor_role, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(entityType, entityId, action, actorId, (req as AuthenticatedRequest).user!.role, req.ip, req.headers['user-agent'] || null);
}

export default router;

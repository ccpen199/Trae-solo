import { Router } from 'express';
import { getDb } from '../database';
import { verifyToken, requireCommunity, requireRole } from '../middleware/auth';
import type { AuthenticatedRequest, Sku } from '../types';

const router = Router();

router.get('/', verifyToken, requireCommunity, (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;
  const category = req.query.category as string;
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const radiusKm = parseFloat(req.query.radius as string) || 5;
  const communityId = authReq.community!.id;

  const db = getDb();
  let whereClause = 'WHERE community_id = ? AND status = ?';
  const params: any[] = [communityId, 'active'];

  if (category) {
    whereClause += ' AND category = ?';
    params.push(category);
  }

  if (!isNaN(lat) && !isNaN(lng)) {
    whereClause += ' AND lat IS NOT NULL AND lng IS NOT NULL';
  }

  const total = (db.prepare(`SELECT COUNT(*) as cnt FROM skus ${whereClause}`).get(...params) as any).cnt;
  let skus = db.prepare(
    `SELECT * FROM skus ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(...params, limit, offset) as Sku[];

  if (!isNaN(lat) && !isNaN(lng)) {
    skus = skus.filter(sku => {
      if (sku.lat == null || sku.lng == null) return false;
      const dist = haversineKm(lat, lng, sku.lat, sku.lng);
      return dist <= (sku.radius_km || radiusKm);
    });
  }

  res.json({
    success: true,
    data: { items: skus, total, page, limit, totalPages: Math.ceil(total / limit) }
  });
});

router.post('/', verifyToken, requireCommunity, requireRole('property_admin', 'platform_admin'), (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const { title, description, price, original_price, images, category, lat, lng, radius_km, stock_self, stock_property, is_self_operated } = req.body;

  if (!title || price == null) {
    res.status(400).json({ success: false, error: '标题和价格不能为空' });
    return;
  }

  const db = getDb();
  const result = db.prepare(
    `INSERT INTO skus (community_id, title, description, price, original_price, images, category, lat, lng, radius_km, stock_self, stock_property, is_self_operated)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    authReq.community!.id,
    title,
    description || '',
    price,
    original_price || null,
    JSON.stringify(images || []),
    category || '',
    lat || null,
    lng || null,
    radius_km || 5,
    stock_self || 0,
    stock_property || 0,
    is_self_operated ? 1 : 0
  );

  const sku = db.prepare('SELECT * FROM skus WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: sku });
});

router.get('/:id', verifyToken, (req, res) => {
  const db = getDb();
  const sku = db.prepare('SELECT * FROM skus WHERE id = ? AND status = ?').get(req.params.id, 'active');

  if (!sku) {
    res.status(404).json({ success: false, error: '商品不存在' });
    return;
  }

  res.json({ success: true, data: sku });
});

router.put('/:id/stock', verifyToken, requireRole('property_admin', 'platform_admin'), (req, res) => {
  const { stock_self, stock_property } = req.body;

  if (stock_self == null && stock_property == null) {
    res.status(400).json({ success: false, error: '至少需要提供一个库存更新字段' });
    return;
  }

  const db = getDb();
  const sku = db.prepare('SELECT * FROM skus WHERE id = ?').get(req.params.id);

  if (!sku) {
    res.status(404).json({ success: false, error: '商品不存在' });
    return;
  }

  const updates: string[] = [];
  const values: any[] = [];

  if (stock_self != null) { updates.push('stock_self = ?'); values.push(stock_self); }
  if (stock_property != null) { updates.push('stock_property = ?'); values.push(stock_property); }

  values.push(req.params.id);
  db.prepare(`UPDATE skus SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare('SELECT * FROM skus WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
});

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default router;

import { getDb } from '../db/index.js';
import type { Shop, PaginationParams, PaginatedResponse } from '../../shared/types.js';

interface ShopRow {
  id: number;
  name: string;
  city: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  on_time_rate: number;
  bad_review_rate: number;
  repurchase_rate: number;
  delivery_radius: number;
  is_online: number;
  created_at: string;
}

function mapShopRow(row: ShopRow): Shop {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    district: row.district,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    rating: row.rating,
    onTimeRate: row.on_time_rate,
    badReviewRate: row.bad_review_rate,
    repurchaseRate: row.repurchase_rate,
    deliveryRadius: row.delivery_radius,
    isOnline: row.is_online === 1,
    createdAt: row.created_at,
  };
}

export async function getShops(
  params: PaginationParams & { city?: string; district?: string; isOnline?: boolean }
): Promise<PaginatedResponse<Shop>> {
  const db = getDb();
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const values: any[] = [];

  if (params.city) {
    conditions.push('city = ?');
    values.push(params.city);
  }
  if (params.district) {
    conditions.push('district = ?');
    values.push(params.district);
  }
  if (params.isOnline !== undefined) {
    conditions.push('is_online = ?');
    values.push(params.isOnline ? 1 : 0);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM shops ${whereClause}`);
  const { count } = countStmt.get(...values) as { count: number };

  const stmt = db.prepare(`
    SELECT * FROM shops ${whereClause}
    ORDER BY rating DESC, created_at DESC
    LIMIT ? OFFSET ?
  `);
  const rows = stmt.all(...values, pageSize, offset) as ShopRow[];

  return {
    items: rows.map(mapShopRow),
    total: count,
    page,
    pageSize,
  };
}

export async function getShopById(id: number): Promise<Shop | null> {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM shops WHERE id = ?');
  const row = stmt.get(id) as ShopRow | undefined;
  return row ? mapShopRow(row) : null;
}

export async function createShop(data: Omit<Shop, 'id' | 'createdAt' | 'rating'>): Promise<Shop> {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO shops (name, city, district, address, lat, lng, on_time_rate, bad_review_rate, repurchase_rate, delivery_radius, is_online)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.name,
    data.city,
    data.district,
    data.address,
    data.lat,
    data.lng,
    data.onTimeRate,
    data.badReviewRate,
    data.repurchaseRate,
    data.deliveryRadius,
    data.isOnline ? 1 : 0
  );
  return getShopById(Number(result.lastInsertRowid)) as Promise<Shop>;
}

export async function updateShop(id: number, data: Partial<Omit<Shop, 'id' | 'createdAt'>>): Promise<Shop | null> {
  const db = getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.city !== undefined) { fields.push('city = ?'); values.push(data.city); }
  if (data.district !== undefined) { fields.push('district = ?'); values.push(data.district); }
  if (data.address !== undefined) { fields.push('address = ?'); values.push(data.address); }
  if (data.lat !== undefined) { fields.push('lat = ?'); values.push(data.lat); }
  if (data.lng !== undefined) { fields.push('lng = ?'); values.push(data.lng); }
  if (data.onTimeRate !== undefined) { fields.push('on_time_rate = ?'); values.push(data.onTimeRate); }
  if (data.badReviewRate !== undefined) { fields.push('bad_review_rate = ?'); values.push(data.badReviewRate); }
  if (data.repurchaseRate !== undefined) { fields.push('repurchase_rate = ?'); values.push(data.repurchaseRate); }
  if (data.deliveryRadius !== undefined) { fields.push('delivery_radius = ?'); values.push(data.deliveryRadius); }
  if (data.isOnline !== undefined) { fields.push('is_online = ?'); values.push(data.isOnline ? 1 : 0); }

  if (fields.length === 0) return getShopById(id);

  values.push(id);
  const stmt = db.prepare(`UPDATE shops SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  return getShopById(id);
}

export async function deleteShop(id: number): Promise<boolean> {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM shops WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

export async function updateShopRating(id: number): Promise<Shop | null> {
  const db = getDb();
  const shop = await getShopById(id);
  if (!shop) return null;

  const rating = shop.onTimeRate * 0.4 + (1 - shop.badReviewRate) * 0.3 + shop.repurchaseRate * 0.3;
  const finalRating = Math.min(5, Math.max(0, rating * 5));

  const stmt = db.prepare('UPDATE shops SET rating = ? WHERE id = ?');
  stmt.run(finalRating, id);
  return getShopById(id);
}

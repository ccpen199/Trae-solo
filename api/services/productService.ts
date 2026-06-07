import { getDb } from '../db/index.js';
import type { Product, PaginationParams, PaginatedResponse } from '../../shared/types.js';

interface ProductRow {
  id: number;
  shop_id: number;
  shop_name?: string;
  name: string;
  category: 'flower' | 'cake' | 'gift';
  price: number;
  original_price: number;
  image: string;
  description: string;
  festival: string;
  scene: string;
  shelf_life_hours: number;
  delivery_radius: number;
  stock: number;
  created_at: string;
}

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    shopId: row.shop_id,
    shopName: row.shop_name,
    name: row.name,
    category: row.category,
    price: row.price,
    originalPrice: row.original_price,
    image: row.image,
    description: row.description,
    festival: JSON.parse(row.festival || '[]'),
    scene: JSON.parse(row.scene || '[]'),
    shelfLifeHours: row.shelf_life_hours,
    deliveryRadius: row.delivery_radius,
    stock: row.stock,
    createdAt: row.created_at,
  };
}

export interface ProductFilterParams extends PaginationParams {
  festival?: string;
  scene?: string;
  minPrice?: number;
  maxPrice?: number;
  category?: 'flower' | 'cake' | 'gift';
  city?: string;
  district?: string;
  shopId?: number;
  keyword?: string;
}

export async function getProducts(
  params: ProductFilterParams
): Promise<PaginatedResponse<Product>> {
  const db = getDb();
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const values: any[] = [];
  const joins: string[] = [];

  if (params.city || params.district) {
    joins.push('INNER JOIN shops s ON p.shop_id = s.id');
  }

  if (params.festival) {
    conditions.push('p.festival LIKE ?');
    values.push(`%"${params.festival}"%`);
  }
  if (params.scene) {
    conditions.push('p.scene LIKE ?');
    values.push(`%"${params.scene}"%`);
  }
  if (params.minPrice !== undefined) {
    conditions.push('p.price >= ?');
    values.push(params.minPrice);
  }
  if (params.maxPrice !== undefined) {
    conditions.push('p.price <= ?');
    values.push(params.maxPrice);
  }
  if (params.category) {
    conditions.push('p.category = ?');
    values.push(params.category);
  }
  if (params.city) {
    conditions.push('s.city = ?');
    values.push(params.city);
  }
  if (params.district) {
    conditions.push('s.district = ?');
    values.push(params.district);
  }
  if (params.shopId) {
    conditions.push('p.shop_id = ?');
    values.push(params.shopId);
  }
  if (params.keyword) {
    conditions.push('p.name LIKE ? OR p.description LIKE ?');
    values.push(`%${params.keyword}%`, `%${params.keyword}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const joinClause = joins.join(' ');

  const countStmt = db.prepare(`
    SELECT COUNT(DISTINCT p.id) as count 
    FROM products p ${joinClause} ${whereClause}
  `);
  const { count } = countStmt.get(...values) as { count: number };

  const stmt = db.prepare(`
    SELECT p.*, s.name as shop_name 
    FROM products p 
    LEFT JOIN shops s ON p.shop_id = s.id
    ${joinClause.includes('INNER JOIN') ? '' : ''}
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `);
  const rows = stmt.all(...values, pageSize, offset) as ProductRow[];

  return {
    items: rows.map(mapProductRow),
    total: count,
    page,
    pageSize,
  };
}

export async function getProductById(id: number): Promise<Product | null> {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT p.*, s.name as shop_name 
    FROM products p 
    LEFT JOIN shops s ON p.shop_id = s.id 
    WHERE p.id = ?
  `);
  const row = stmt.get(id) as ProductRow | undefined;
  return row ? mapProductRow(row) : null;
}

export async function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'shopName'>): Promise<Product> {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO products (shop_id, name, category, price, original_price, image, description, festival, scene, shelf_life_hours, delivery_radius, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.shopId,
    data.name,
    data.category,
    data.price,
    data.originalPrice,
    data.image,
    data.description,
    JSON.stringify(data.festival),
    JSON.stringify(data.scene),
    data.shelfLifeHours,
    data.deliveryRadius,
    data.stock
  );
  return getProductById(Number(result.lastInsertRowid)) as Promise<Product>;
}

export async function updateProduct(id: number, data: Partial<Omit<Product, 'id' | 'createdAt' | 'shopName'>>): Promise<Product | null> {
  const db = getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (data.shopId !== undefined) { fields.push('shop_id = ?'); values.push(data.shopId); }
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
  if (data.price !== undefined) { fields.push('price = ?'); values.push(data.price); }
  if (data.originalPrice !== undefined) { fields.push('original_price = ?'); values.push(data.originalPrice); }
  if (data.image !== undefined) { fields.push('image = ?'); values.push(data.image); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.festival !== undefined) { fields.push('festival = ?'); values.push(JSON.stringify(data.festival)); }
  if (data.scene !== undefined) { fields.push('scene = ?'); values.push(JSON.stringify(data.scene)); }
  if (data.shelfLifeHours !== undefined) { fields.push('shelf_life_hours = ?'); values.push(data.shelfLifeHours); }
  if (data.deliveryRadius !== undefined) { fields.push('delivery_radius = ?'); values.push(data.deliveryRadius); }
  if (data.stock !== undefined) { fields.push('stock = ?'); values.push(data.stock); }

  if (fields.length === 0) return getProductById(id);

  values.push(id);
  const stmt = db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  return getProductById(id);
}

export async function deleteProduct(id: number): Promise<boolean> {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM products WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

export async function updateProductStock(id: number, quantity: number): Promise<Product | null> {
  const db = getDb();
  const stmt = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
  stmt.run(quantity, id);
  return getProductById(id);
}

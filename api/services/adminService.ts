import { getDb } from '../db/index.js';
import { updateShopRating } from './shopService.js';
import type { Shop, Product, PaginationParams, PaginatedResponse } from '../../shared/types.js';

interface ShopRatingDetail extends Shop {
  ratingDetail: {
    onTimeRateScore: number;
    badReviewRateScore: number;
    repurchaseRateScore: number;
    finalRating: number;
  };
}

interface HotProduct extends Product {
  salesVolume: number;
  salesAmount: number;
}

interface ShopSalesStats {
  shopId: number;
  shopName: string;
  orderCount: number;
  totalAmount: number;
  avgOrderAmount: number;
}

export async function calculateShopRatings(): Promise<ShopRatingDetail[]> {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM shops WHERE is_online = 1');
  const shops = stmt.all() as Array<any>;

  const ratedShops: ShopRatingDetail[] = [];

  for (const shop of shops) {
    const onTimeRateScore = shop.on_time_rate * 0.4;
    const badReviewRateScore = (1 - shop.bad_review_rate) * 0.3;
    const repurchaseRateScore = shop.repurchase_rate * 0.3;
    const finalRating = Math.min(5, Math.max(0, (onTimeRateScore + badReviewRateScore + repurchaseRateScore) * 5));

    const updateStmt = db.prepare('UPDATE shops SET rating = ? WHERE id = ?');
    updateStmt.run(finalRating, shop.id);

    ratedShops.push({
      id: shop.id,
      name: shop.name,
      city: shop.city,
      district: shop.district,
      address: shop.address,
      lat: shop.lat,
      lng: shop.lng,
      rating: finalRating,
      onTimeRate: shop.on_time_rate,
      badReviewRate: shop.bad_review_rate,
      repurchaseRate: shop.repurchase_rate,
      deliveryRadius: shop.delivery_radius,
      isOnline: shop.is_online === 1,
      createdAt: shop.created_at,
      ratingDetail: {
        onTimeRateScore: Math.round(onTimeRateScore * 5 * 100) / 100,
        badReviewRateScore: Math.round(badReviewRateScore * 5 * 100) / 100,
        repurchaseRateScore: Math.round(repurchaseRateScore * 5 * 100) / 100,
        finalRating: Math.round(finalRating * 100) / 100,
      },
    });
  }

  return ratedShops.sort((a, b) => b.rating - a.rating);
}

export async function getShopRatingDetail(shopId: number): Promise<ShopRatingDetail | null> {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM shops WHERE id = ?');
  const shop = stmt.get(shopId) as any;
  if (!shop) return null;

  const onTimeRateScore = shop.on_time_rate * 0.4;
  const badReviewRateScore = (1 - shop.bad_review_rate) * 0.3;
  const repurchaseRateScore = shop.repurchase_rate * 0.3;
  const finalRating = Math.min(5, Math.max(0, (onTimeRateScore + badReviewRateScore + repurchaseRateScore) * 5));

  return {
    id: shop.id,
    name: shop.name,
    city: shop.city,
    district: shop.district,
    address: shop.address,
    lat: shop.lat,
    lng: shop.lng,
    rating: finalRating,
    onTimeRate: shop.on_time_rate,
    badReviewRate: shop.bad_review_rate,
    repurchaseRate: shop.repurchase_rate,
    deliveryRadius: shop.delivery_radius,
    isOnline: shop.is_online === 1,
    createdAt: shop.created_at,
    ratingDetail: {
      onTimeRateScore: Math.round(onTimeRateScore * 5 * 100) / 100,
      badReviewRateScore: Math.round(badReviewRateScore * 5 * 100) / 100,
      repurchaseRateScore: Math.round(repurchaseRateScore * 5 * 100) / 100,
      finalRating: Math.round(finalRating * 100) / 100,
    },
  };
}

export async function getHotProducts(
  params: PaginationParams & {
    city?: string;
    district?: string;
    category?: 'flower' | 'cake' | 'gift';
    startDate?: string;
    endDate?: string;
    limit?: number;
  }
): Promise<PaginatedResponse<HotProduct>> {
  const db = getDb();
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = ["o.status IN ('completed', 'refunded')"];
  const values: any[] = [];

  if (params.city || params.district) {
    conditions.push('s.id IS NOT NULL');
  }
  if (params.city) {
    conditions.push('s.city = ?');
    values.push(params.city);
  }
  if (params.district) {
    conditions.push('s.district = ?');
    values.push(params.district);
  }
  if (params.category) {
    conditions.push('p.category = ?');
    values.push(params.category);
  }
  if (params.startDate) {
    conditions.push('o.created_at >= ?');
    values.push(params.startDate);
  }
  if (params.endDate) {
    conditions.push('o.created_at <= ?');
    values.push(params.endDate);
  }

  const whereClause = conditions.join(' AND ');

  const countStmt = db.prepare(`
    SELECT COUNT(DISTINCT p.id) as count
    FROM order_items oi
    INNER JOIN orders o ON oi.order_id = o.id
    INNER JOIN products p ON oi.product_id = p.id
    LEFT JOIN shops s ON p.shop_id = s.id
    WHERE ${whereClause}
  `);
  const { count } = countStmt.get(...values) as { count: number };

  const stmt = db.prepare(`
    SELECT 
      p.*,
      s.name as shop_name,
      SUM(oi.quantity) as sales_volume,
      SUM(oi.quantity * oi.price) as sales_amount
    FROM order_items oi
    INNER JOIN orders o ON oi.order_id = o.id
    INNER JOIN products p ON oi.product_id = p.id
    LEFT JOIN shops s ON p.shop_id = s.id
    WHERE ${whereClause}
    GROUP BY p.id
    ORDER BY sales_volume DESC, sales_amount DESC
    LIMIT ? OFFSET ?
  `);
  const rows = stmt.all(...values, pageSize, offset) as Array<any>;

  return {
    items: rows.map((row: any) => ({
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
      salesVolume: row.sales_volume || 0,
      salesAmount: Math.round((row.sales_amount || 0) * 100) / 100,
    })),
    total: count,
    page,
    pageSize,
  };
}

export async function getShopSalesRanking(
  params: PaginationParams & {
    city?: string;
    district?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<PaginatedResponse<ShopSalesStats>> {
  const db = getDb();
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = ["o.status IN ('completed', 'refunded')"];
  const values: any[] = [];

  if (params.city) {
    conditions.push('s.city = ?');
    values.push(params.city);
  }
  if (params.district) {
    conditions.push('s.district = ?');
    values.push(params.district);
  }
  if (params.startDate) {
    conditions.push('o.created_at >= ?');
    values.push(params.startDate);
  }
  if (params.endDate) {
    conditions.push('o.created_at <= ?');
    values.push(params.endDate);
  }

  const whereClause = conditions.join(' AND ');

  const countStmt = db.prepare(`
    SELECT COUNT(DISTINCT s.id) as count
    FROM shops s
    LEFT JOIN orders o ON s.id = o.shop_id
    WHERE ${whereClause}
  `);
  const { count } = countStmt.get(...values) as { count: number };

  const stmt = db.prepare(`
    SELECT 
      s.id as shop_id,
      s.name as shop_name,
      COUNT(DISTINCT o.id) as order_count,
      COALESCE(SUM(o.total_amount), 0) as total_amount,
      COALESCE(AVG(o.total_amount), 0) as avg_order_amount
    FROM shops s
    LEFT JOIN orders o ON s.id = o.shop_id
    WHERE ${whereClause}
    GROUP BY s.id
    ORDER BY total_amount DESC, order_count DESC
    LIMIT ? OFFSET ?
  `);
  const rows = stmt.all(...values, pageSize, offset) as Array<any>;

  return {
    items: rows.map((row: any) => ({
      shopId: row.shop_id,
      shopName: row.shop_name,
      orderCount: row.order_count || 0,
      totalAmount: Math.round((row.total_amount || 0) * 100) / 100,
      avgOrderAmount: Math.round((row.avg_order_amount || 0) * 100) / 100,
    })),
    total: count,
    page,
    pageSize,
  };
}

export async function getDashboardStats(): Promise<{
  totalShops: number;
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  pendingClaims: number;
  avgOrderValue: number;
}> {
  const db = getDb();

  const today = new Date().toISOString().split('T')[0];

  const statsStmt = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM shops) as total_shops,
      (SELECT COUNT(*) FROM products) as total_products,
      (SELECT COUNT(*) FROM orders) as total_orders,
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status IN ('completed', 'refunded')) as total_revenue,
      (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = DATE(?)) as today_orders,
      (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) = DATE(?) AND status IN ('completed', 'refunded')) as today_revenue,
      (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
      (SELECT COUNT(*) FROM claims WHERE status = 'pending') as pending_claims,
      (SELECT COALESCE(AVG(total_amount), 0) FROM orders WHERE status IN ('completed', 'refunded')) as avg_order_value
  `);
  const stats = statsStmt.get(today, today) as any;

  return {
    totalShops: stats.total_shops || 0,
    totalProducts: stats.total_products || 0,
    totalOrders: stats.total_orders || 0,
    totalUsers: stats.total_users || 0,
    totalRevenue: Math.round((stats.total_revenue || 0) * 100) / 100,
    todayOrders: stats.today_orders || 0,
    todayRevenue: Math.round((stats.today_revenue || 0) * 100) / 100,
    pendingOrders: stats.pending_orders || 0,
    pendingClaims: stats.pending_claims || 0,
    avgOrderValue: Math.round((stats.avg_order_value || 0) * 100) / 100,
  };
}

export async function updateShopStats(shopId: number): Promise<boolean> {
  const db = getDb();

  const statsStmt = db.prepare(`
    SELECT
      COUNT(*) as total_orders,
      SUM(CASE WHEN o.actual_delivery_time <= o.expected_delivery_time THEN 1 ELSE 0 END) as on_time_orders,
      SUM(CASE WHEN EXISTS (SELECT 1 FROM claims c WHERE c.order_id = o.id AND c.status = 'approved' AND c.type IN ('damaged', 'rejected')) THEN 1 ELSE 0 END) as bad_orders,
      COUNT(DISTINCT o.user_id) as unique_users,
      SUM(CASE WHEN EXISTS (
        SELECT 1 FROM orders o2 
        WHERE o2.user_id = o.user_id AND o2.id != o.id AND o2.status IN ('completed', 'refunded')
      ) THEN 1 ELSE 0 END) as repeat_users
    FROM orders o
    WHERE o.shop_id = ? AND o.status IN ('completed', 'refunded')
  `);
  const stats = statsStmt.get(shopId) as any;

  if (stats.total_orders === 0) {
    await updateShopRating(shopId);
    return true;
  }

  const onTimeRate = stats.on_time_orders / stats.total_orders;
  const badReviewRate = stats.bad_orders / stats.total_orders;
  const repurchaseRate = stats.unique_users > 0 ? stats.repeat_users / stats.unique_users : 0;

  const updateStmt = db.prepare(`
    UPDATE shops 
    SET on_time_rate = ?, bad_review_rate = ?, repurchase_rate = ?
    WHERE id = ?
  `);
  updateStmt.run(onTimeRate, badReviewRate, repurchaseRate, shopId);

  await updateShopRating(shopId);
  return true;
}

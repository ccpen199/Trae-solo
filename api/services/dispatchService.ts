import { getDb } from '../db/index.js';
import type { Shop, Rider, Order, PaginationParams, PaginatedResponse } from '../../shared/types.js';

interface CandidateShop extends Shop {
  distance: number;
  hasStock: boolean;
  score: number;
}

interface CandidateRider extends Rider {
  distance: number;
  currentOrders: number;
  score: number;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function intelligentDispatch(orderId: string): Promise<{
  shop: Shop | null;
  rider: Rider | null;
  reason: string;
}> {
  const db = getDb();

  const orderStmt = db.prepare(`
    SELECT o.*, s.city, s.district 
    FROM orders o
    LEFT JOIN shops s ON o.shop_id = s.id
    WHERE o.id = ?
  `);
  const order = orderStmt.get(orderId) as (Order & { city: string; district: string }) | undefined;

  if (!order) {
    return { shop: null, rider: null, reason: '订单不存在' };
  }

  const itemStmt = db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?');
  const orderItems = itemStmt.all(orderId) as Array<{ product_id: number; quantity: number }>;

  const shopStmt = db.prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM orders o WHERE o.shop_id = s.id AND o.status IN ('accepted', 'preparing', 'picked', 'delivering')) as current_orders
    FROM shops s
    WHERE s.city = ? AND s.district = ? AND s.is_online = 1
  `);
  const shops = shopStmt.all(order.city, order.district) as Array<any>;

  if (shops.length === 0) {
    return { shop: null, rider: null, reason: '同商圈无在线花店' };
  }

  const candidateShops: CandidateShop[] = [];

  for (const shop of shops) {
    const distance = calculateDistance(shop.lat, shop.lng, order.recipientLat, order.recipientLng);

    if (distance > shop.delivery_radius) {
      continue;
    }

    let hasStock = true;
    for (const item of orderItems) {
      const stockStmt = db.prepare(`
        SELECT COALESCE(SUM(quantity), 0) as total_stock
        FROM inventory
        WHERE shop_id = ? AND product_id = ? AND quantity > 0
      `);
      const stock = stockStmt.get(shop.id, item.product_id) as { total_stock: number };
      if (stock.total_stock < item.quantity) {
        hasStock = false;
        break;
      }
    }

    const distanceScore = Math.max(0, 1 - distance / shop.delivery_radius);
    const stockScore = hasStock ? 1 : 0;
    const ratingScore = shop.rating / 5;
    const loadScore = Math.max(0, 1 - (shop.current_orders || 0) / 10);

    const score = distanceScore * 0.4 + stockScore * 0.3 + ratingScore * 0.15 + loadScore * 0.15;

    candidateShops.push({
      id: shop.id,
      name: shop.name,
      city: shop.city,
      district: shop.district,
      address: shop.address,
      lat: shop.lat,
      lng: shop.lng,
      rating: shop.rating,
      onTimeRate: shop.on_time_rate,
      badReviewRate: shop.bad_review_rate,
      repurchaseRate: shop.repurchase_rate,
      deliveryRadius: shop.delivery_radius,
      isOnline: shop.is_online === 1,
      createdAt: shop.created_at,
      distance,
      hasStock,
      score,
    });
  }

  candidateShops.sort((a, b) => b.score - a.score);

  if (candidateShops.length === 0) {
    return { shop: null, rider: null, reason: '无满足条件的花店（距离/库存不满足）' };
  }

  const selectedShop = candidateShops[0];

  const riderStmt = db.prepare(`
    SELECT r.*,
      (SELECT COUNT(*) FROM orders o WHERE o.rider_id = r.id AND o.status = 'delivering') as current_orders
    FROM riders r
    WHERE r.is_online = 1
  `);
  const riders = riderStmt.all() as Array<any>;

  if (riders.length === 0) {
    return { shop: selectedShop, rider: null, reason: '无在岗骑手' };
  }

  const candidateRiders: CandidateRider[] = [];

  for (const rider of riders) {
    const riderLat = rider.current_lat || selectedShop.lat;
    const riderLng = rider.current_lng || selectedShop.lng;
    const distanceToShop = calculateDistance(riderLat, riderLng, selectedShop.lat, selectedShop.lng);

    const distanceScore = Math.max(0, 1 - distanceToShop / 5);
    const loadScore = Math.max(0, 1 - (rider.current_orders || 0) / 5);
    const score = distanceScore * 0.6 + loadScore * 0.4;

    candidateRiders.push({
      id: rider.id,
      name: rider.name,
      phone: rider.phone,
      isOnline: rider.is_online === 1,
      currentLat: rider.current_lat,
      currentLng: rider.current_lng,
      createdAt: rider.created_at,
      distance: distanceToShop,
      currentOrders: rider.current_orders || 0,
      score,
    });
  }

  candidateRiders.sort((a, b) => b.score - a.score);

  const selectedRider = candidateRiders[0];

  const updateOrder = db.prepare(`
    UPDATE orders SET shop_id = ?, rider_id = ?, status = 'accepted' WHERE id = ?
  `);
  updateOrder.run(selectedShop.id, selectedRider.id, orderId);

  const insertLogistics = db.prepare(`
    INSERT INTO logistics_nodes (order_id, type, name, lat, lng, timestamp, status)
    VALUES (?, 'rider', ?, ?, ?, ?, '骑手已接单')
  `);
  insertLogistics.run(
    orderId,
    selectedRider.name,
    selectedShop.lat,
    selectedShop.lng,
    new Date().toISOString()
  );

  return {
    shop: selectedShop,
    rider: selectedRider,
    reason: `智能分单成功：花店${selectedShop.name}（评分${selectedShop.rating.toFixed(1)}，距离${selectedShop.distance.toFixed(2)}km），骑手${selectedRider.name}（距离花店${selectedRider.distance.toFixed(2)}km）`,
  };
}

export async function getRiders(params: PaginationParams & { isOnline?: boolean }): Promise<PaginatedResponse<Rider>> {
  const db = getDb();
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const values: any[] = [];

  if (params.isOnline !== undefined) {
    conditions.push('is_online = ?');
    values.push(params.isOnline ? 1 : 0);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM riders ${whereClause}`);
  const { count } = countStmt.get(...values) as { count: number };

  const stmt = db.prepare(`
    SELECT * FROM riders ${whereClause}
    ORDER BY is_online DESC, created_at DESC
    LIMIT ? OFFSET ?
  `);
  const rows = stmt.all(...values, pageSize, offset) as Array<any>;

  return {
    items: rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      isOnline: row.is_online === 1,
      currentLat: row.current_lat,
      currentLng: row.current_lng,
      createdAt: row.created_at,
    })),
    total: count,
    page,
    pageSize,
  };
}

export async function updateRiderLocation(riderId: number, lat: number, lng: number): Promise<Rider | null> {
  const db = getDb();
  const stmt = db.prepare('UPDATE riders SET current_lat = ?, current_lng = ? WHERE id = ?');
  stmt.run(lat, lng, riderId);

  const getStmt = db.prepare('SELECT * FROM riders WHERE id = ?');
  const row = getStmt.get(riderId) as any;
  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    isOnline: row.is_online === 1,
    currentLat: row.current_lat,
    currentLng: row.current_lng,
    createdAt: row.created_at,
  };
}

export async function recordTemperatureData(orderId: string, temperature: number, lat: number, lng: number): Promise<boolean> {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO logistics_nodes (order_id, type, name, lat, lng, temperature, timestamp, status)
    VALUES (?, 'cold-chain', ?, ?, ?, ?, ?, ?)
  `);
  const status = temperature > 8 ? '温度异常' : temperature > 5 ? '温度偏高' : '温度正常';
  const result = stmt.run(
    orderId,
    '冷链监控点',
    lat,
    lng,
    temperature,
    new Date().toISOString(),
    status
  );
  return result.changes > 0;
}

export async function getTemperatureHistory(orderId: string): Promise<Array<{ timestamp: string; temperature: number; status: string }>> {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT timestamp, temperature, status
    FROM logistics_nodes
    WHERE order_id = ? AND type = 'cold-chain'
    ORDER BY timestamp ASC
  `);
  return stmt.all(orderId) as Array<{ timestamp: string; temperature: number; status: string }>;
}

export async function getPendingOrdersForDispatch(): Promise<Order[]> {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT o.*, s.name as shop_name
    FROM orders o
    LEFT JOIN shops s ON o.shop_id = s.id
    WHERE o.status = 'pending'
    ORDER BY o.created_at ASC
  `);
  const rows = stmt.all() as Array<any>;
  return rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    shopId: row.shop_id,
    shopName: row.shop_name,
    totalAmount: row.total_amount,
    status: row.status,
    recipientName: row.recipient_name,
    recipientPhone: row.recipient_phone,
    recipientAddress: row.recipient_address,
    recipientLat: row.recipient_lat,
    recipientLng: row.recipient_lng,
    deliveryType: row.delivery_type,
    expectedDeliveryTime: row.expected_delivery_time,
    actualDeliveryTime: row.actual_delivery_time,
    riderId: row.rider_id,
    createdAt: row.created_at,
  }));
}

export interface ColdChainVehicle {
  id: string;
  orderId: string;
  riderName: string;
  currentLat: number;
  currentLng: number;
  currentTemperature: number;
  temperatureHistory: Array<{ timestamp: string; temperature: number }>;
  status: 'normal' | 'warning' | 'alert';
  lastUpdate: string;
}

export async function getTemperatureMonitoring(): Promise<ColdChainVehicle[]> {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT DISTINCT 
      ln.order_id,
      o.rider_id,
      r.name as rider_name,
      ln.lat,
      ln.lng,
      ln.temperature,
      ln.timestamp as last_update,
      ln.status
    FROM logistics_nodes ln
    INNER JOIN orders o ON ln.order_id = o.id
    LEFT JOIN riders r ON o.rider_id = r.id
    WHERE ln.type = 'cold-chain' AND o.status = 'delivering'
    ORDER BY ln.timestamp DESC
  `);
  const rows = stmt.all() as Array<any>;
  
  const vehicles: ColdChainVehicle[] = [];
  const seenOrders = new Set<string>();
  
  for (const row of rows) {
    if (seenOrders.has(row.order_id)) continue;
    seenOrders.add(row.order_id);
    
    const historyStmt = db.prepare(`
      SELECT timestamp, temperature
      FROM logistics_nodes
      WHERE order_id = ? AND type = 'cold-chain'
      ORDER BY timestamp ASC
      LIMIT 20
    `);
    const history = historyStmt.all(row.order_id) as Array<{ timestamp: string; temperature: number }>;
    
    const status: 'normal' | 'warning' | 'alert' = 
      row.temperature > 8 ? 'alert' : row.temperature > 5 ? 'warning' : 'normal';
    
    vehicles.push({
      id: `CCV-${row.order_id.slice(-6).toUpperCase()}`,
      orderId: row.order_id,
      riderName: row.rider_name || '未分配',
      currentLat: row.lat,
      currentLng: row.lng,
      currentTemperature: row.temperature,
      temperatureHistory: history,
      status,
      lastUpdate: row.last_update,
    });
  }
  
  return vehicles;
}

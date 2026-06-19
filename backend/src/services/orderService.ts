import { getDb } from '../db';
import { generateOrderNo, nowTimestamp, haversineDistance } from '../utils';
import type { Order, OrderStatus, OrderPlatform } from '../types';

export interface CreateOrderParams {
  platform?: OrderPlatform;
  merchant_name?: string;
  merchant_address?: string;
  merchant_lat?: number;
  merchant_lng?: number;
  recipient_name?: string;
  recipient_phone?: string;
  recipient_address?: string;
  recipient_lat?: number;
  recipient_lng?: number;
  goods_type?: string;
  goods_name?: string;
  weight?: number;
  volume?: number;
  is_special?: boolean;
  special_note?: string;
  pickup_time_start?: number;
  pickup_time_end?: number;
  delivery_time_start?: number;
  delivery_time_end?: number;
  delivery_fee?: number;
  tip_amount?: number;
}

export function createOrder(params: CreateOrderParams): Order {
  const db = getDb();
  const now = nowTimestamp();
  const orderNo = generateOrderNo();

  let distance = 0;
  let duration = 0;
  if (params.merchant_lat && params.merchant_lng && params.recipient_lat && params.recipient_lng) {
    distance = haversineDistance(
      params.merchant_lat,
      params.merchant_lng,
      params.recipient_lat,
      params.recipient_lng
    );
    duration = Math.ceil(distance * 10);
  }

  const totalAmount = (params.delivery_fee || 0) + (params.tip_amount || 0);

  const result = db
    .prepare(
      `INSERT INTO orders 
       (order_no, platform, merchant_name, merchant_address, merchant_lat, merchant_lng,
        recipient_name, recipient_phone, recipient_address, recipient_lat, recipient_lng,
        goods_type, goods_name, weight, volume, is_special, special_note,
        pickup_time_start, pickup_time_end, delivery_time_start, delivery_time_end,
        delivery_fee, tip_amount, total_amount, status, estimated_distance, estimated_duration,
        created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`
    )
    .run(
      orderNo,
      params.platform || 'self',
      params.merchant_name || null,
      params.merchant_address || null,
      params.merchant_lat || null,
      params.merchant_lng || null,
      params.recipient_name || null,
      params.recipient_phone || null,
      params.recipient_address || null,
      params.recipient_lat || null,
      params.recipient_lng || null,
      params.goods_type || 'normal',
      params.goods_name || null,
      params.weight || 0,
      params.volume || 0,
      params.is_special ? 1 : 0,
      params.special_note || null,
      params.pickup_time_start || null,
      params.pickup_time_end || null,
      params.delivery_time_start || null,
      params.delivery_time_end || null,
      params.delivery_fee || 0,
      params.tip_amount || 0,
      totalAmount,
      distance,
      duration,
      now,
      now
    );

  return db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid) as Order;
}

export function getOrderList(params?: {
  status?: OrderStatus;
  platform?: OrderPlatform;
  rider_id?: number;
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}): { list: Order[]; total: number } {
  const db = getDb();
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 20;
  const offset = (page - 1) * pageSize;

  let whereClauses: string[] = [];
  let queryParams: any[] = [];

  if (params?.status) {
    whereClauses.push('status = ?');
    queryParams.push(params.status);
  }
  if (params?.platform) {
    whereClauses.push('platform = ?');
    queryParams.push(params.platform);
  }
  if (params?.rider_id) {
    whereClauses.push('assigned_rider_id = ?');
    queryParams.push(params.rider_id);
  }
  if (params?.startDate) {
    whereClauses.push('created_at >= ?');
    queryParams.push(new Date(params.startDate).getTime() / 1000);
  }
  if (params?.endDate) {
    whereClauses.push('created_at <= ?');
    queryParams.push(new Date(params.endDate).getTime() / 1000 + 86400);
  }

  const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

  const total = db
    .prepare(`SELECT COUNT(*) as count FROM orders ${whereSql}`)
    .get(...queryParams) as { count: number };

  const list = db
    .prepare(
      `SELECT * FROM orders ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`
    )
    .all(...queryParams, pageSize, offset) as Order[];

  return { list, total: total.count };
}

export function getOrderById(id: number): Order | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Order | undefined;
}

export function getOrderByNo(orderNo: string): Order | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM orders WHERE order_no = ?').get(orderNo) as Order | undefined;
}

export function updateOrderStatus(orderId: number, status: OrderStatus, data?: any): boolean {
  const db = getDb();
  const now = nowTimestamp();

  const updates: string[] = ['status = ?', 'updated_at = ?'];
  const params: any[] = [status, now];

  if (status === 'picking' && data?.picked_at) {
    updates.push('picked_at = ?');
    params.push(data.picked_at);
  }
  if (status === 'delivered' && data?.delivered_at) {
    updates.push('delivered_at = ?');
    params.push(data.delivered_at);
  }
  if (status === 'cancelled') {
    if (data?.cancelled_at) {
      updates.push('cancelled_at = ?');
      params.push(data.cancelled_at);
    }
    if (data?.cancel_reason) {
      updates.push('cancel_reason = ?');
      params.push(data.cancel_reason);
    }
  }

  params.push(orderId);
  const sql = `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`;

  const result = db.prepare(sql).run(...params);
  return result.changes > 0;
}

export function getPendingOrders(): Order[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at ASC")
    .all() as Order[];
}

export function getPlatformOrderStats(): Record<string, number> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT platform, COUNT(*) as count FROM orders 
       WHERE created_at >= ? 
       GROUP BY platform`
    )
    .all(nowTimestamp() - 86400) as { platform: string; count: number }[];

  const result: Record<string, number> = { self: 0, meituan: 0, eleme: 0 };
  for (const row of rows) {
    result[row.platform] = row.count;
  }
  return result;
}

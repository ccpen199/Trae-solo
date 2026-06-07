import { getDb } from '../db/index.js';
import type { Order, OrderItem, LogisticsNode, OrderStatus, PaginationParams, PaginatedResponse } from '../../shared/types.js';

interface OrderRow {
  id: string;
  user_id: number;
  shop_id: number;
  shop_name?: string;
  total_amount: number;
  status: OrderStatus;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_lat: number;
  recipient_lng: number;
  delivery_type: 'instant' | 'next-day';
  expected_delivery_time: string;
  actual_delivery_time?: string;
  rider_id?: number;
  rider_name?: string;
  created_at: string;
}

interface OrderItemRow {
  id: number;
  order_id: string;
  product_id: number;
  product_name?: string;
  product_image?: string;
  quantity: number;
  price: number;
}

interface LogisticsNodeRow {
  id: number;
  order_id: string;
  type: 'sorting' | 'rider' | 'cold-chain';
  name: string;
  lat: number;
  lng: number;
  temperature?: number;
  timestamp: string;
  status: string;
}

function mapOrderRow(row: OrderRow): Order {
  return {
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
    riderName: row.rider_name,
    createdAt: row.created_at,
  };
}

function mapOrderItemRow(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productName: row.product_name,
    productImage: row.product_image,
    quantity: row.quantity,
    price: row.price,
  };
}

function mapLogisticsNodeRow(row: LogisticsNodeRow): LogisticsNode {
  return {
    id: row.id,
    orderId: row.order_id,
    type: row.type,
    name: row.name,
    lat: row.lat,
    lng: row.lng,
    temperature: row.temperature,
    timestamp: row.timestamp,
    status: row.status,
  };
}

function generateOrderId(): string {
  const now = new Date();
  const timestamp = now.getTime().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `FL${timestamp}${random}`;
}

export interface CreateOrderData {
  userId: number;
  shopId: number;
  items: Array<{ productId: number; quantity: number }>;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientLat: number;
  recipientLng: number;
  deliveryType: 'instant' | 'next-day';
  expectedDeliveryTime: string;
}

export async function getOrders(
  params: PaginationParams & {
    userId?: number;
    shopId?: number;
    status?: OrderStatus;
    riderId?: number;
  }
): Promise<PaginatedResponse<Order>> {
  const db = getDb();
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const values: any[] = [];

  if (params.userId) {
    conditions.push('o.user_id = ?');
    values.push(params.userId);
  }
  if (params.shopId) {
    conditions.push('o.shop_id = ?');
    values.push(params.shopId);
  }
  if (params.status) {
    conditions.push('o.status = ?');
    values.push(params.status);
  }
  if (params.riderId) {
    conditions.push('o.rider_id = ?');
    values.push(params.riderId);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM orders o ${whereClause}`);
  const { count } = countStmt.get(...values) as { count: number };

  const stmt = db.prepare(`
    SELECT o.*, s.name as shop_name, r.name as rider_name
    FROM orders o
    LEFT JOIN shops s ON o.shop_id = s.id
    LEFT JOIN riders r ON o.rider_id = r.id
    ${whereClause}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `);
  const rows = stmt.all(...values, pageSize, offset) as OrderRow[];

  return {
    items: rows.map(mapOrderRow),
    total: count,
    page,
    pageSize,
  };
}

export async function getOrderById(id: string): Promise<(Order & { items?: OrderItem[] }) | null> {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT o.*, s.name as shop_name, r.name as rider_name
    FROM orders o
    LEFT JOIN shops s ON o.shop_id = s.id
    LEFT JOIN riders r ON o.rider_id = r.id
    WHERE o.id = ?
  `);
  const row = stmt.get(id) as OrderRow | undefined;
  if (!row) return null;

  const order = mapOrderRow(row);

  const itemsStmt = db.prepare(`
    SELECT oi.*, p.name as product_name, p.image as product_image
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `);
  const itemRows = itemsStmt.all(id) as OrderItemRow[];
  order.items = itemRows.map(mapOrderItemRow);

  return order;
}

export async function createOrder(data: CreateOrderData): Promise<Order & { items?: OrderItem[] }> {
  const db = getDb();
  const orderId = generateOrderId();

  let totalAmount = 0;
  const itemDetails: Array<{ productId: number; quantity: number; price: number }> = [];

  for (const item of data.items) {
    const productStmt = db.prepare('SELECT price, stock FROM products WHERE id = ?');
    const product = productStmt.get(item.productId) as { price: number; stock: number } | undefined;
    if (!product) throw new Error(`Product ${item.productId} not found`);
    if (product.stock < item.quantity) throw new Error(`Product ${item.productId} out of stock`);

    totalAmount += product.price * item.quantity;
    itemDetails.push({ productId: item.productId, quantity: item.quantity, price: product.price });
  }

  const insertOrder = db.prepare(`
    INSERT INTO orders (id, user_id, shop_id, total_amount, status, recipient_name, recipient_phone, recipient_address, recipient_lat, recipient_lng, delivery_type, expected_delivery_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, quantity, price)
    VALUES (?, ?, ?, ?)
  `);

  const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

  const transaction = db.transaction(() => {
    insertOrder.run(
      orderId,
      data.userId,
      data.shopId,
      totalAmount,
      'pending',
      data.recipientName,
      data.recipientPhone,
      data.recipientAddress,
      data.recipientLat,
      data.recipientLng,
      data.deliveryType,
      data.expectedDeliveryTime
    );

    for (const item of itemDetails) {
      insertItem.run(orderId, item.productId, item.quantity, item.price);
      updateStock.run(item.quantity, item.productId);
    }
  });

  transaction();
  return getOrderById(orderId) as Promise<Order & { items?: OrderItem[] }>;
}

export async function updateOrderStatus(id: string, status: OrderStatus, riderId?: number): Promise<Order | null> {
  const db = getDb();
  const fields: string[] = ['status = ?'];
  const values: any[] = [status];

  if (riderId !== undefined) {
    fields.push('rider_id = ?');
    values.push(riderId);
  }

  if (status === 'completed') {
    fields.push('actual_delivery_time = ?');
    values.push(new Date().toISOString());
  }

  values.push(id);
  const stmt = db.prepare(`UPDATE orders SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return getOrderById(id);
}

export async function addLogisticsNode(data: Omit<LogisticsNode, 'id'>): Promise<LogisticsNode> {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO logistics_nodes (order_id, type, name, lat, lng, temperature, timestamp, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.orderId,
    data.type,
    data.name,
    data.lat,
    data.lng,
    data.temperature,
    data.timestamp,
    data.status
  );
  return getLogisticsNodeById(Number(result.lastInsertRowid)) as Promise<LogisticsNode>;
}

export async function getLogisticsNodeById(id: number): Promise<LogisticsNode | null> {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM logistics_nodes WHERE id = ?');
  const row = stmt.get(id) as LogisticsNodeRow | undefined;
  return row ? mapLogisticsNodeRow(row) : null;
}

export async function getOrderLogistics(orderId: string): Promise<LogisticsNode[]> {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM logistics_nodes WHERE order_id = ? ORDER BY timestamp ASC');
  const rows = stmt.all(orderId) as LogisticsNodeRow[];
  return rows.map(mapLogisticsNodeRow);
}

export async function deleteOrder(id: string): Promise<boolean> {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM orders WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

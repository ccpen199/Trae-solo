import { getDb } from '../db/index.js';
import type { Inventory, Wastage, PaginationParams, PaginatedResponse } from '../../shared/types.js';

interface InventoryRow {
  id: number;
  shop_id: number;
  product_id: number;
  batch_no: string;
  quantity: number;
  temperature: number;
  humidity: number;
  inbound_time: string;
  expiry_time: string;
}

interface WastageRow {
  id: number;
  shop_id: number;
  product_id: number;
  product_name?: string;
  batch_no: string;
  quantity: number;
  reason: string;
  recorded_at: string;
}

function mapInventoryRow(row: InventoryRow): Inventory {
  return {
    id: row.id,
    shopId: row.shop_id,
    productId: row.product_id,
    batchNo: row.batch_no,
    quantity: row.quantity,
    temperature: row.temperature,
    humidity: row.humidity,
    inboundTime: row.inbound_time,
    expiryTime: row.expiry_time,
  };
}

function mapWastageRow(row: WastageRow): Wastage {
  return {
    id: row.id,
    shopId: row.shop_id,
    productId: row.product_id,
    productName: row.product_name,
    batchNo: row.batch_no,
    quantity: row.quantity,
    reason: row.reason,
    recordedAt: row.recorded_at,
  };
}

export async function getInventory(
  params: PaginationParams & {
    shopId?: number;
    productId?: number;
    batchNo?: string;
  }
): Promise<PaginatedResponse<Inventory>> {
  const db = getDb();
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const values: any[] = [];

  if (params.shopId) {
    conditions.push('shop_id = ?');
    values.push(params.shopId);
  }
  if (params.productId) {
    conditions.push('product_id = ?');
    values.push(params.productId);
  }
  if (params.batchNo) {
    conditions.push('batch_no = ?');
    values.push(params.batchNo);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM inventory ${whereClause}`);
  const { count } = countStmt.get(...values) as { count: number };

  const stmt = db.prepare(`
    SELECT * FROM inventory ${whereClause}
    ORDER BY inbound_time DESC
    LIMIT ? OFFSET ?
  `);
  const rows = stmt.all(...values, pageSize, offset) as InventoryRow[];

  return {
    items: rows.map(mapInventoryRow),
    total: count,
    page,
    pageSize,
  };
}

export async function getInventoryById(id: number): Promise<Inventory | null> {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM inventory WHERE id = ?');
  const row = stmt.get(id) as InventoryRow | undefined;
  return row ? mapInventoryRow(row) : null;
}

export async function createInventory(data: Omit<Inventory, 'id'>): Promise<Inventory> {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO inventory (shop_id, product_id, batch_no, quantity, temperature, humidity, inbound_time, expiry_time)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.shopId,
    data.productId,
    data.batchNo,
    data.quantity,
    data.temperature,
    data.humidity,
    data.inboundTime,
    data.expiryTime
  );

  const updateProductStock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
  updateProductStock.run(data.quantity, data.productId);

  return getInventoryById(Number(result.lastInsertRowid)) as Promise<Inventory>;
}

export async function updateInventory(id: number, data: Partial<Omit<Inventory, 'id' | 'shopId' | 'productId' | 'batchNo' | 'inboundTime'>>): Promise<Inventory | null> {
  const db = getDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (data.quantity !== undefined) {
    const currentStmt = db.prepare('SELECT quantity FROM inventory WHERE id = ?');
    const current = currentStmt.get(id) as { quantity: number } | undefined;
    if (current) {
      const diff = data.quantity - current.quantity;
      const invStmt = db.prepare('SELECT product_id FROM inventory WHERE id = ?');
      const inv = invStmt.get(id) as { product_id: number } | undefined;
      if (inv) {
        const updateStock = db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?');
        updateStock.run(diff, inv.product_id);
      }
    }
    fields.push('quantity = ?');
    values.push(data.quantity);
  }
  if (data.temperature !== undefined) { fields.push('temperature = ?'); values.push(data.temperature); }
  if (data.humidity !== undefined) { fields.push('humidity = ?'); values.push(data.humidity); }
  if (data.expiryTime !== undefined) { fields.push('expiry_time = ?'); values.push(data.expiryTime); }

  if (fields.length === 0) return getInventoryById(id);

  values.push(id);
  const stmt = db.prepare(`UPDATE inventory SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  return getInventoryById(id);
}

export async function recordWastage(data: Omit<Wastage, 'id' | 'recordedAt'>): Promise<Wastage> {
  const db = getDb();

  const transaction = db.transaction(() => {
    const invStmt = db.prepare(`
      SELECT id, quantity FROM inventory 
      WHERE shop_id = ? AND product_id = ? AND batch_no = ?
      ORDER BY inbound_time ASC
      LIMIT 1
    `);
    const inventory = invStmt.get(data.shopId, data.productId, data.batchNo) as { id: number; quantity: number } | undefined;

    if (!inventory) throw new Error('Inventory record not found');
    if (inventory.quantity < data.quantity) throw new Error('Insufficient inventory quantity');

    const updateInv = db.prepare('UPDATE inventory SET quantity = quantity - ? WHERE id = ?');
    updateInv.run(data.quantity, inventory.id);

    const updateProduct = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
    updateProduct.run(data.quantity, data.productId);

    const insertStmt = db.prepare(`
      INSERT INTO wastage (shop_id, product_id, batch_no, quantity, reason)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = insertStmt.run(data.shopId, data.productId, data.batchNo, data.quantity, data.reason);
    return result.lastInsertRowid;
  });

  const wastageId = transaction();
  return getWastageById(Number(wastageId)) as Promise<Wastage>;
}

export async function getWastageById(id: number): Promise<Wastage | null> {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT w.*, p.name as product_name
    FROM wastage w
    LEFT JOIN products p ON w.product_id = p.id
    WHERE w.id = ?
  `);
  const row = stmt.get(id) as WastageRow | undefined;
  return row ? mapWastageRow(row) : null;
}

export async function getWastageList(
  params: PaginationParams & {
    shopId?: number;
    productId?: number;
    startDate?: string;
    endDate?: string;
  }
): Promise<PaginatedResponse<Wastage>> {
  const db = getDb();
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const values: any[] = [];

  if (params.shopId) {
    conditions.push('w.shop_id = ?');
    values.push(params.shopId);
  }
  if (params.productId) {
    conditions.push('w.product_id = ?');
    values.push(params.productId);
  }
  if (params.startDate) {
    conditions.push('w.recorded_at >= ?');
    values.push(params.startDate);
  }
  if (params.endDate) {
    conditions.push('w.recorded_at <= ?');
    values.push(params.endDate);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM wastage w ${whereClause}`);
  const { count } = countStmt.get(...values) as { count: number };

  const stmt = db.prepare(`
    SELECT w.*, p.name as product_name
    FROM wastage w
    LEFT JOIN products p ON w.product_id = p.id
    ${whereClause}
    ORDER BY w.recorded_at DESC
    LIMIT ? OFFSET ?
  `);
  const rows = stmt.all(...values, pageSize, offset) as WastageRow[];

  return {
    items: rows.map(mapWastageRow),
    total: count,
    page,
    pageSize,
  };
}

export async function deleteInventory(id: number): Promise<boolean> {
  const db = getDb();
  const invStmt = db.prepare('SELECT quantity, product_id FROM inventory WHERE id = ?');
  const inv = invStmt.get(id) as { quantity: number; product_id: number } | undefined;
  if (inv) {
    const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');
    updateStock.run(inv.quantity, inv.product_id);
  }
  const stmt = db.prepare('DELETE FROM inventory WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

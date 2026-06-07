import db from '../database';
import { formatDevice } from './deviceService';

export function getGisHeatmapData(): any[] {
  return db.prepare(`
    SELECT d.id, d.lat, d.lng, d.status, d.type,
           COUNT(o.id) as order_count,
           COALESCE(SUM(o.total_cost), 0) as revenue
    FROM devices d
    LEFT JOIN orders o ON o.device_id = d.id
    WHERE d.lat IS NOT NULL AND d.lng IS NOT NULL
    GROUP BY d.id
  `).all();
}

export function getAdminDeviceList(page: number = 1, pageSize: number = 10, filters: any = {}): { list: any[]; total: number } {
  let where = 'WHERE 1=1';
  const params: any[] = [];

  if (filters.type) {
    where += ' AND d.type = ?';
    params.push(filters.type);
  }
  if (filters.status) {
    where += ' AND d.status = ?';
    params.push(filters.status);
  }
  if (filters.property_id) {
    where += ' AND d.property_id = ?';
    params.push(filters.property_id);
  }

  const countSql = `SELECT COUNT(*) as total FROM devices d ${where}`;
  const total = (db.prepare(countSql).get(...params) as any).total;

  const listSql = `
    SELECT d.*, p.name as property_name, m.name as manufacturer_name
    FROM devices d
    LEFT JOIN properties p ON d.property_id = p.id
    LEFT JOIN manufacturers m ON d.manufacturer_id = m.id
    ${where}
    ORDER BY d.id DESC
    LIMIT ? OFFSET ?
  `;
  params.push(pageSize, (page - 1) * pageSize);
  const list = db.prepare(listSql).all(...params).map(formatDevice);

  return { list, total };
}

export function createDevice(data: any): number {
  const result = db.prepare(`
    INSERT INTO devices (device_no, qr_code, name, type, location, address, lat, lng, property_id, manufacturer_id, firmware_version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.device_no,
    data.qr_code,
    data.name,
    data.type,
    data.location,
    data.address,
    data.lat,
    data.lng,
    data.property_id,
    data.manufacturer_id,
    data.firmware_version || 'v1.0.0'
  );
  return result.lastInsertRowid as number;
}

export function updateDevice(id: number, data: any): boolean {
  const result = db.prepare(`
    UPDATE devices SET
      device_no = COALESCE(?, device_no),
      name = COALESCE(?, name),
      type = COALESCE(?, type),
      status = COALESCE(?, status),
      location = COALESCE(?, location),
      address = COALESCE(?, address),
      lat = COALESCE(?, lat),
      lng = COALESCE(?, lng),
      property_id = COALESCE(?, property_id),
      manufacturer_id = COALESCE(?, manufacturer_id),
      firmware_version = COALESCE(?, firmware_version)
    WHERE id = ?
  `).run(
    data.device_no,
    data.name,
    data.type,
    data.status,
    data.location,
    data.address,
    data.lat,
    data.lng,
    data.property_id,
    data.manufacturer_id,
    data.firmware_version,
    id
  );
  return result.changes > 0;
}

export function getWorkOrders(status?: string): any[] {
  let sql = `
    SELECT w.*, d.name as device_name, d.device_no,
           u1.nickname as reporter_name, u2.nickname as handler_name,
           COALESCE(w.fault_code, '维修工单') as title,
           d.id as deviceId,
           d.name as deviceName,
           u2.nickname as technicianName,
           u1.nickname as creatorName,
           w.created_at as createdAt,
           w.resolved_at as resolvedAt
    FROM work_orders w
    LEFT JOIN devices d ON w.device_id = d.id
    LEFT JOIN users u1 ON w.reporter_id = u1.id
    LEFT JOIN users u2 ON w.handler_id = u2.id
  `;
  const params: any[] = [];

  if (status) {
    sql += ' WHERE w.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY w.created_at DESC';
  return db.prepare(sql).all(...params);
}

export function assignWorkOrder(id: number, handlerId: number): boolean {
  const propertyOrderNo = `WO${Date.now()}`;
  const result = db.prepare(`
    UPDATE work_orders
    SET handler_id = ?, property_order_no = ?, status = 'assigned'
    WHERE id = ?
  `).run(handlerId, propertyOrderNo, id);
  return result.changes > 0;
}

export function getEnergyReport(startDate: string, endDate: string): any[] {
  return db.prepare(`
    SELECT e.*, d.name as device_name, d.device_no, p.name as property_name
    FROM energy_stats e
    LEFT JOIN devices d ON e.device_id = d.id
    LEFT JOIN properties p ON d.property_id = p.id
    WHERE e.date BETWEEN ? AND ?
    ORDER BY e.date DESC
  `).all(startDate, endDate);
}

export function getSettlementBills(): any[] {
  return db.prepare(`
    SELECT s.*, p.name as property_name
    FROM settlement_bills s
    LEFT JOIN properties p ON s.property_id = p.id
    ORDER BY s.created_at DESC
  `).all().map((row: any) => ({
    ...row,
    period: `${row.period_start || ''} - ${row.period_end || ''}`.trim(),
    totalOrders: row.total_runs || 0,
    totalRevenue: row.total_revenue || 0,
    powerCost: Math.round((row.total_revenue || 0) * 0.08),
    waterCost: Math.round((row.total_revenue || 0) * 0.04),
    maintenanceCost: Math.round((row.total_revenue || 0) * 0.03),
    netProfit: row.settlement_amount || row.total_revenue || 0,
    propertyName: row.property_name,
    createdAt: row.created_at
  }));
}

export function getAlerts(status?: string): any[] {
  let sql = `
    SELECT a.*, d.name as device_name, d.device_no,
           d.id as deviceId,
           d.name as deviceName,
           a.type as typeName,
           a.triggered_at as createdAt,
           a.resolved_at as handledAt
    FROM alerts a
    LEFT JOIN devices d ON a.device_id = d.id
  `;
  const params: any[] = [];

  if (status) {
    sql += ' WHERE a.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY a.triggered_at DESC';
  return db.prepare(sql).all(...params);
}

export function resolveAlert(id: number): boolean {
  const result = db.prepare(`
    UPDATE alerts SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id);
  return result.changes > 0;
}

export function getBrandConfig(propertyId?: number): any {
  const sql = propertyId
    ? 'SELECT * FROM brand_configs WHERE property_id = ? OR property_id IS NULL ORDER BY property_id IS NULL ASC LIMIT 1'
    : 'SELECT * FROM brand_configs WHERE property_id IS NULL LIMIT 1';

  const config = propertyId
    ? db.prepare(sql).get(propertyId)
    : db.prepare(sql).get();

  if (!config) return null;
  return {
    ...config,
    brandName: (config as any).app_name,
    brandLogo: (config as any).logo_url,
    brandSlogan: (config as any).welcome_text,
    primaryColor: (config as any).primary_color
  };
}

export function updateBrandConfig(id: number, data: any): boolean {
  const result = db.prepare(`
    UPDATE brand_configs SET
      primary_color = COALESCE(?, primary_color),
      logo_url = COALESCE(?, logo_url),
      app_name = COALESCE(?, app_name),
      welcome_text = COALESCE(?, welcome_text)
    WHERE id = ?
  `).run(data.primary_color, data.logo_url, data.app_name, data.welcome_text, id);
  return result.changes > 0;
}

export function getPropertyList(): any[] {
  return db.prepare('SELECT * FROM properties ORDER BY id').all();
}

export function getManufacturerList(): any[] {
  return db.prepare('SELECT * FROM manufacturers ORDER BY id').all();
}

export function getProgramList(): any[] {
  return db.prepare('SELECT * FROM programs ORDER BY id').all();
}

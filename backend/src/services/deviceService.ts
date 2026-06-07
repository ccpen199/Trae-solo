import db from '../database';

export interface Device {
  id: number;
  device_no: string;
  qr_code: string;
  name: string;
  type: string;
  status: string;
  lock_status: number;
  location: string;
  address: string;
  lat: number;
  lng: number;
  property_id: number;
  manufacturer_id: number;
  firmware_version: string;
  last_online: string;
  power_consumption: number;
  water_consumption: number;
  created_at: string;
  property_name?: string;
  manufacturer_name?: string;
}

export interface DeviceListOptions {
  type?: string;
  status?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface DeviceListResult {
  list: any[];
  total: number;
}

export function formatDevice(device: any): any {
  if (!device) return null;

  const currentOrder = db.prepare(`
    SELECT o.*, p.name as program_name, p.duration_minutes
    FROM orders o
    LEFT JOIN programs p ON o.program_id = p.id
    WHERE o.device_id = ? AND o.order_status IN ('created', 'running', 'paused')
    ORDER BY o.created_at DESC
    LIMIT 1
  `).get(device.id) as any;

  const latestReport = db.prepare(`
    SELECT remain_time
    FROM device_reports
    WHERE device_id = ?
    ORDER BY reported_at DESC
    LIMIT 1
  `).get(device.id) as any;

  const startedAt = currentOrder?.start_time ? new Date(currentOrder.start_time).getTime() : 0;
  const duration = currentOrder?.duration_minutes || 0;
  const elapsedMinutes = startedAt ? Math.floor((Date.now() - startedAt) / 60000) : 0;
  const computedRemaining = duration ? Math.max(duration - elapsedMinutes, 0) : undefined;

  return {
    ...device,
    code: device.device_no,
    deviceNo: device.device_no,
    qrCode: device.qr_code,
    lockStatus: device.lock_status,
    propertyId: device.property_id,
    manufacturerId: device.manufacturer_id,
    propertyName: device.property_name,
    manufacturerName: device.manufacturer_name,
    firmwareVersion: device.firmware_version,
    lastOnline: device.last_online,
    lastMaintenance: device.last_maintenance,
    powerConsumption: device.power_consumption,
    waterConsumption: device.water_consumption,
    currentProgram: currentOrder?.program_name,
    remainingTime: latestReport?.remain_time ?? computedRemaining,
    createdAt: device.created_at
  };
}

export function getDeviceList(type?: string, status?: string): Device[] {
  let sql = `
    SELECT d.*, p.name as property_name, m.name as manufacturer_name
    FROM devices d
    LEFT JOIN properties p ON d.property_id = p.id
    LEFT JOIN manufacturers m ON d.manufacturer_id = m.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (type) {
    sql += ' AND d.type = ?';
    params.push(type);
  }
  if (status) {
    sql += ' AND d.status = ?';
    params.push(status);
  }

  sql += ' ORDER BY d.id DESC';
  return (db.prepare(sql).all(...params) as Device[]).map(formatDevice);
}

export function getDeviceListResult(options: DeviceListOptions = {}): DeviceListResult {
  let where = 'WHERE 1=1';
  const params: any[] = [];

  if (options.type) {
    where += ' AND d.type = ?';
    params.push(options.type);
  }
  if (options.status) {
    where += ' AND d.status = ?';
    params.push(options.status);
  }
  if (options.keyword) {
    where += ' AND (d.name LIKE ? OR d.device_no LIKE ? OR d.location LIKE ? OR d.address LIKE ?)';
    const keyword = `%${options.keyword}%`;
    params.push(keyword, keyword, keyword, keyword);
  }

  const total = (db.prepare(`SELECT COUNT(*) as total FROM devices d ${where}`).get(...params) as any).total as number;
  const page = Math.max(options.page || 1, 1);
  const pageSize = Math.max(options.pageSize || total || 20, 1);

  const list = (db.prepare(`
    SELECT d.*, p.name as property_name, m.name as manufacturer_name
    FROM devices d
    LEFT JOIN properties p ON d.property_id = p.id
    LEFT JOIN manufacturers m ON d.manufacturer_id = m.id
    ${where}
    ORDER BY d.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, (page - 1) * pageSize) as any[]).map(formatDevice);

  return { list, total };
}

export function getDeviceById(id: number): Device | null {
  const sql = `
    SELECT d.*, p.name as property_name, m.name as manufacturer_name
    FROM devices d
    LEFT JOIN properties p ON d.property_id = p.id
    LEFT JOIN manufacturers m ON d.manufacturer_id = m.id
    WHERE d.id = ?
  `;
  const device = db.prepare(sql).get(id) as Device;
  return formatDevice(device) || null;
}

export function getDeviceByQrCode(qrCode: string): Device | null {
  const sql = `
    SELECT d.*, p.name as property_name, m.name as manufacturer_name
    FROM devices d
    LEFT JOIN properties p ON d.property_id = p.id
    LEFT JOIN manufacturers m ON d.manufacturer_id = m.id
    WHERE d.qr_code = ?
  `;
  const device = db.prepare(sql).get(qrCode) as Device;
  return formatDevice(device) || null;
}

export function getDeviceByCode(code: string): Device | null {
  const sql = `
    SELECT d.*, p.name as property_name, m.name as manufacturer_name
    FROM devices d
    LEFT JOIN properties p ON d.property_id = p.id
    LEFT JOIN manufacturers m ON d.manufacturer_id = m.id
    WHERE d.device_no = ? OR d.qr_code = ?
  `;
  const device = db.prepare(sql).get(code, code) as Device;
  return formatDevice(device) || null;
}

export function getDeviceStatus(id: number): any {
  const device = getDeviceById(id);
  if (!device) return null;

  const latestReport = db.prepare(`
    SELECT * FROM device_reports
    WHERE device_id = ?
    ORDER BY reported_at DESC
    LIMIT 1
  `).get(id);

  const currentOrder = db.prepare(`
    SELECT o.*, p.name as program_name
    FROM orders o
    LEFT JOIN programs p ON o.program_id = p.id
    WHERE o.device_id = ? AND o.order_status IN ('created', 'running', 'paused')
    ORDER BY o.created_at DESC
    LIMIT 1
  `).get(id);

  const programs = db.prepare(`
    SELECT * FROM programs WHERE device_type = ?
  `).all(device.type);

  return {
    device: formatDevice(device),
    latestReport,
    currentOrder,
    programs
  };
}

export function updateDeviceStatus(id: number, status: string): boolean {
  const result = db.prepare('UPDATE devices SET status = ?, last_online = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  return result.changes > 0;
}

export function getDeviceStats(): any {
  const totalDevices = (db.prepare('SELECT COUNT(*) as total FROM devices').get() as any).total as number;
  const rows = db.prepare('SELECT status, COUNT(*) as count FROM devices GROUP BY status').all() as any[];
  const byStatus = rows.reduce((acc: Record<string, number>, row) => {
    acc[row.status] = row.count;
    return acc;
  }, {});

  return {
    totalDevices,
    onlineDevices: totalDevices,
    idleDevices: byStatus.idle || 0,
    runningDevices: byStatus.running || 0,
    faultDevices: byStatus.fault || 0,
    maintenanceDevices: byStatus.maintenance || 0,
    byStatus
  };
}

export function getDeviceHeatmap(): any[] {
  return db.prepare(`
    SELECT d.id as deviceId, d.name as deviceName, d.lat, d.lng, d.status,
           MIN(100, 20 + COUNT(o.id) * 10) as intensity
    FROM devices d
    LEFT JOIN orders o ON o.device_id = d.id
    WHERE d.lat IS NOT NULL AND d.lng IS NOT NULL
    GROUP BY d.id
    ORDER BY d.id
  `).all() as any[];
}

export function createDevice(data: any): any {
  const code = data.code || data.deviceNo || data.device_no;
  const qrCode = data.qrCode || data.qr_code || code;
  const result = db.prepare(`
    INSERT INTO devices (device_no, qr_code, name, type, status, location, address, lat, lng, property_id, manufacturer_id, firmware_version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    code,
    qrCode,
    data.name,
    data.type,
    data.status || 'idle',
    data.location,
    data.address || data.location,
    data.lat,
    data.lng,
    data.propertyId || data.property_id || null,
    data.manufacturerId || data.manufacturer_id || null,
    data.firmwareVersion || data.firmware_version || 'v1.0.0'
  );

  return getDeviceById(result.lastInsertRowid as number);
}

export function updateDevice(id: number, data: any): any {
  const result = db.prepare(`
    UPDATE devices SET
      device_no = COALESCE(?, device_no),
      qr_code = COALESCE(?, qr_code),
      name = COALESCE(?, name),
      type = COALESCE(?, type),
      status = COALESCE(?, status),
      location = COALESCE(?, location),
      address = COALESCE(?, address),
      lat = COALESCE(?, lat),
      lng = COALESCE(?, lng),
      property_id = COALESCE(?, property_id),
      manufacturer_id = COALESCE(?, manufacturer_id),
      firmware_version = COALESCE(?, firmware_version),
      last_online = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    data.code || data.deviceNo || data.device_no || null,
    data.qrCode || data.qr_code || null,
    data.name || null,
    data.type || null,
    data.status || null,
    data.location || null,
    data.address || null,
    data.lat ?? null,
    data.lng ?? null,
    data.propertyId || data.property_id || null,
    data.manufacturerId || data.manufacturer_id || null,
    data.firmwareVersion || data.firmware_version || null,
    id
  );

  return result.changes > 0 ? getDeviceById(id) : null;
}

export function deleteDevice(id: number): boolean {
  const hasOrders = (db.prepare('SELECT COUNT(*) as total FROM orders WHERE device_id = ?').get(id) as any).total as number;
  if (hasOrders > 0) {
    db.prepare("UPDATE devices SET status = 'maintenance' WHERE id = ?").run(id);
    return true;
  }

  const result = db.prepare('DELETE FROM devices WHERE id = ?').run(id);
  return result.changes > 0;
}

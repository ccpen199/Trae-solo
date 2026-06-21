import db from '../db/database.js';
import { Device, DeviceWithDistance, ConnectionType } from '../../shared/types.js';

function rowToDevice(row: {
  id: string; name: string; location: string; lat: number; lng: number;
  status: string; connection_types: string; queue_count: number;
  today_water_usage: number; today_revenue: number;
  total_water_usage: number; total_revenue: number;
  investor_id: string; last_online: number; created_at: number;
}): Device {
  return {
    id: row.id,
    name: row.name,
    location: row.location,
    lat: row.lat,
    lng: row.lng,
    status: row.status as Device['status'],
    connectionTypes: JSON.parse(row.connection_types) as ConnectionType[],
    queueCount: row.queue_count,
    todayWaterUsage: row.today_water_usage,
    todayRevenue: row.today_revenue,
    totalWaterUsage: row.total_water_usage,
    totalRevenue: row.total_revenue,
    investorId: row.investor_id,
    lastOnline: row.last_online,
    createdAt: row.created_at,
  };
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getNearbyDevices(lat: number, lng: number, radius = 500): DeviceWithDistance[] {
  const rows = db.prepare('SELECT * FROM devices').all() as Array<{
    id: string; name: string; location: string; lat: number; lng: number;
    status: string; connection_types: string; queue_count: number;
    today_water_usage: number; today_revenue: number;
    total_water_usage: number; total_revenue: number;
    investor_id: string; last_online: number; created_at: number;
  }>;

  const devices: DeviceWithDistance[] = [];
  for (const row of rows) {
    const distance = haversineDistance(lat, lng, row.lat, row.lng);
    if (distance <= radius) {
      devices.push({
        ...rowToDevice(row),
        distance: Math.round(distance),
      });
    }
  }

  return devices.sort((a, b) => a.distance - b.distance);
}

export function getDeviceById(deviceId: string): Device | null {
  const row = db.prepare('SELECT * FROM devices WHERE id = ?').get(deviceId) as {
    id: string; name: string; location: string; lat: number; lng: number;
    status: string; connection_types: string; queue_count: number;
    today_water_usage: number; today_revenue: number;
    total_water_usage: number; total_revenue: number;
    investor_id: string; last_online: number; created_at: number;
  } | undefined;
  return row ? rowToDevice(row) : null;
}

export function getDevicesByInvestor(investorId: string): Device[] {
  const rows = db.prepare('SELECT * FROM devices WHERE investor_id = ? ORDER BY created_at DESC').all(investorId) as Array<{
    id: string; name: string; location: string; lat: number; lng: number;
    status: string; connection_types: string; queue_count: number;
    today_water_usage: number; today_revenue: number;
    total_water_usage: number; total_revenue: number;
    investor_id: string; last_online: number; created_at: number;
  }>;
  return rows.map(rowToDevice);
}

export function updateDeviceStatus(deviceId: string, status: Device['status']): void {
  db.prepare('UPDATE devices SET status = ?, last_online = ? WHERE id = ?').run(
    status, Date.now(), deviceId
  );
}

export function updateDeviceQueue(deviceId: string, delta: number): void {
  db.prepare(`
    UPDATE devices SET queue_count = MAX(0, queue_count + ?) WHERE id = ?
  `).run(delta, deviceId);
}

export function getAllDevices(): Device[] {
  const rows = db.prepare('SELECT * FROM devices ORDER BY created_at DESC').all() as Array<{
    id: string; name: string; location: string; lat: number; lng: number;
    status: string; connection_types: string; queue_count: number;
    today_water_usage: number; today_revenue: number;
    total_water_usage: number; total_revenue: number;
    investor_id: string; last_online: number; created_at: number;
  }>;
  return rows.map(rowToDevice);
}

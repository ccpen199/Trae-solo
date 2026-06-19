import { getDb } from '../db';
import { nowTimestamp } from '../utils';
import type { Rider, RiderLocation, RiderStatus } from '../types';

export function getRiderList(params?: {
  status?: RiderStatus;
  type?: string;
  page?: number;
  pageSize?: number;
}): { list: Rider[]; total: number } {
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
  if (params?.type) {
    whereClauses.push('type = ?');
    queryParams.push(params.type);
  }

  const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

  const total = db
    .prepare(`SELECT COUNT(*) as count FROM riders ${whereSql}`)
    .get(...queryParams) as { count: number };

  const list = db
    .prepare(
      `SELECT * FROM riders ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`
    )
    .all(...queryParams, pageSize, offset) as Rider[];

  return { list, total: total.count };
}

export function getRiderById(id: number): Rider | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM riders WHERE id = ?').get(id) as Rider | undefined;
}

export function getRiderLocation(riderId: number): RiderLocation | undefined {
  const db = getDb();
  return db
    .prepare(
      'SELECT * FROM rider_locations WHERE rider_id = ? ORDER BY timestamp DESC LIMIT 1'
    )
    .get(riderId) as RiderLocation | undefined;
}

export function getRiderLocations(riderId: number, hours: number = 1): RiderLocation[] {
  const db = getDb();
  const since = nowTimestamp() - hours * 3600;
  return db
    .prepare(
      'SELECT * FROM rider_locations WHERE rider_id = ? AND timestamp >= ? ORDER BY timestamp ASC'
    )
    .all(riderId, since) as RiderLocation[];
}

export function updateRiderStatus(riderId: number, status: RiderStatus): boolean {
  const db = getDb();
  const now = nowTimestamp();

  const result = db
    .prepare(
      `UPDATE riders SET status = ?, last_online_at = ?, updated_at = ? WHERE id = ?`
    )
    .run(status, now, now, riderId);

  return result.changes > 0;
}

export function updateRiderBattery(riderId: number, battery: number): boolean {
  const db = getDb();
  const now = nowTimestamp();

  const result = db
    .prepare(`UPDATE riders SET battery = ?, updated_at = ? WHERE id = ?`)
    .run(battery, now, riderId);

  return result.changes > 0;
}

export function reportRiderLocation(
  riderId: number,
  lat: number,
  lng: number,
  speed: number = 0,
  heading: number = 0,
  accuracy: number = 0
): RiderLocation {
  const db = getDb();
  const now = nowTimestamp();

  const tx = db.transaction(() => {
    db.prepare(
      `INSERT INTO rider_locations 
       (rider_id, lat, lng, speed, heading, accuracy, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(riderId, lat, lng, speed, heading, accuracy, now);

    db.prepare(
      `UPDATE riders 
       SET current_lat = ?, current_lng = ?, last_online_at = ?, updated_at = ?
       WHERE id = ?`
    ).run(lat, lng, now, now, riderId);
  });

  tx();

  return db
    .prepare(
      'SELECT * FROM rider_locations WHERE rider_id = ? ORDER BY timestamp DESC LIMIT 1'
    )
    .get(riderId) as RiderLocation;
}

export function createRider(data: {
  name: string;
  phone: string;
  type: string;
  vehicle_type?: string;
}): Rider {
  const db = getDb();
  const now = nowTimestamp();

  const result = db
    .prepare(
      `INSERT INTO riders 
       (name, phone, type, vehicle_type, status, credit_score, battery, 
        willingness_coefficient, fulfillment_rate, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'offline', 100, 100, 1.0, 0.95, ?, ?)`
    )
    .run(
      data.name,
      data.phone,
      data.type,
      data.vehicle_type || 'electric',
      now,
      now
    );

  return db.prepare('SELECT * FROM riders WHERE id = ?').get(result.lastInsertRowid) as Rider;
}

export function getAllOnlineRiders(): Rider[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM riders 
       WHERE status IN ('online', 'busy') 
         AND current_lat IS NOT NULL 
         AND current_lng IS NOT NULL`
    )
    .all() as Rider[];
}

export function getRiderOfflineCache(riderId: number): any[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM offline_orders_cache 
       WHERE rider_id = ? AND synced = 0
       ORDER BY created_at DESC`
    )
    .all(riderId);
}

export function getRiderLocationReportStatus(riderId: number): {
  last_report_time: number | null;
  interval_seconds: number | null;
  is_normal: boolean;
  expected_interval: number;
} {
  const db = getDb();
  const lastLocation = db
    .prepare(
      'SELECT timestamp FROM rider_locations WHERE rider_id = ? ORDER BY timestamp DESC LIMIT 1'
    )
    .get(riderId) as { timestamp: number } | undefined;

  const secondLastLocation = db
    .prepare(
      'SELECT timestamp FROM rider_locations WHERE rider_id = ? ORDER BY timestamp DESC LIMIT 1 OFFSET 1'
    )
    .get(riderId) as { timestamp: number } | undefined;

  const expectedInterval = 15;

  if (!lastLocation) {
    return { last_report_time: null, interval_seconds: null, is_normal: false, expected_interval: expectedInterval };
  }

  const interval = secondLastLocation
    ? lastLocation.timestamp - secondLastLocation.timestamp
    : null;

  const now = nowTimestamp();
  const isNormal = (now - lastLocation.timestamp) < 60;

  return {
    last_report_time: lastLocation.timestamp,
    interval_seconds: interval,
    is_normal: isNormal,
    expected_interval: expectedInterval,
  };
}

export function getRiderAssignments(riderId: number, limit: number = 10): any[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT oa.*, o.order_no, o.merchant_name, o.status as order_status,
              o.merchant_lat, o.merchant_lng, o.estimated_distance, o.estimated_duration
       FROM order_assignments oa
       LEFT JOIN orders o ON oa.order_id = o.id
       WHERE oa.rider_id = ?
       ORDER BY oa.created_at DESC
       LIMIT ?`
    )
    .all(riderId, limit);
}

export function getRiderAnomalyRecords(riderId: number, limit: number = 10): { complaints: any[]; creditRecords: any[] } {
  const db = getDb();
  const complaints = db
    .prepare(
      `SELECT c.*, o.order_no, o.merchant_name
       FROM complaints c
       LEFT JOIN orders o ON c.order_id = o.id
       WHERE c.rider_id = ?
       ORDER BY c.created_at DESC
       LIMIT ?`
    )
    .all(riderId, limit);

  const creditRecords = db
    .prepare(
      `SELECT * FROM credit_score_records
       WHERE rider_id = ? AND change_amount < 0
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .all(riderId, limit);

  return { complaints, creditRecords };
}

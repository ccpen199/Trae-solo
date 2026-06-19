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

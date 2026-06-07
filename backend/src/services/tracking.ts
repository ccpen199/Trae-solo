import db from '../db/database.ts';

export function addTrackingPoint(
  waybillId: number,
  knightId: number,
  lat: number,
  lng: number,
  speed: number = 0,
  heading: number = 0
) {
  const result = db.prepare(`
    INSERT INTO tracking_points (waybill_id, knight_id, lat, lng, speed, heading)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(waybillId, knightId, lat, lng, speed, heading);

  db.prepare(`
    UPDATE knights SET lat = ?, lng = ?, last_active_at = ? WHERE id = ?
  `).run(lat, lng, new Date().toISOString(), knightId);

  return { id: result.lastInsertRowid };
}

export function getTrackingHistory(waybillId: number) {
  return db.prepare(`
    SELECT tp.*, k.name as knight_name
    FROM tracking_points tp
    LEFT JOIN knights k ON tp.knight_id = k.id
    WHERE tp.waybill_id = ?
    ORDER BY tp.created_at ASC
  `).all(waybillId);
}

export function getLatestPosition(waybillId: number) {
  return db.prepare(`
    SELECT tp.*, k.name as knight_name
    FROM tracking_points tp
    LEFT JOIN knights k ON tp.knight_id = k.id
    WHERE tp.waybill_id = ?
    ORDER BY tp.created_at DESC
    LIMIT 1
  `).get(waybillId);
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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

export function calculateDistanceTraveled(waybillId: number): number {
  const points = db.prepare(`
    SELECT lat, lng FROM tracking_points
    WHERE waybill_id = ?
    ORDER BY created_at ASC
  `).all(waybillId) as { lat: number; lng: number }[];

  if (points.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(
      points[i - 1].lat, points[i - 1].lng,
      points[i].lat, points[i].lng
    );
  }

  return total;
}

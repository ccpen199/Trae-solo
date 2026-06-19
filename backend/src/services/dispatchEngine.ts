import { getDb } from '../db';
import { haversineDistance, nowTimestamp } from '../utils';
import type { Rider, Order, OrderAssignment } from '../types';

interface DispatchScore {
  distance: number;
  willingness: number;
  fulfillment: number;
  battery: number;
  total: number;
}

interface DispatchCandidate {
  rider: Rider;
  score: DispatchScore;
  distance: number;
}

const WEIGHTS = {
  distance: 0.35,
  willingness: 0.25,
  fulfillment: 0.25,
  battery: 0.15,
};

const MIN_BATTERY_THRESHOLD = 20;
const MAX_SEARCH_RADIUS = 5;

export function findBestRider(order: Order): DispatchCandidate[] {
  const db = getDb();

  const riders = db
    .prepare(
      `SELECT * FROM riders 
       WHERE status = 'online' 
         AND battery >= ?
         AND current_lat IS NOT NULL 
         AND current_lng IS NOT NULL
       ORDER BY id`
    )
    .all(MIN_BATTERY_THRESHOLD) as Rider[];

  if (riders.length === 0) return [];

  const merchantLat = order.merchant_lat;
  const merchantLng = order.merchant_lng;

  if (!merchantLat || !merchantLng) return [];

  const candidates: DispatchCandidate[] = [];

  for (const rider of riders) {
    if (!rider.current_lat || !rider.current_lng) continue;

    const distance = haversineDistance(
      rider.current_lat,
      rider.current_lng,
      merchantLat,
      merchantLng
    );

    if (distance > MAX_SEARCH_RADIUS) continue;

    const score = calculateScore(rider, distance);
    candidates.push({ rider, score, distance });
  }

  candidates.sort((a, b) => b.score.total - a.score.total);

  return candidates.slice(0, 10);
}

function calculateScore(rider: Rider, distance: number): DispatchScore {
  const distanceScore = Math.max(0, 1 - distance / MAX_SEARCH_RADIUS);
  const willingnessScore = Math.min(1, Math.max(0, rider.willingness_coefficient));
  const fulfillmentScore = Math.min(1, Math.max(0, rider.fulfillment_rate));
  const batteryScore = Math.min(1, rider.battery / 100);

  const total =
    distanceScore * WEIGHTS.distance +
    willingnessScore * WEIGHTS.willingness +
    fulfillmentScore * WEIGHTS.fulfillment +
    batteryScore * WEIGHTS.battery;

  return {
    distance: distanceScore,
    willingness: willingnessScore,
    fulfillment: fulfillmentScore,
    battery: batteryScore,
    total,
  };
}

export function createAssignment(
  orderId: number,
  riderId: number,
  score: number,
  distance: number
): OrderAssignment {
  const db = getDb();
  const now = nowTimestamp();

  const result = db
    .prepare(
      `INSERT INTO order_assignments 
       (order_id, rider_id, status, score, distance, created_at)
       VALUES (?, ?, 'pending', ?, ?, ?)`
    )
    .run(orderId, riderId, score, distance, now);

  return db
    .prepare('SELECT * FROM order_assignments WHERE id = ?')
    .get(result.lastInsertRowid) as OrderAssignment;
}

export function acceptAssignment(assignmentId: number, riderId: number): boolean {
  const db = getDb();
  const now = nowTimestamp();

  const assignment = db
    .prepare('SELECT * FROM order_assignments WHERE id = ?')
    .get(assignmentId) as OrderAssignment | undefined;

  if (!assignment || assignment.rider_id !== riderId) return false;
  if (assignment.status !== 'pending') return false;

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE order_assignments SET status = 'accepted', responded_at = ? WHERE id = ?`
    ).run(now, assignmentId);

    db.prepare(
      `UPDATE orders SET status = 'assigned', assigned_rider_id = ?, assigned_at = ?, updated_at = ?
       WHERE id = ?`
    ).run(riderId, now, now, assignment.order_id);

    db.prepare(
      `UPDATE riders SET status = 'busy', updated_at = ? WHERE id = ?`
    ).run(now, riderId);
  });

  tx();
  return true;
}

export function rejectAssignment(assignmentId: number, riderId: number): boolean {
  const db = getDb();
  const now = nowTimestamp();

  const assignment = db
    .prepare('SELECT * FROM order_assignments WHERE id = ?')
    .get(assignmentId) as OrderAssignment | undefined;

  if (!assignment || assignment.rider_id !== riderId) return false;
  if (assignment.status !== 'pending') return false;

  db.prepare(
    `UPDATE order_assignments SET status = 'rejected', responded_at = ? WHERE id = ?`
  ).run(now, assignmentId);

  const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(riderId) as Rider;
  if (rider) {
    const newWillingness = Math.max(0.3, rider.willingness_coefficient - 0.05);
    db.prepare(`UPDATE riders SET willingness_coefficient = ? WHERE id = ?`).run(
      newWillingness,
      riderId
    );
  }

  return true;
}

export function dispatchOrder(orderId: number): DispatchCandidate[] {
  const db = getDb();
  const order = db
    .prepare('SELECT * FROM orders WHERE id = ?')
    .get(orderId) as Order | undefined;

  if (!order || order.status !== 'pending') return [];

  const candidates = findBestRider(order);

  const now = nowTimestamp();
  for (const candidate of candidates.slice(0, 3)) {
    db.prepare(
      `INSERT INTO order_assignments 
       (order_id, rider_id, status, score, distance, created_at)
       VALUES (?, ?, 'pending', ?, ?, ?)`
    ).run(
      orderId,
      candidate.rider.id,
      candidate.score.total,
      candidate.distance,
      now
    );
  }

  return candidates;
}

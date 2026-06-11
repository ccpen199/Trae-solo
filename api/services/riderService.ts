import { v4 as uuidv4 } from 'uuid';
import { dbQueries, type Rider, type RiderLocation } from '../db/database.js';

export interface CreateRiderParams {
  name: string;
  phone: string;
  avatar?: string;
  vehicle_type?: string;
}

export interface UpdateLocationParams {
  rider_id: string;
  lat: number;
  lng: number;
}

export interface CreditScoreFactors {
  on_time_rate: number;
  complaint_rate: number;
  equipment_compliant: boolean;
  bonus_points?: number;
}

const KM_PER_DEGREE_LAT = 111;
const KM_PER_DEGREE_LNG_BASE = 111;

export function createRider(params: CreateRiderParams): Rider {
  const now = new Date().toISOString();
  const rider: Rider = {
    id: uuidv4(),
    name: params.name,
    phone: params.phone,
    avatar: params.avatar ?? null,
    status: 'offline',
    current_lat: null,
    current_lng: null,
    credit_score: 100,
    total_orders: 0,
    on_time_rate: 1,
    complaint_rate: 0,
    equipment_compliant: true,
    vehicle_type: params.vehicle_type ?? 'electric_scooter',
    created_at: now,
  };
  dbQueries.riders.create().run({
    ...rider,
    equipment_compliant: rider.equipment_compliant ? 1 : 0,
  });
  return rider;
}

export function getRiderById(id: string): Rider | null {
  const result = dbQueries.riders.findById().get(id) as (Rider & { equipment_compliant: number | boolean }) | undefined;
  if (!result) return null;
  return { ...result, equipment_compliant: Boolean(result.equipment_compliant) };
}

export function getRiderByPhone(phone: string): Rider | null {
  const result = dbQueries.riders.findByPhone().get(phone) as (Rider & { equipment_compliant: number | boolean }) | undefined;
  if (!result) return null;
  return { ...result, equipment_compliant: Boolean(result.equipment_compliant) };
}

export function getAllRiders(): Rider[] {
  const results = dbQueries.riders.findAll().all() as Array<Rider & { equipment_compliant: number | boolean }>;
  return results.map((r) => ({ ...r, equipment_compliant: Boolean(r.equipment_compliant) }));
}

export function getRidersByStatus(status: Rider['status']): Rider[] {
  const results = dbQueries.riders.findByStatus().all(status) as Array<Rider & { equipment_compliant: number | boolean }>;
  return results.map((r) => ({ ...r, equipment_compliant: Boolean(r.equipment_compliant) }));
}

export function getNearbyRiders(lat: number, lng: number, radiusKm: number = 5): Rider[] {
  const latDelta = radiusKm / KM_PER_DEGREE_LAT;
  const lngDelta = radiusKm / (KM_PER_DEGREE_LNG_BASE * Math.cos(lat * Math.PI / 180));

  const results = dbQueries.riders.findNearby().all(
    lat - latDelta,
    lat + latDelta,
    lng - lngDelta,
    lng + lngDelta,
  ) as Array<Rider & { equipment_compliant: number | boolean }>;

  return results.map((r) => ({ ...r, equipment_compliant: Boolean(r.equipment_compliant) }));
}

export function updateRiderStatus(riderId: string, status: Rider['status']): Rider | null {
  const existing = getRiderById(riderId);
  if (!existing) return null;
  const updated: Rider = { ...existing, status };
  dbQueries.riders.update().run({
    ...updated,
    equipment_compliant: updated.equipment_compliant ? 1 : 0,
  });
  return getRiderById(riderId);
}

export function updateRiderLocation(params: UpdateLocationParams): Rider | null {
  const existing = getRiderById(params.rider_id);
  if (!existing) return null;

  const timestamp = new Date().toISOString();
  dbQueries.riderLocations.create().run({
    rider_id: params.rider_id,
    lat: params.lat,
    lng: params.lng,
    timestamp,
  });

  const updated: Rider = {
    ...existing,
    current_lat: params.lat,
    current_lng: params.lng,
    status: existing.status === 'offline' ? 'online' : existing.status,
  };

  dbQueries.riders.update().run({
    ...updated,
    equipment_compliant: updated.equipment_compliant ? 1 : 0,
  });

  return getRiderById(params.rider_id);
}

export function getRiderLocationHistory(riderId: string, limit: number = 100): RiderLocation[] {
  return dbQueries.riderLocations.findByRiderId().all(riderId, limit) as RiderLocation[];
}

export function calculateCreditScore(factors: CreditScoreFactors): number {
  let score = 100;

  score -= Math.round((1 - factors.on_time_rate) * 50);
  score -= Math.round(factors.complaint_rate * 100);

  if (!factors.equipment_compliant) {
    score -= 15;
  }

  if (factors.bonus_points) {
    score += factors.bonus_points;
  }

  return Math.max(0, Math.min(100, score));
}

export function updateRiderCreditScore(riderId: string, factors: CreditScoreFactors): Rider | null {
  const existing = getRiderById(riderId);
  if (!existing) return null;

  const newScore = calculateCreditScore(factors);
  const updated: Rider = {
    ...existing,
    credit_score: newScore,
    on_time_rate: factors.on_time_rate,
    complaint_rate: factors.complaint_rate,
    equipment_compliant: factors.equipment_compliant,
  };

  dbQueries.riders.update().run({
    ...updated,
    equipment_compliant: updated.equipment_compliant ? 1 : 0,
  });

  return getRiderById(riderId);
}

export function recordCompletedOrder(riderId: string, onTime: boolean, complaint: boolean): Rider | null {
  const existing = getRiderById(riderId);
  if (!existing) return null;

  const totalOrders = existing.total_orders + 1;
  const onTimeCount = existing.on_time_rate * existing.total_orders + (onTime ? 1 : 0);
  const complaintCount = existing.complaint_rate * existing.total_orders + (complaint ? 1 : 0);

  const onTimeRate = totalOrders > 0 ? onTimeCount / totalOrders : 1;
  const complaintRate = totalOrders > 0 ? complaintCount / totalOrders : 0;

  return updateRiderCreditScore(riderId, {
    on_time_rate: onTimeRate,
    complaint_rate: complaintRate,
    equipment_compliant: existing.equipment_compliant,
  });
}

export function deleteRider(riderId: string): boolean {
  const result = dbQueries.riders.delete().run(riderId);
  return result.changes > 0;
}

export function cleanupOldLocationHistory(hours: number = 24): void {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  dbQueries.riderLocations.deleteOld().run(cutoff);
}

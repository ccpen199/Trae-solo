import { v4 as uuidv4 } from 'uuid';
import { dbQueries, getDb, type Order } from '../db/database.js';

export interface CreateOrderParams {
  user_id: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  goods_type: string;
  goods_weight?: number;
  distance: number;
  estimated_price: number;
}

export interface AssignOrdersPlan {
  rider_id: string;
  orders: Order[];
  optimized_route: { lat: number; lng: number; order_id?: string; type: 'pickup' | 'delivery' }[];
  total_distance: number;
  estimated_duration: number;
}

const KM_PER_DEGREE_LAT = 111;
const KM_PER_DEGREE_LNG_BASE = 111;

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function generateOrderNo(): string {
  const now = new Date();
  const datePart = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0');
  const random = Math.floor(10000000 + Math.random() * 90000000).toString();
  return `DD${datePart}${random}`;
}

export function createOrder(params: CreateOrderParams): Order {
  const now = new Date().toISOString();
  const estimatedDelivery = new Date(Date.now() + params.distance * 3 * 60 * 1000 + 30 * 60 * 1000).toISOString();

  const order: Order = {
    id: uuidv4(),
    order_no: generateOrderNo(),
    user_id: params.user_id,
    rider_id: null,
    pickup_address: params.pickup_address,
    pickup_lat: params.pickup_lat,
    pickup_lng: params.pickup_lng,
    delivery_address: params.delivery_address,
    delivery_lat: params.delivery_lat,
    delivery_lng: params.delivery_lng,
    goods_type: params.goods_type,
    goods_weight: params.goods_weight ?? 0,
    distance: params.distance,
    estimated_price: params.estimated_price,
    actual_price: null,
    status: 'pending',
    exception_reason: null,
    created_at: now,
    assigned_at: null,
    picked_up_at: null,
    completed_at: null,
    estimated_delivery_at: estimatedDelivery,
  };

  dbQueries.orders.create().run(order);
  return order;
}

export function getOrderById(id: string): Order | null {
  return dbQueries.orders.findById().get(id) as Order | null || null;
}

export function getOrderByNo(orderNo: string): Order | null {
  return dbQueries.orders.findByOrderNo().get(orderNo) as Order | null || null;
}

export function getOrdersByUserId(userId: string): Order[] {
  return dbQueries.orders.findByUserId().all(userId) as Order[];
}

export function getOrdersByRiderId(riderId: string): Order[] {
  return dbQueries.orders.findByRiderId().all(riderId) as Order[];
}

export function getOrdersByStatus(status: Order['status']): Order[] {
  return dbQueries.orders.findByStatus().all(status) as Order[];
}

export function getAllOrders(limit?: number, offset?: number): Order[] {
  let query = 'SELECT * FROM orders ORDER BY created_at DESC';
  const params: unknown[] = [];
  if (limit !== undefined) {
    query += ' LIMIT ?';
    params.push(limit);
  }
  if (offset !== undefined) {
    query += ' OFFSET ?';
    params.push(offset);
  }
  return getDb().prepare(query).all(...params) as Order[];
}

export function updateOrderStatus(id: string, status: Order['status'], extra?: Partial<Order>): Order | null {
  const existing = getOrderById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updated: Order = {
    ...existing,
    status,
    ...extra,
  };

  if (status === 'assigned' && !updated.assigned_at) {
    updated.assigned_at = now;
  }
  if (status === 'picked_up' && !updated.picked_up_at) {
    updated.picked_up_at = now;
  }
  if (status === 'completed' && !updated.completed_at) {
    updated.completed_at = now;
    if (!updated.actual_price) {
      updated.actual_price = updated.estimated_price;
    }
  }

  dbQueries.orders.update().run(updated);
  return getOrderById(id);
}

export function assignRiderToOrder(orderId: string, riderId: string): Order | null {
  return updateOrderStatus(orderId, 'assigned', { rider_id: riderId });
}

export function getExceptionOrders(): Order[] {
  return getOrdersByStatus('exception');
}

export function moveToExceptionPool(orderId: string, reason: string): Order | null {
  return updateOrderStatus(orderId, 'exception', { exception_reason: reason });
}

export function resolveExceptionOrder(orderId: string, newStatus: Order['status'], actualPrice?: number): Order | null {
  return updateOrderStatus(orderId, newStatus, {
    exception_reason: null,
    ...(actualPrice !== undefined ? { actual_price: actualPrice } : {}),
  });
}

export function smartDispatch(centerLat: number, centerLng: number, radiusKm = 3): AssignOrdersPlan[] {
  const latDelta = radiusKm / KM_PER_DEGREE_LAT;
  const lngDelta = radiusKm / (KM_PER_DEGREE_LNG_BASE * Math.cos(centerLat * Math.PI / 180));

  const pendingOrders = dbQueries.orders.findPendingNearby().all(
    centerLat - latDelta,
    centerLat + latDelta,
    centerLng - lngDelta,
    centerLng + lngDelta,
  ) as Order[];

  if (pendingOrders.length === 0) return [];

  const nearbyRiders = dbQueries.riders.findNearby().all(
    centerLat - latDelta,
    centerLat + latDelta,
    centerLng - lngDelta,
    centerLng + lngDelta,
  ) as Array<{ id: string; current_lat: number | null; current_lng: number | null; credit_score: number }>;

  if (nearbyRiders.length === 0) return [];

  const plans: AssignOrdersPlan[] = [];

  for (const rider of nearbyRiders) {
    if (pendingOrders.length === 0) break;
    if (rider.current_lat === null || rider.current_lng === null) continue;

    const riderOrders: Order[] = [];
    const maxOrdersPerRider = 4;

    const sortedByDistance = [...pendingOrders].sort((a, b) => {
      const distA = haversineDistance(rider.current_lat!, rider.current_lng!, a.pickup_lat, a.pickup_lng);
      const distB = haversineDistance(rider.current_lat!, rider.current_lng!, b.pickup_lat, b.pickup_lng);
      return distA - distB;
    });

    let currentLat = rider.current_lat;
    let currentLng = rider.current_lng;
    let routeDistance = 0;

    for (const order of sortedByDistance) {
      if (riderOrders.length >= maxOrdersPerRider) break;

      const distToPickup = haversineDistance(currentLat, currentLng, order.pickup_lat, order.pickup_lng);
      if (distToPickup > radiusKm) continue;

      riderOrders.push(order);
      routeDistance += distToPickup;
      currentLat = order.pickup_lat;
      currentLng = order.pickup_lng;

      pendingOrders.splice(pendingOrders.indexOf(order), 1);
    }

    if (riderOrders.length > 0) {
      const route = optimizeRoute(rider, riderOrders);
      plans.push({
        rider_id: rider.id,
        orders: riderOrders,
        optimized_route: route.points,
        total_distance: route.total_distance,
        estimated_duration: Math.round(route.total_distance * 3 + riderOrders.length * 5),
      });
    }
  }

  return plans;
}

function optimizeRoute(
  rider: { current_lat: number | null; current_lng: number | null },
  orders: Order[],
): { points: { lat: number; lng: number; order_id?: string; type: 'pickup' | 'delivery' }[]; total_distance: number } {
  interface Point {
    lat: number;
    lng: number;
    order_id?: string;
    type: 'pickup' | 'delivery';
  }

  const points: Point[] = [];
  orders.forEach((order) => {
    points.push({ lat: order.pickup_lat, lng: order.pickup_lng, order_id: order.id, type: 'pickup' });
    points.push({ lat: order.delivery_lat, lng: order.delivery_lng, order_id: order.id, type: 'delivery' });
  });

  const route: Point[] = [];
  let currentLat = rider.current_lat ?? 0;
  let currentLng = rider.current_lng ?? 0;
  let totalDistance = 0;
  const pickedUp = new Set<string>();

  while (points.length > 0) {
    let nearestIdx = -1;
    let nearestDist = Infinity;

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.type === 'delivery' && !pickedUp.has(p.order_id)) continue;

      const dist = haversineDistance(currentLat, currentLng, p.lat, p.lng);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }

    if (nearestIdx === -1) {
      const fallback = points.shift()!;
      route.push(fallback);
      totalDistance += haversineDistance(currentLat, currentLng, fallback.lat, fallback.lng);
      currentLat = fallback.lat;
      currentLng = fallback.lng;
      if (fallback.type === 'pickup' && fallback.order_id) pickedUp.add(fallback.order_id);
    } else {
      const next = points.splice(nearestIdx, 1)[0];
      route.push(next);
      totalDistance += nearestDist;
      currentLat = next.lat;
      currentLng = next.lng;
      if (next.type === 'pickup' && next.order_id) pickedUp.add(next.order_id);
    }
  }

  return { points: route, total_distance: Math.round(totalDistance * 100) / 100 };
}

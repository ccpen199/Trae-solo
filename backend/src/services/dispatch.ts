import db from '../db/database.ts';

export interface Knight {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  type: string;
  status: string;
  lat: number;
  lng: number;
  credit_score: number;
  total_orders: number;
  completed_orders: number;
  avg_rating: number;
  capacity: number;
  current_load: number;
  last_active_at: string;
}

export interface Candidate extends Knight {
  score: number;
  distance_score: number;
  load_score: number;
  history_score: number;
  insurance_score: number;
  distance: number;
}

export interface Waybill {
  id: number;
  order_no: string;
  merchant_id: number;
  sender_lat: number;
  sender_lng: number;
  insurance_level: string;
  insurance_value: number;
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

function normalize(value: number, min: number, max: number): number {
  if (max - min === 0) return 0;
  return (value - min) / (max - min);
}

export function getCandidateKnights(waybill: Waybill): Candidate[] {
  let knights = db.prepare(`
    SELECT * FROM knights
    WHERE status IN ('online', 'busy')
    AND current_load < capacity
  `).all() as Knight[];

  if (knights.length === 0) {
    knights = db.prepare(`
      SELECT * FROM knights
      WHERE status = 'offline'
      AND current_load < capacity
      AND credit_score > 0
      LIMIT 5
    `).all() as Knight[];
  }

  if (knights.length === 0) return [];

  const distances: number[] = [];
  const loads: number[] = [];
  const histories: number[] = [];
  const credits: number[] = [];

  knights.forEach(k => {
    const dist = haversineDistance(waybill.sender_lat, waybill.sender_lng, k.lat, k.lng);
    distances.push(dist);
    loads.push(k.current_load / k.capacity);
    histories.push(k.total_orders > 0 ? k.completed_orders / k.total_orders : 0);
    credits.push(k.credit_score);
  });

  const minDist = Math.min(...distances);
  const maxDist = Math.max(...distances);
  const minLoad = Math.min(...loads);
  const maxLoad = Math.max(...loads);
  const minHist = Math.min(...histories);
  const maxHist = Math.max(...histories);
  const minCredit = Math.min(...credits);
  const maxCredit = Math.max(...credits);

  const insuranceWeight = waybill.insurance_level === 'premium' ? 1.5 :
    waybill.insurance_level === 'standard' ? 1.2 : 1.0;

  const candidates: Candidate[] = knights.map((knight, idx) => {
    const distance = distances[idx];
    const distanceScore = 1 - normalize(distance, minDist, maxDist);
    const loadScore = 1 - normalize(loads[idx], minLoad, maxLoad);
    const completionRate = histories[idx];
    const ratingScore = knight.avg_rating / 5;
    const historyScore = normalize(completionRate * 0.7 + ratingScore * 0.3, minHist, maxHist);
    const creditScore = normalize(credits[idx], minCredit, maxCredit) * insuranceWeight;
    const finalCreditScore = Math.min(creditScore, 1);

    const score =
      distanceScore * 0.3 +
      loadScore * 0.2 +
      historyScore * 0.3 +
      finalCreditScore * 0.2;

    return {
      ...knight,
      score,
      distance_score: distanceScore,
      load_score: loadScore,
      history_score: historyScore,
      insurance_score: finalCreditScore,
      distance,
    };
  });

  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

export function logDispatch(
  waybillId: number,
  knightId: number,
  scores: {
    score: number;
    distance_score: number;
    load_score: number;
    history_score: number;
    insurance_score: number;
    distance: number;
  },
  result: 'assigned' | 'rejected' | 'timeout'
) {
  db.prepare(`
    INSERT INTO dispatch_logs (waybill_id, knight_id, score, distance_score, load_score, history_score, insurance_score, distance, result)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    waybillId,
    knightId,
    scores.score,
    scores.distance_score,
    scores.load_score,
    scores.history_score,
    scores.insurance_score,
    scores.distance,
    result
  );
}

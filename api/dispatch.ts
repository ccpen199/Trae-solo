import db from './database.js'

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

interface DispatchCandidate {
  rider_id: number
  rider_name: string
  score: number
  distance_score: number
  timeliness_score: number
  load_score: number
  fulfillment_score: number
}

export function smartDispatch(orderId: number): DispatchCandidate[] {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any
  if (!order) return []

  const merchant = db.prepare('SELECT * FROM merchants WHERE id = ?').get(order.merchant_id) as any

  const riders = db
    .prepare(
      `SELECT r.*, 
       (SELECT COUNT(*) FROM orders WHERE rider_id = r.id AND status IN ('dispatched','picking_up','delivering')) as active_orders,
       (SELECT COUNT(*) FROM orders WHERE rider_id = r.id AND status = 'completed') as completed_orders
       FROM riders r 
       WHERE r.zone_id = ? AND r.status = 'online' AND r.verify_status = 'approved' AND r.health_code_status = 'green'`,
    )
    .all(order.zone_id) as any[]

  if (riders.length === 0) return []

  const zone = db.prepare('SELECT * FROM dispatch_zones WHERE id = ?').get(order.zone_id) as any
  let pickupLat = 0
  let pickupLng = 0
  if (zone) {
    const bounds = JSON.parse(zone.grid_bounds)
    pickupLng = (bounds.min_lng + bounds.max_lng) / 2
    pickupLat = (bounds.min_lat + bounds.max_lat) / 2
  }

  const scored: DispatchCandidate[] = riders.map((rider) => {
    const distance = haversineDistance(
      rider.latitude,
      rider.longitude,
      pickupLat,
      pickupLng,
    )

    const maxDistance = 5.0
    const distanceScore = Math.max(0, Math.min(100, (1 - distance / maxDistance) * 100))

    const timelinessScore = rider.service_score * 20

    const maxLoad = 5
    const loadScore = Math.max(0, ((maxLoad - rider.active_orders) / maxLoad) * 100)

    const fulfillmentRate =
      rider.completed_orders > 0
        ? (rider.completed_orders / (rider.completed_orders + rider.active_orders)) * 100
        : 50
    const fulfillmentScore = Math.min(100, fulfillmentRate)

    const totalScore =
      distanceScore * 0.3 +
      timelinessScore * 0.25 +
      loadScore * 0.2 +
      fulfillmentScore * 0.25

    return {
      rider_id: rider.id,
      rider_name: rider.name,
      score: Math.round(totalScore * 100) / 100,
      distance_score: Math.round(distanceScore * 100) / 100,
      timeliness_score: Math.round(timelinessScore * 100) / 100,
      load_score: Math.round(loadScore * 100) / 100,
      fulfillment_score: Math.round(fulfillmentScore * 100) / 100,
    }
  })

  scored.sort((a, b) => b.score - a.score)

  const topCandidates = scored.slice(0, 5)

  const insertRecord = db.prepare(`
    INSERT INTO dispatch_records (order_id, rider_id, dispatch_type, weight_score, rider_response)
    VALUES (?, ?, 'auto', ?, 'pending')
  `)

  const insertRecords = db.transaction((candidates: DispatchCandidate[]) => {
    for (const c of candidates) {
      insertRecord.run(orderId, c.rider_id, c.score)
    }
  })
  insertRecords(topCandidates)

  return topCandidates
}

export function batchDispatch(zoneId: number): { order_id: number; candidates: DispatchCandidate[] }[] {
  const pendingOrders = db
    .prepare('SELECT * FROM orders WHERE zone_id = ? AND status = ?')
    .all(zoneId, 'pending') as any[]

  const results: { order_id: number; candidates: DispatchCandidate[] }[] = []

  for (const order of pendingOrders) {
    const candidates = smartDispatch(order.id)
    results.push({ order_id: order.id, candidates })
  }

  return results
}

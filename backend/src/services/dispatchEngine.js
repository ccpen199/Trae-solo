import db from '../db/index.js';

const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateRouteSimilarity = (order, riderCurrentOrders, riderLat, riderLng) => {
  if (!riderCurrentOrders || riderCurrentOrders.length === 0) return 1.0;

  let totalSimilarity = 0;
  riderCurrentOrders.forEach(existingOrder => {
    const distToMerchant = haversineDistance(
      order.merchant_lat, order.merchant_lng,
      existingOrder.merchant_lat, existingOrder.merchant_lng
    );
    const distToCustomer = haversineDistance(
      order.customer_lat, order.customer_lng,
      existingOrder.customer_lat, existingOrder.customer_lng
    );
    const avgDist = (distToMerchant + distToCustomer) / 2;
    const similarity = Math.max(0, 1 - avgDist / 5000);
    totalSimilarity += similarity;
  });

  return totalSimilarity / riderCurrentOrders.length;
};

const getSupplyDemandRatio = (areaLat, areaLng, hourOfDay) => {
  const prediction = db.prepare(`
    SELECT supply_demand_ratio FROM area_demand_predictions
    WHERE hour_of_day = ?
    ORDER BY ABS(latitude - ?) + ABS(longitude - ?) ASC
    LIMIT 1
  `).get(hourOfDay, areaLat, areaLng);

  if (prediction) return prediction.supply_demand_ratio;

  const riderCount = db.prepare(`
    SELECT COUNT(*) as count FROM gps_traces
    WHERE timestamp > ? AND ABS(latitude - ?) < 0.02 AND ABS(longitude - ?) < 0.02
  `).get(Date.now() / 1000 - 300, areaLat, areaLng);

  const orderCount = db.prepare(`
    SELECT COUNT(*) as count FROM orders
    WHERE status = 'pending' AND ABS(merchant_lat - ?) < 0.02 AND ABS(merchant_lng - ?) < 0.02
  `).get(areaLat, areaLng);

  if (riderCount.count === 0) return 0.5;
  return Math.min(2.0, orderCount.count / riderCount.count);
};

export const calculateDispatchScore = (order, rider, riderLocation, activeRules) => {
  const rules = activeRules || db.prepare(`SELECT * FROM dispatch_rules WHERE is_active = 1 ORDER BY id ASC LIMIT 1`).get();
  if (!rules) return { score: 0, error: 'No dispatch rules configured' };

  if (rider.fulfillment_rate < rules.min_fulfillment_rate) {
    return { score: 0, eligible: false, reason: 'Fulfillment rate below minimum' };
  }

  const distance = haversineDistance(
    riderLocation.lat, riderLocation.lng,
    order.merchant_lat, order.merchant_lng
  );

  if (distance > rules.max_distance) {
    return { score: 0, eligible: false, reason: 'Distance exceeds maximum' };
  }

  const riderCurrentOrders = db.prepare(`
    SELECT * FROM orders WHERE rider_id = ? AND status IN ('accepted', 'picked')
  `).all(rider.user_id);

  const routeSimilarity = calculateRouteSimilarity(order, riderCurrentOrders, riderLocation.lat, riderLocation.lng);
  const hourOfDay = new Date().getHours();
  const supplyDemandRatio = getSupplyDemandRatio(order.merchant_lat, order.merchant_lng, hourOfDay);

  const distanceScore = Math.max(0, 1 - distance / rules.max_distance);
  const fulfillmentScore = rider.fulfillment_rate / 100;
  const supplyDemandScore = Math.min(1, supplyDemandRatio / 2);

  const finalScore =
    distanceScore * rules.weight_distance +
    routeSimilarity * rules.weight_route +
    fulfillmentScore * rules.weight_fulfillment +
    supplyDemandScore * rules.weight_supply_demand;

  return {
    score: Math.round(finalScore * 10000) / 10000,
    eligible: true,
    distance: Math.round(distance),
    routeSimilarity: Math.round(routeSimilarity * 100) / 100,
    fulfillmentRate: rider.fulfillment_rate,
    supplyDemandRatio: Math.round(supplyDemandRatio * 100) / 100,
    weights: {
      distance: rules.weight_distance,
      route: rules.weight_route,
      fulfillment: rules.weight_fulfillment,
      supplyDemand: rules.weight_supply_demand
    }
  };
};

export const dispatchOrder = (orderId) => {
  const order = db.prepare(`SELECT * FROM orders WHERE id = ? AND status = 'pending'`).get(orderId);
  if (!order) return { success: false, error: 'Order not found or not pending' };

  const rules = db.prepare(`SELECT * FROM dispatch_rules WHERE is_active = 1 ORDER BY id ASC LIMIT 1`).get();
  if (!rules) return { success: false, error: 'No dispatch rules configured' };

  const activeRiders = db.prepare(`
    SELECT DISTINCT u.id as user_id, u.real_name, u.status,
           rs.fulfillment_rate, rs.level, rs.total_orders
    FROM users u
    JOIN rider_stats rs ON u.id = rs.user_id
    JOIN rider_verifications rv ON u.id = rv.user_id
    JOIN rider_vehicles v ON u.id = v.user_id
    WHERE u.role = 'rider' AND u.status = 'verified'
      AND rv.verification_status = 'verified'
      AND v.binding_status = 'bound'
      AND rs.fulfillment_rate >= ?
  `).all(rules.min_fulfillment_rate);

  const candidates = [];
  for (const rider of activeRiders) {
    const lastGps = db.prepare(`
      SELECT latitude, longitude FROM gps_traces
      WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1
    `).get(rider.user_id);

    const riderLocation = lastGps || {
      latitude: order.merchant_lat + (Math.random() - 0.5) * 0.02,
      longitude: order.merchant_lng + (Math.random() - 0.5) * 0.02
    };

    const result = calculateDispatchScore(
      order,
      rider,
      { lat: riderLocation.latitude, lng: riderLocation.longitude },
      rules
    );

    if (result.eligible) {
      candidates.push({
        rider_id: rider.user_id,
        rider_name: rider.real_name,
        ...result
      });

      db.prepare(`INSERT INTO dispatch_records (order_id, rider_id, dispatch_score, distance, route_similarity, fulfillment_rate, supply_demand_ratio) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
        orderId, rider.user_id, result.score, result.distance, result.routeSimilarity, result.fulfillmentRate, result.supplyDemandRatio
      );
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  return {
    success: true,
    orderId,
    candidates: candidates.slice(0, 5),
    bestMatch: candidates[0] || null,
    totalCandidates: candidates.length
  };
};

export const getDispatchRules = () => {
  return db.prepare(`SELECT * FROM dispatch_rules WHERE is_active = 1`).all();
};

export const updateDispatchRules = (ruleId, updates) => {
  const existing = db.prepare(`SELECT * FROM dispatch_rules WHERE id = ?`).get(ruleId);
  if (!existing) return { success: false, error: 'Rule not found' };

  const { name, weight_distance, weight_route, weight_fulfillment, weight_supply_demand, max_distance, min_fulfillment_rate } = updates;
  const totalWeight = (weight_distance || existing.weight_distance) +
    (weight_route || existing.weight_route) +
    (weight_fulfillment || existing.weight_fulfillment) +
    (weight_supply_demand || existing.weight_supply_demand);

  if (Math.abs(totalWeight - 1.0) > 0.01) {
    return { success: false, error: `Weights must sum to 1.0, current sum: ${totalWeight}` };
  }

  db.prepare(`UPDATE dispatch_rules SET name = ?, weight_distance = ?, weight_route = ?, weight_fulfillment = ?, weight_supply_demand = ?, max_distance = ?, min_fulfillment_rate = ?, updated_at = ? WHERE id = ?`).run(
    name || existing.name,
    weight_distance || existing.weight_distance,
    weight_route || existing.weight_route,
    weight_fulfillment || existing.weight_fulfillment,
    weight_supply_demand || existing.weight_supply_demand,
    max_distance || existing.max_distance,
    min_fulfillment_rate || existing.min_fulfillment_rate,
    Math.floor(Date.now() / 1000),
    ruleId
  );

  return { success: true, rule: db.prepare(`SELECT * FROM dispatch_rules WHERE id = ?`).get(ruleId) };
};

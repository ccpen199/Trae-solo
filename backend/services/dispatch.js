const { getDB } = require('../db/init');
const { v4: uuidv4 } = require('uuid');

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function scoreCourier(courier, orderLat, orderLng) {
  const distance = haversineDistance(courier.latitude, courier.longitude, orderLat, orderLng);

  const distanceScore = Math.max(0, 100 - distance * 20);
  const fulfillmentScore = courier.fulfillment_rate * 40;
  const ratingScore = (courier.avg_rating / 5) * 30;
  const idleScore = courier.current_order_id ? 0 : 30;

  return {
    total: distanceScore + fulfillmentScore + ratingScore + idleScore,
    distance,
    details: { distanceScore, fulfillmentScore, ratingScore, idleScore }
  };
}

function autoDispatch(orderId) {
  const db = getDB();

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return { success: false, message: 'Order not found' };
  if (order.status !== 'pending') return { success: false, message: 'Order is not in pending status' };

  const couriers = db.prepare(`
    SELECT cp.*, u.name as user_name
    FROM courier_profiles cp
    JOIN users u ON cp.user_id = u.id
    WHERE cp.status = 'approved'
      AND cp.is_online = 1
      AND cp.current_order_id IS NULL
  `).all();

  if (couriers.length === 0) {
    return { success: false, message: 'No available couriers' };
  }

  const scored = couriers.map(c => ({
    ...c,
    scoreResult: scoreCourier(c, order.pickup_latitude, order.pickup_longitude)
  })).filter(c => c.scoreResult.distance <= 5);

  if (scored.length === 0) {
    return { success: false, message: 'No couriers within 5km range' };
  }

  scored.sort((a, b) => b.scoreResult.total - a.scoreResult.total);
  const best = scored[0];

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE orders SET courier_id = ?, status = 'dispatched', assigned_at = ?, updated_at = ?
    WHERE id = ?
  `).run(best.user_id, now, now, orderId);

  db.prepare(`
    UPDATE courier_profiles SET current_order_id = ?, updated_at = ?
    WHERE user_id = ?
  `).run(orderId, now, best.user_id);

  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, content, related_id, is_read, created_at)
    VALUES (?, ?, 'order_dispatched', '新订单派单', ?, ?, 0, ?)
  `).run(uuidv4(), best.user_id, `您有新的派单：${order.title}`, orderId, now);

  db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, content, related_id, is_read, created_at)
    VALUES (?, ?, 'order_dispatched', '骑手已派单', ?, ?, 0, ?)
  `).run(uuidv4(), order.requester_id, `您的订单已派单给${best.user_name}`, orderId, now);

  return {
    success: true,
    courier_id: best.user_id,
    courier_name: best.user_name,
    score: best.scoreResult.total,
    distance: best.scoreResult.distance
  };
}

function reassignOrder(orderId) {
  const db = getDB();

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return { success: false, message: 'Order not found' };

  if (order.courier_id) {
    db.prepare(`
      UPDATE courier_profiles SET current_order_id = NULL, updated_at = ?
      WHERE user_id = ?
    `).run(new Date().toISOString(), order.courier_id);
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE orders SET status = 'pending', courier_id = NULL, assigned_at = NULL, updated_at = ?
    WHERE id = ?
  `).run(now, orderId);

  return autoDispatch(orderId);
}

function checkTimeouts() {
  const db = getDB();
  const now = new Date().toISOString();

  const timeoutOrders = db.prepare(`
    SELECT * FROM orders
    WHERE status IN ('dispatched', 'accepted', 'arrived', 'in_progress')
      AND deadline < ?
  `).all(now);

  const results = [];
  for (const order of timeoutOrders) {
    db.prepare(`
      UPDATE orders SET status = 'timeout', timeout_at = ?, updated_at = ?
      WHERE id = ?
    `).run(now, now, order.id);

    if (order.courier_id) {
      db.prepare(`
        UPDATE courier_profiles SET current_order_id = NULL, updated_at = ?
        WHERE user_id = ?
      `).run(now, order.courier_id);

      db.prepare(`
        INSERT INTO notifications (id, user_id, type, title, content, related_id, is_read, created_at)
        VALUES (?, ?, 'order_timeout', '订单超时', ?, ?, 0, ?)
      `).run(uuidv4(), order.courier_id, `订单 ${order.order_no} 已超时`, order.id, now);
    }

    db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, content, related_id, is_read, created_at)
      VALUES (?, ?, 'order_timeout', '订单超时', ?, ?, 0, ?)
    `).run(uuidv4(), order.requester_id, `您的订单 ${order.order_no} 已超时`, order.id, now);

    results.push(order.id);
  }

  return results;
}

module.exports = { autoDispatch, reassignOrder, checkTimeouts, haversineDistance };

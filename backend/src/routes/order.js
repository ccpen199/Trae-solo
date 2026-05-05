const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, checkVerification, checkDeposit, checkActiveRide } = require('../middleware/auth');

const generateOrderNo = () => {
  const date = new Date();
  const timestamp = date.getTime().toString().slice(-10);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `JT${timestamp}${random}`;
};

const calculatePrice = (durationMinutes) => {
  const rule = db.prepare('SELECT * FROM pricing_rules WHERE is_active = 1 LIMIT 1').get();
  
  if (!rule) {
    return { amount: 0, breakdown: [] };
  }

  if (durationMinutes <= rule.free_protection_minutes) {
    return { 
      amount: 0, 
      breakdown: [{ type: 'free', description: `${rule.free_protection_minutes}分钟内免费` }]
    };
  }

  let amount = rule.base_price;
  const remaining = durationMinutes - rule.base_duration;
  
  const breakdown = [{
    type: 'base',
    duration: Math.min(durationMinutes, rule.base_duration),
    price: rule.base_price,
    description: `起步${rule.base_duration}分钟`
  }];

  if (remaining > 0) {
    const additionalPeriods = Math.ceil(remaining / rule.additional_duration);
    const additionalAmount = additionalPeriods * rule.additional_price;
    amount += additionalAmount;
    
    breakdown.push({
      type: 'additional',
      duration: additionalPeriods * rule.additional_duration,
      price: additionalAmount,
      description: `超时${additionalPeriods * rule.additional_duration}分钟`
    });
  }

  if (amount > rule.max_daily_price) {
    amount = rule.max_daily_price;
    breakdown.push({
      type: 'cap',
      price: -1,
      description: `每日封顶优惠`
    });
  }

  return { amount, breakdown, finalAmount: amount };
};

const isInParkingZone = (lat, lng) => {
  const zones = db.prepare('SELECT * FROM parking_zones WHERE status = ?').all('active');
  
  for (const zone of zones) {
    const R = 6371000;
    const dLat = (lat - zone.latitude) * Math.PI / 180;
    const dLng = (lng - zone.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat * Math.PI / 180) * Math.cos(zone.latitude * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    if (distance <= zone.radius) {
      return { inZone: true, zone };
    }
  }
  return { inZone: false, zone: null };
};

router.post('/create', authenticateToken, checkVerification, checkDeposit, checkActiveRide, (req, res) => {
  const { bikeId, startLatitude, startLongitude } = req.body;

  if (!bikeId) {
    return res.status(400).json({ error: '请选择车辆' });
  }

  const bike = db.prepare('SELECT * FROM bikes WHERE id = ?').get(bikeId);
  
  if (!bike) {
    return res.status(404).json({ error: '车辆不存在' });
  }

  if (bike.status !== 'available') {
    return res.status(400).json({ error: '车辆不可用' });
  }

  if (bike.battery < 20) {
    return res.status(400).json({ error: '车辆电量不足，请换一辆车' });
  }

  const orderNo = generateOrderNo();

  db.prepare('BEGIN TRANSACTION').run();

  try {
    const result = db.prepare(`
      INSERT INTO orders (order_no, user_id, bike_id, start_latitude, start_longitude, status)
      VALUES (?, ?, ?, ?, ?, 'riding')
    `).run(orderNo, req.user.id, bikeId, startLatitude || bike.latitude, startLongitude || bike.longitude);

    db.prepare(`
      UPDATE bikes SET status = 'in_use', updated_at = datetime('now')
      WHERE id = ?
    `).run(bikeId);

    db.prepare('COMMIT').run();

    const order = db.prepare(`
      SELECT o.*, b.bike_code, b.plate_number, b.battery, b.max_range
      FROM orders o
      JOIN bikes b ON o.bike_id = b.id
      WHERE o.id = ?
    `).get(result.lastInsertRowid);

    res.json({
      success: true,
      message: '开锁成功，骑行已开始',
      order: {
        id: order.id,
        orderNo: order.order_no,
        bikeCode: order.bike_code,
        plateNumber: order.plate_number,
        startTime: order.start_time,
        battery: order.battery,
        availableRange: Math.round(order.max_range * (order.battery / 100)),
        status: order.status
      }
    });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    throw error;
  }
});

router.get('/active', authenticateToken, (req, res) => {
  const order = db.prepare(`
    SELECT o.id, o.order_no, o.start_time, o.start_latitude, o.start_longitude,
           b.bike_code, b.plate_number, b.battery, b.max_range, b.latitude, b.longitude
    FROM orders o
    JOIN bikes b ON o.bike_id = b.id
    WHERE o.user_id = ? AND o.status = 'riding'
  `).get(req.user.id);

  if (!order) {
    return res.json({
      success: true,
      hasActiveOrder: false,
      order: null
    });
  }

  const startTime = new Date(order.start_time);
  const now = new Date();
  const durationMs = now - startTime;
  const durationMinutes = Math.floor(durationMs / 60000);
  const priceInfo = calculatePrice(durationMinutes);

  res.json({
    success: true,
    hasActiveOrder: true,
    order: {
      id: order.id,
      orderNo: order.order_no,
      bikeCode: order.bike_code,
      plateNumber: order.plate_number,
      startTime: order.start_time,
      duration: durationMinutes,
      durationFormatted: formatDuration(durationMinutes),
      currentAmount: priceInfo.amount,
      battery: order.battery,
      availableRange: Math.round(order.max_range * (order.battery / 100)),
      bikeLocation: {
        latitude: order.latitude,
        longitude: order.longitude
      },
      startLocation: {
        latitude: order.start_latitude,
        longitude: order.start_longitude
      },
      priceInfo
    }
  });
});

router.post('/end', authenticateToken, (req, res) => {
  const { orderId, endLatitude, endLongitude } = req.body;

  const order = db.prepare(`
    SELECT o.*, b.bike_code, b.plate_number
    FROM orders o
    JOIN bikes b ON o.bike_id = b.id
    WHERE o.id = ? AND o.user_id = ?
  `).get(orderId, req.user.id);

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.status !== 'riding') {
    return res.status(400).json({ error: '该订单已结束' });
  }

  const parkingCheck = isInParkingZone(endLatitude || 39.9042, endLongitude || 116.4074);
  
  const startTime = new Date(order.start_time);
  const endTime = new Date();
  const durationMs = endTime - startTime;
  const durationMinutes = Math.max(1, Math.floor(durationMs / 60000));

  const priceInfo = calculatePrice(durationMinutes);
  const baseDistance = 1.5;
  const avgSpeedKmPerMin = 0.2;
  const distance = Math.round((baseDistance + durationMinutes * avgSpeedKmPerMin) * 10) / 10;

  db.prepare('BEGIN TRANSACTION').run();

  try {
    db.prepare(`
      UPDATE orders 
      SET status = 'completed', end_time = ?, end_latitude = ?, end_longitude = ?,
          duration = ?, distance = ?, amount = ?, final_amount = ?
      WHERE id = ?
    `).run(
      endTime.toISOString(),
      endLatitude || 39.9042,
      endLongitude || 116.4074,
      durationMinutes,
      distance,
      priceInfo.amount,
      priceInfo.finalAmount,
      orderId
    );

    db.prepare(`
      UPDATE bikes 
      SET status = 'available', latitude = ?, longitude = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(endLatitude || 39.9042, endLongitude || 116.4074, order.bike_id);

    db.prepare('COMMIT').run();

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

    res.json({
      success: true,
      message: '还车成功',
      inParkingZone: parkingCheck.inZone,
      parkingZone: parkingCheck.zone,
      order: {
        id: updatedOrder.id,
        orderNo: updatedOrder.order_no,
        bikeCode: order.bike_code,
        plateNumber: order.plate_number,
        startTime: updatedOrder.start_time,
        endTime: updatedOrder.end_time,
        duration: durationMinutes,
        durationFormatted: formatDuration(durationMinutes),
        distance,
        distanceFormatted: `${distance.toFixed(1)}公里`,
        amount: priceInfo.finalAmount,
        amountFormatted: `¥${priceInfo.finalAmount.toFixed(2)}`,
        priceBreakdown: priceInfo.breakdown,
        status: 'completed',
        paymentStatus: 'pending'
      }
    });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    throw error;
  }
});

router.post('/pay', authenticateToken, (req, res) => {
  const { orderId, paymentMethod } = req.body;

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, req.user.id);

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.payment_status === 'paid') {
    return res.status(400).json({ error: '该订单已支付' });
  }

  const transactionId = `TX${Date.now()}`;

  db.prepare('BEGIN TRANSACTION').run();

  try {
    db.prepare(`
      INSERT INTO payments (order_id, user_id, amount, payment_method, transaction_id, status, paid_at)
      VALUES (?, ?, ?, ?, ?, 'completed', datetime('now'))
    `).run(orderId, req.user.id, order.final_amount, paymentMethod || 'balance', transactionId);

    db.prepare(`
      UPDATE orders SET payment_status = 'paid' WHERE id = ?
    `).run(orderId);

    db.prepare('COMMIT').run();

    res.json({
      success: true,
      message: '支付成功',
      transactionId,
      amount: order.final_amount
    });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    throw error;
  }
});

router.post('/auto-end', authenticateToken, (req, res) => {
  const { orderId, reason } = req.body;

  const order = db.prepare(`
    SELECT o.*, b.battery
    FROM orders o
    JOIN bikes b ON o.bike_id = b.id
    WHERE o.id = ? AND o.user_id = ? AND o.status = 'riding'
  `).get(orderId, req.user.id);

  if (!order) {
    return res.status(404).json({ error: '订单不存在或已结束' });
  }

  const startTime = new Date(order.start_time);
  const now = new Date();
  const durationMinutes = Math.floor((now - startTime) / 60000);

  const reasons = {
    low_battery: '车辆电量过低',
    timeout: '停车时间过长',
    manual: '用户主动还车'
  };

  const priceInfo = calculatePrice(durationMinutes);

  db.prepare('BEGIN TRANSACTION').run();

  try {
    db.prepare(`
      UPDATE orders 
      SET status = 'completed', end_time = ?, duration = ?, amount = ?, final_amount = ?
      WHERE id = ?
    `).run(now.toISOString(), durationMinutes, priceInfo.amount, priceInfo.finalAmount, orderId);

    db.prepare(`
      UPDATE bikes SET status = 'available', updated_at = datetime('now')
      WHERE id = ?
    `).run(order.bike_id);

    db.prepare('COMMIT').run();

    res.json({
      success: true,
      message: reasons[reason] || '系统自动还车',
      autoEndReason: reason,
      order: {
        id: orderId,
        duration: durationMinutes,
        amount: priceInfo.finalAmount
      }
    });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    throw error;
  }
});

function formatDuration(minutes) {
  if (!minutes) return '0分钟';
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
}

module.exports = router;

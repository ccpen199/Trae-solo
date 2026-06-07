const express = require('express');
const db = require('../db/init');
const { authenticateToken } = require('./auth');

const router = express.Router();

const VEHICLE_PRICES = {
  '小面': { base: 35, per_km: 3.5, weight_limit: 500, volume_limit: 2.5 },
  '中面': { base: 58, per_km: 4.2, weight_limit: 1000, volume_limit: 4.5 },
  '金杯': { base: 85, per_km: 4.8, weight_limit: 1500, volume_limit: 6 },
  '厢货': { base: 120, per_km: 5.5, weight_limit: 3000, volume_limit: 12 },
  '平板': { base: 150, per_km: 6.5, weight_limit: 5000, volume_limit: 18 }
};

const TIME_MULTIPLIERS = {
  peak: 1.3,
  night: 1.2,
  normal: 1.0
};

const calculatePrice = (distance, vehicleType, cargoWeight, cargoVolume, loadingRequirement) => {
  const vehicle = VEHICLE_PRICES[vehicleType] || VEHICLE_PRICES['小面'];
  const hour = new Date().getHours();
  
  let timeMultiplier = TIME_MULTIPLIERS.normal;
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    timeMultiplier = TIME_MULTIPLIERS.peak;
  } else if (hour >= 22 || hour < 6) {
    timeMultiplier = TIME_MULTIPLIERS.night;
  }

  let weightSurcharge = 0;
  if (cargoWeight && cargoWeight > vehicle.weight_limit) {
    weightSurcharge = (cargoWeight - vehicle.weight_limit) * 2;
  }

  let volumeSurcharge = 0;
  if (cargoVolume && cargoVolume > vehicle.volume_limit) {
    volumeSurcharge = (cargoVolume - vehicle.volume_limit) * 15;
  }

  let loadingSurcharge = 0;
  if (loadingRequirement === 'need_help') {
    loadingSurcharge = 50;
  } else if (loadingRequirement === 'heavy') {
    loadingSurcharge = 100;
  }

  const basePrice = vehicle.base + (distance * vehicle.per_km);
  const totalPrice = Math.round((basePrice + weightSurcharge + volumeSurcharge + loadingSurcharge) * timeMultiplier);

  return {
    total: totalPrice,
    breakdown: {
      base: Math.round(vehicle.base),
      distance: Math.round(distance * vehicle.per_km),
      weight_surcharge: Math.round(weightSurcharge),
      volume_surcharge: Math.round(volumeSurcharge),
      loading_surcharge: Math.round(loadingSurcharge),
      time_multiplier: timeMultiplier
    }
  };
};

router.post('/estimate', (req, res) => {
  const { distance, vehicle_type, cargo_weight, cargo_volume, loading_requirement } = req.body;

  if (!distance || !vehicle_type) {
    return res.status(400).json({ error: '距离和车型不能为空' });
  }

  const priceInfo = calculatePrice(distance, vehicle_type, cargo_weight, cargo_volume, loading_requirement);
  
  res.json({
    price: priceInfo.total,
    price_detail: priceInfo.breakdown,
    estimated_time: Math.round(distance * 3)
  });
});

router.post('/', authenticateToken, (req, res) => {
  if (req.user.type !== 'shipper') {
    return res.status(403).json({ error: '只有货主可以创建订单' });
  }

  const {
    cargo_type, cargo_weight, cargo_volume, cargo_desc,
    start_address, start_lat, start_lng,
    end_address, end_lat, end_lng,
    distance, vehicle_type, loading_requirement,
    insured_value, remark
  } = req.body;

  if (!cargo_type || !start_address || !end_address || !distance || !vehicle_type) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const priceInfo = calculatePrice(distance, vehicle_type, cargo_weight, cargo_volume, loading_requirement);
  const insuranceFee = insured_value ? Math.round(insured_value * 0.003) : 0;

  const orderNo = 'FY' + Date.now() + Math.floor(Math.random() * 1000);

  const result = db.prepare(`
    INSERT INTO orders (
      order_no, shipper_id, cargo_type, cargo_weight, cargo_volume, cargo_desc,
      start_address, start_lat, start_lng, end_address, end_lat, end_lng,
      distance, vehicle_type, loading_requirement, price, price_detail,
      insured_value, insurance_fee, remark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderNo, req.user.id, cargo_type, cargo_weight || 0, cargo_volume || 0, cargo_desc || '',
    start_address, start_lat, start_lng, end_address, end_lat, end_lng,
    distance, vehicle_type, loading_requirement || '',
    priceInfo.total + insuranceFee, JSON.stringify(priceInfo.breakdown),
    insured_value || 0, insuranceFee, remark || ''
  );

  if (insured_value && insured_value > 0) {
    const policyNo = 'INS' + Date.now() + Math.floor(Math.random() * 1000);
    db.prepare(`
      INSERT INTO insurance_orders (order_id, policy_no, insured_value, premium)
      VALUES (?, ?, ?, ?)
    `).run(result.lastInsertRowid, policyNo, insured_value, insuranceFee);
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(result.lastInsertRowid);
  
  res.json({
    success: true,
    order: {
      ...order,
      price_detail: JSON.parse(order.price_detail)
    }
  });
});

router.get('/nearby-drivers', authenticateToken, (req, res) => {
  const { lat, lng, radius = 5 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: '缺少坐标参数' });
  }

  const drivers = db.prepare(`
    SELECT 
      id, name, phone, vehicle_type, vehicle_number, service_score,
      lat, lng, online,
      (6371 * acos(cos(radians(?)) * cos(radians(lat)) * cos(radians(lng) - radians(?)) + sin(radians(?)) * sin(radians(lat)))) AS distance
    FROM drivers 
    WHERE status = 'approved' AND online = 1
    HAVING distance < ?
    ORDER BY distance ASC
    LIMIT 10
  `).all(parseFloat(lat), parseFloat(lng), parseFloat(lat), parseFloat(radius));

  res.json({ drivers });
});

router.get('/my', authenticateToken, (req, res) => {
  const { status } = req.query;
  let orders;

  if (req.user.type === 'shipper') {
    if (status) {
      orders = db.prepare('SELECT * FROM orders WHERE shipper_id = ? AND status = ? ORDER BY created_at DESC LIMIT 50')
        .all(req.user.id, status);
    } else {
      orders = db.prepare('SELECT * FROM orders WHERE shipper_id = ? ORDER BY created_at DESC LIMIT 50')
        .all(req.user.id);
    }
  } else if (req.user.type === 'driver') {
    if (status) {
      orders = db.prepare('SELECT * FROM orders WHERE driver_id = ? AND status = ? ORDER BY created_at DESC LIMIT 50')
        .all(req.user.id, status);
    } else {
      orders = db.prepare('SELECT * FROM orders WHERE driver_id = ? OR status = "pending" ORDER BY created_at DESC LIMIT 50')
        .all(req.user.id);
    }
  }

  orders = orders.map(order => ({
    ...order,
    price_detail: order.price_detail ? JSON.parse(order.price_detail) : null
  }));

  res.json({ orders });
});

router.get('/:id', authenticateToken, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (req.user.type === 'shipper' && order.shipper_id !== req.user.id) {
    return res.status(403).json({ error: '无权查看此订单' });
  }

  if (req.user.type === 'driver' && order.driver_id && order.driver_id !== req.user.id) {
    return res.status(403).json({ error: '无权查看此订单' });
  }

  const shipper = db.prepare('SELECT id, name, phone FROM shippers WHERE id = ?').get(order.shipper_id);
  let driver = null;
  if (order.driver_id) {
    driver = db.prepare('SELECT id, name, phone, vehicle_type, vehicle_number, service_score FROM drivers WHERE id = ?').get(order.driver_id);
  }

  const evidences = db.prepare('SELECT * FROM order_evidences WHERE order_id = ?').all(req.params.id);
  const insurance = db.prepare('SELECT * FROM insurance_orders WHERE order_id = ?').get(req.params.id);

  res.json({
    order: {
      ...order,
      price_detail: order.price_detail ? JSON.parse(order.price_detail) : null
    },
    shipper,
    driver,
    evidences,
    insurance
  });
});

router.post('/:id/accept', authenticateToken, (req, res) => {
  if (req.user.type !== 'driver') {
    return res.status(403).json({ error: '只有司机可以接单' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.status !== 'pending') {
    return res.status(400).json({ error: '订单已被接单或已取消' });
  }

  db.prepare(`
    UPDATE orders 
    SET driver_id = ?, status = 'accepted', accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.user.id, req.params.id);

  db.prepare('UPDATE drivers SET order_count = order_count + 1 WHERE id = ?').run(req.user.id);

  res.json({ success: true, message: '接单成功' });
});

router.post('/:id/pickup', authenticateToken, (req, res) => {
  if (req.user.type !== 'driver') {
    return res.status(403).json({ error: '只有司机可以操作' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.driver_id !== req.user.id) {
    return res.status(403).json({ error: '无权操作此订单' });
  }

  db.prepare(`
    UPDATE orders 
    SET status = 'picked', picked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);

  res.json({ success: true, message: '已确认取货' });
});

router.post('/:id/deliver', authenticateToken, (req, res) => {
  if (req.user.type !== 'driver') {
    return res.status(403).json({ error: '只有司机可以操作' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.driver_id !== req.user.id) {
    return res.status(403).json({ error: '无权操作此订单' });
  }

  db.prepare(`
    UPDATE orders 
    SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);

  res.json({ success: true, message: '已确认送达' });
});

router.post('/:id/complete', authenticateToken, (req, res) => {
  if (req.user.type !== 'shipper') {
    return res.status(403).json({ error: '只有货主可以确认完成' });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.shipper_id !== req.user.id) {
    return res.status(403).json({ error: '无权操作此订单' });
  }

  db.prepare(`
    UPDATE orders 
    SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);

  res.json({ success: true, message: '订单已完成' });
});

router.post('/:id/review', authenticateToken, (req, res) => {
  if (req.user.type !== 'shipper') {
    return res.status(403).json({ error: '只有货主可以评价' });
  }

  const { score, content } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (order.shipper_id !== req.user.id) {
    return res.status(403).json({ error: '无权操作此订单' });
  }

  const existing = db.prepare('SELECT id FROM reviews WHERE order_id = ?').get(req.params.id);
  if (existing) {
    return res.status(400).json({ error: '已评价过此订单' });
  }

  db.prepare(`
    INSERT INTO reviews (order_id, shipper_id, driver_id, score, content)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, req.user.id, order.driver_id, score, content || '');

  const avgScore = db.prepare(`
    SELECT AVG(r.score) as avg_score 
    FROM reviews r
    WHERE r.driver_id = ?
  `).get(order.driver_id);

  db.prepare('UPDATE drivers SET service_score = ? WHERE id = ?')
    .run(Math.round(avgScore.avg_score * 10) / 10, order.driver_id);

  res.json({ success: true, message: '评价成功' });
});

router.post('/:id/complaint', authenticateToken, (req, res) => {
  const { type, content } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  db.prepare(`
    INSERT INTO complaints (order_id, complainant_id, type, content)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, req.user.id, type, content);

  res.json({ success: true, message: '投诉已提交' });
});

router.post('/:id/sign', authenticateToken, (req, res) => {
  const { sign_type } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  if (req.user.type === 'driver' && order.driver_id !== req.user.id) {
    return res.status(403).json({ error: '无权签署此订单' });
  }

  if (req.user.type === 'shipper' && order.shipper_id !== req.user.id) {
    return res.status(403).json({ error: '无权签署此订单' });
  }

  const signField = sign_type === 'shipper' ? 'shipper_signed_at' : 'driver_signed_at';
  
  db.prepare(`
    UPDATE orders 
    SET ${signField} = CURRENT_TIMESTAMP, 
        signed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);

  res.json({ success: true, message: '电子签署成功' });
});

module.exports = router;

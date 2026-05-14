const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');

const getCarTypes = async (req, res) => {
  const carTypes = db.prepare('SELECT * FROM car_types ORDER BY base_price ASC').all();
  res.json({
    success: true,
    data: carTypes
  });
};

const calculateRoute = async (req, res) => {
  const { startLat, startLng, endLat, endLng } = req.body;
  
  if (!startLat || !startLng || !endLat || !endLng) {
    return res.status(400).json({ success: false, message: '请选择起点和终点' });
  }

  const R = 6371;
  const dLat = (endLat - startLat) * Math.PI / 180;
  const dLng = (endLng - startLng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  const distanceKm = Math.max(distance, 1.5);
  const durationMin = Math.round(distanceKm * 3 + 5);

  const carTypes = db.prepare('SELECT * FROM car_types').all();
  const prices = carTypes.map(ct => {
    const basePrice = ct.base_price || 0;
    const kmPrice = (distanceKm * ct.per_km_price) || 0;
    const timePrice = (durationMin * ct.per_minute_price) || 0;
    const total = Math.round((basePrice + kmPrice + timePrice) * 100) / 100;
    
    return {
      car_type_id: ct.id,
      car_type_name: ct.display_name,
      estimated_price: total,
      price_detail: {
        base_price: basePrice,
        per_km: ct.per_km_price,
        per_minute: ct.per_minute_price,
        distance_km: distanceKm
      }
    };
  });

  res.json({
    success: true,
    data: {
      distance_km: distanceKm,
      duration_min: durationMin,
      prices
    }
  });
};

const createOrder = async (req, res) => {
  const user_id = req.user.id;
  const {
    carTypeId,
    startName,
    startAddress,
    startLat,
    startLng,
    endName,
    endAddress,
    endLat,
    endLng,
    serviceType,
    bookTime
  } = req.body;

  if (!carTypeId || !startName || !startLat || !startLng || !endName || !endLat || !endLng) {
    return res.status(400).json({ success: false, message: '订单信息不完整' });
  }

  const carType = db.prepare('SELECT * FROM car_types WHERE id = ?').get(carTypeId);
  if (!carType) {
    return res.status(400).json({ success: false, message: '车型不存在' });
  }

  const existingPending = db.prepare(`
    SELECT * FROM orders 
    WHERE user_id = ? AND status IN ('pending', 'accepted', 'in_progress')
  `).get(user_id);

  if (existingPending) {
    return res.status(400).json({ 
      success: false, 
      message: '您有进行中的订单，请先完成后再下单' 
    });
  }

  const R = 6371;
  const dLat = (endLat - startLat) * Math.PI / 180;
  const dLng = (endLng - startLng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  const distanceKm = Math.max(distance, 1.5);
  const durationMin = Math.round(distanceKm * 3 + 5);
  const estimatedPrice = Math.round((
    carType.base_price + 
    distanceKm * carType.per_km_price + 
    durationMin * carType.per_minute_price
  ) * 100) / 100;

  const orderId = uuidv4();

  db.prepare(`
    INSERT INTO orders (
      id, user_id, car_type_id, 
      start_name, start_address, start_lat, start_lng,
      end_name, end_address, end_lat, end_lng,
      distance_km, duration_min, estimated_price,
      service_type, book_time, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderId, user_id, carTypeId,
    startName, startAddress || '', startLat, startLng,
    endName, endAddress || '', endLat, endLng,
    distanceKm, durationMin, estimatedPrice,
    serviceType || 'express', bookTime || null, 'pending'
  );

  setTimeout(() => {
    const idleDriver = db.prepare('SELECT * FROM drivers WHERE status = ? ORDER BY RANDOM() LIMIT 1').get('idle');
    if (idleDriver) {
      db.prepare('UPDATE drivers SET status = ? WHERE id = ?').run('busy', idleDriver.id);
      db.prepare(`
        UPDATE orders 
        SET driver_id = ?, status = ?, accepted_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(idleDriver.id, 'accepted', orderId);
    }
  }, 2000);

  const order = db.prepare(`
    SELECT o.*, ct.display_name as car_type_name
    FROM orders o 
    LEFT JOIN car_types ct ON o.car_type_id = ct.id
    WHERE o.id = ?
  `).get(orderId);

  res.json({
    success: true,
    message: '订单创建成功，正在为您派单',
    data: order
  });
};

const getOrderById = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const order = db.prepare(`
    SELECT o.*, ct.display_name as car_type_name, ct.icon as car_type_icon,
           d.name as driver_name, d.phone as driver_phone, d.avatar as driver_avatar,
           d.car_model, d.car_number, d.car_color, d.rating as driver_rating
    FROM orders o 
    LEFT JOIN car_types ct ON o.car_type_id = ct.id
    LEFT JOIN drivers d ON o.driver_id = d.id
    WHERE o.id = ? AND o.user_id = ?
  `).get(id, user_id);

  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }

  res.json({
    success: true,
    data: order
  });
};

const getCurrentOrder = async (req, res) => {
  const user_id = req.user.id;

  const order = db.prepare(`
    SELECT o.*, ct.display_name as car_type_name, ct.icon as car_type_icon,
           d.name as driver_name, d.phone as driver_phone, d.avatar as driver_avatar,
           d.car_model, d.car_number, d.car_color, d.rating as driver_rating
    FROM orders o 
    LEFT JOIN car_types ct ON o.car_type_id = ct.id
    LEFT JOIN drivers d ON o.driver_id = d.id
    WHERE o.user_id = ? AND o.status IN ('pending', 'accepted', 'in_progress')
    ORDER BY o.created_at DESC
    LIMIT 1
  `).get(user_id);

  res.json({
    success: true,
    data: order || null
  });
};

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const user_id = req.user.id;

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, user_id);
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }

  const validTransitions = {
    'pending': ['accepted', 'cancelled'],
    'accepted': ['in_progress', 'cancelled'],
    'in_progress': ['completed']
  };

  if (!validTransitions[order.status]?.includes(status)) {
    return res.status(400).json({ success: false, message: '无效的状态变更' });
  }

  const now = new Date().toISOString();
  let updateSql = 'UPDATE orders SET status = ?';
  const params = [status];

  if (status === 'in_progress') {
    updateSql += ', started_at = ?';
    params.push(now);
  } else if (status === 'completed') {
    updateSql += ', completed_at = ?, actual_price = ?';
    params.push(now, order.estimated_price);
  }

  updateSql += ' WHERE id = ?';
  params.push(id);

  db.prepare(updateSql).run(...params);

  if (order.driver_id && (status === 'completed' || status === 'cancelled')) {
    db.prepare('UPDATE drivers SET status = ? WHERE id = ?').run('idle', order.driver_id);
  }

  const updatedOrder = db.prepare(`
    SELECT o.*, ct.display_name as car_type_name,
           d.name as driver_name, d.phone as driver_phone, d.avatar as driver_avatar,
           d.car_model, d.car_number, d.car_color, d.rating as driver_rating
    FROM orders o 
    LEFT JOIN car_types ct ON o.car_type_id = ct.id
    LEFT JOIN drivers d ON o.driver_id = d.id
    WHERE o.id = ?
  `).get(id);

  res.json({
    success: true,
    message: '订单状态已更新',
    data: updatedOrder
  });
};

const getOrderHistory = async (req, res) => {
  const user_id = req.user.id;
  const { status, limit = 20, offset = 0 } = req.query;

  let query = `
    SELECT o.*, ct.display_name as car_type_name, ct.icon as car_type_icon
    FROM orders o 
    LEFT JOIN car_types ct ON o.car_type_id = ct.id
    WHERE o.user_id = ?
  `;
  const params = [user_id];

  if (status) {
    query += ' AND o.status = ?';
    params.push(status);
  }

  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const orders = db.prepare(query).all(...params);

  res.json({
    success: true,
    data: orders
  });
};

const simulateDriverArrive = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, user_id);
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }

  if (order.status !== 'accepted') {
    return res.status(400).json({ success: false, message: '订单状态不正确' });
  }

  db.prepare('UPDATE orders SET status = ?, started_at = CURRENT_TIMESTAMP WHERE id = ?').run('in_progress', id);

  const updatedOrder = db.prepare(`
    SELECT o.*, ct.display_name as car_type_name,
           d.name as driver_name, d.phone as driver_phone, d.avatar as driver_avatar,
           d.car_model, d.car_number, d.car_color, d.rating as driver_rating
    FROM orders o 
    LEFT JOIN car_types ct ON o.car_type_id = ct.id
    LEFT JOIN drivers d ON o.driver_id = d.id
    WHERE o.id = ?
  `).get(id);

  res.json({
    success: true,
    message: '行程已开始',
    data: updatedOrder
  });
};

const simulateTripComplete = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(id, user_id);
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }

  if (order.status !== 'in_progress') {
    return res.status(400).json({ success: false, message: '订单状态不正确' });
  }

  db.prepare(`
    UPDATE orders 
    SET status = ?, completed_at = CURRENT_TIMESTAMP, actual_price = ?
    WHERE id = ?
  `).run('completed', order.estimated_price, id);

  if (order.driver_id) {
    db.prepare('UPDATE drivers SET status = ? WHERE id = ?').run('idle', order.driver_id);
  }

  const updatedOrder = db.prepare(`
    SELECT o.*, ct.display_name as car_type_name,
           d.name as driver_name, d.phone as driver_phone, d.avatar as driver_avatar,
           d.car_model, d.car_number, d.car_color, d.rating as driver_rating
    FROM orders o 
    LEFT JOIN car_types ct ON o.car_type_id = ct.id
    LEFT JOIN drivers d ON o.driver_id = d.id
    WHERE o.id = ?
  `).get(id);

  res.json({
    success: true,
    message: '行程已结束',
    data: updatedOrder
  });
};

module.exports = {
  getCarTypes,
  calculateRoute,
  createOrder,
  getOrderById,
  getCurrentOrder,
  updateOrderStatus,
  getOrderHistory,
  simulateDriverArrive,
  simulateTripComplete
};
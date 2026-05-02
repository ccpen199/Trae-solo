const db = require('../config/database');
const { 
  generateId, 
  generateOrderNo, 
  calculateDistance, 
  calculateFee,
  getOrderStatusActions,
  getNextStatus
} = require('../utils/helpers');
const statusFlowService = require('./statusFlowService');
const messageService = require('./messageService');

const createOrder = (userId, vehicleId, lockId, locationData = {}) => {
  const orderId = generateId();
  const orderNo = generateOrderNo();
  const now = new Date().toISOString();

  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ? AND status = ?').get(vehicleId, 'available');
  if (!vehicle) {
    throw new Error('车辆不可用');
  }

  const lock = db.prepare('SELECT * FROM locks WHERE id = ? AND vehicle_id = ? AND status = ?').get(lockId, vehicleId, 'locked');
  if (!lock) {
    throw new Error('锁状态异常');
  }

  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, order_no, user_id, vehicle_id, lock_id, status,
      start_lat, start_lng, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertOrder.run(
    orderId, orderNo, userId, vehicleId, lockId, 'pending_scan',
    locationData.lat, locationData.lng, now, now
  );

  db.prepare('UPDATE vehicles SET status = ?, updated_at = ? WHERE id = ?').run('in_use', now, vehicleId);
  db.prepare('UPDATE locks SET status = ?, updated_at = ? WHERE id = ?').run('unlocked', now, lockId);

  statusFlowService.recordStatusFlow(
    'order', orderId, null, 'pending_scan',
    { id: userId, role: 'rider' }, 'create_order', '扫码创建订单'
  );

  messageService.createMessage(
    'order_created',
    '订单创建成功',
    `订单 ${orderNo} 已创建，车辆 ${vehicle.bike_code} 已解锁，请开始骑行`,
    { targetUserId: userId, orderId, vehicleId }
  );

  return { orderId, orderNo };
};

const startRide = (orderId, userId, locationData = {}) => {
  const now = new Date().toISOString();

  const order = db.prepare(`
    SELECT o.*, v.bike_code FROM orders o 
    JOIN vehicles v ON o.vehicle_id = v.id 
    WHERE o.id = ? AND o.user_id = ?
  `).get(orderId, userId);

  if (!order) {
    throw new Error('订单不存在');
  }

  if (order.status !== 'pending_ride' && order.status !== 'pending_scan') {
    throw new Error(`订单状态 ${order.status} 不允许开始骑行`);
  }

  const actions = getOrderStatusActions(order.status, 'rider');
  if (!actions.includes('start_ride')) {
    throw new Error('无权限执行此操作');
  }

  const nextStatus = getNextStatus(order.status, 'start_ride') || 'riding';

  db.prepare(`
    UPDATE orders SET 
      status = ?, start_time = ?, 
      start_lat = COALESCE(?, start_lat),
      start_lng = COALESCE(?, start_lng),
      updated_at = ? 
    WHERE id = ?
  `).run(nextStatus, now, locationData.lat, locationData.lng, now, orderId);

  const insertDetail = db.prepare(`
    INSERT INTO order_details (id, order_id, detail_type, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertDetail.run(generateId(), orderId, 'ride_start', JSON.stringify({ time: now, location: locationData }), now);

  statusFlowService.recordStatusFlow(
    'order', orderId, order.status, nextStatus,
    { id: userId, role: 'rider' }, 'start_ride', '开始骑行'
  );

  messageService.createMessage(
    'ride_started',
    '骑行已开始',
    `订单 ${order.order_no} 已开始骑行，请注意骑行安全`,
    { targetUserId: userId, orderId, vehicleId: order.vehicle_id }
  );

  return { orderId, status: nextStatus, startTime: now };
};

const endRide = (orderId, userId, locationData = {}) => {
  const now = new Date().toISOString();

  const order = db.prepare(`
    SELECT o.*, v.bike_code, v.location_lat, v.location_lng 
    FROM orders o 
    JOIN vehicles v ON o.vehicle_id = v.id 
    WHERE o.id = ? AND o.user_id = ?
  `).get(orderId, userId);

  if (!order) {
    throw new Error('订单不存在');
  }

  if (order.status !== 'riding') {
    throw new Error(`订单状态 ${order.status} 不允许结束骑行`);
  }

  const actions = getOrderStatusActions(order.status, 'rider');
  if (!actions.includes('end_ride')) {
    throw new Error('无权限执行此操作');
  }

  const startTime = order.start_time ? new Date(order.start_time) : new Date();
  const endTime = new Date();
  const durationMinutes = Math.max(1, Math.floor((endTime - startTime) / (1000 * 60)));

  const startLat = order.start_lat || locationData.lat;
  const startLng = order.start_lng || locationData.lng;
  const endLat = locationData.lat || order.location_lat;
  const endLng = locationData.lng || order.location_lng;

  const distanceKm = startLat && startLng && endLat && endLng
    ? calculateDistance(startLat, startLng, endLat, endLng)
    : durationMinutes * 0.2;

  const amount = calculateFee(durationMinutes, distanceKm);
  const nextStatus = getNextStatus(order.status, 'end_ride') || 'pending_billing';

  db.prepare(`
    UPDATE orders SET 
      status = ?, end_time = ?, 
      end_lat = ?, end_lng = ?,
      duration_minutes = ?, distance_km = ?,
      amount = ?, actual_amount = ?,
      updated_at = ? 
    WHERE id = ?
  `).run(
    nextStatus, now, endLat, endLng,
    durationMinutes, distanceKm, amount, amount,
    now, orderId
  );

  db.prepare('UPDATE vehicles SET status = ?, location_lat = ?, location_lng = ?, updated_at = ? WHERE id = ?')
    .run('available', endLat, endLng, now, order.vehicle_id);
  db.prepare('UPDATE locks SET status = ?, updated_at = ? WHERE id = ?').run('locked', now, order.lock_id);

  const insertDetail = db.prepare(`
    INSERT INTO order_details (id, order_id, detail_type, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertDetail.run(
    generateId(), orderId, 'ride_end', 
    JSON.stringify({ 
      time: now, 
      location: { lat: endLat, lng: endLng },
      durationMinutes,
      distanceKm,
      amount
    }), 
    now
  );

  statusFlowService.recordStatusFlow(
    'order', orderId, order.status, nextStatus,
    { id: userId, role: 'rider' }, 'end_ride', 
    `结束骑行，时长${durationMinutes}分钟，行程${distanceKm.toFixed(2)}公里，费用${amount}元`
  );

  messageService.createMessage(
    'ride_ended',
    '骑行已结束',
    `订单 ${order.order_no} 骑行结束，时长${durationMinutes}分钟，行程${distanceKm.toFixed(2)}公里，费用${amount}元，请确认并支付`,
    { targetUserId: userId, orderId, vehicleId: order.vehicle_id }
  );

  return {
    orderId,
    status: nextStatus,
    durationMinutes,
    distanceKm: distanceKm.toFixed(2),
    amount
  };
};

const confirmBilling = (orderId, userId) => {
  const now = new Date().toISOString();

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId);
  if (!order) {
    throw new Error('订单不存在');
  }

  if (order.status !== 'pending_billing') {
    throw new Error(`订单状态 ${order.status} 不允许确认计费`);
  }

  const nextStatus = getNextStatus(order.status, 'confirm_billing') || 'billing_confirmed';

  db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(nextStatus, now, orderId);

  statusFlowService.recordStatusFlow(
    'order', orderId, order.status, nextStatus,
    { id: userId, role: 'rider' }, 'confirm_billing', '确认计费'
  );

  messageService.createMessage(
    'billing_confirmed',
    '计费已确认',
    `订单 ${order.order_no} 计费已确认，应付金额 ${order.actual_amount} 元`,
    { targetUserId: userId, orderId }
  );

  return { orderId, status: nextStatus };
};

const payOrder = (orderId, userId) => {
  const now = new Date().toISOString();

  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId);
  if (!order) {
    throw new Error('订单不存在');
  }

  if (order.status !== 'billing_confirmed') {
    throw new Error(`订单状态 ${order.status} 不允许支付`);
  }

  const nextStatus = getNextStatus(order.status, 'pay') || 'completed';

  db.prepare('UPDATE orders SET status = ?, payment_status = ?, updated_at = ? WHERE id = ?')
    .run(nextStatus, 'paid', now, orderId);

  statusFlowService.recordStatusFlow(
    'order', orderId, order.status, nextStatus,
    { id: userId, role: 'rider' }, 'pay', `支付金额 ${order.actual_amount} 元`
  );

  messageService.createMessage(
    'payment_completed',
    '支付完成',
    `订单 ${order.order_no} 支付完成，金额 ${order.actual_amount} 元`,
    { targetUserId: userId, orderId }
  );

  return { orderId, status: nextStatus, paymentStatus: 'paid' };
};

const getOrderById = (orderId, userId, userRole) => {
  let query = `
    SELECT o.*, 
           v.bike_code, v.status as vehicle_status, v.battery_level,
           l.lock_code, l.status as lock_status,
           u.name as user_name, u.phone as user_phone
    FROM orders o
    JOIN vehicles v ON o.vehicle_id = v.id
    JOIN locks l ON o.lock_id = l.id
    JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `;
  const params = [orderId];

  if (userRole === 'rider') {
    query += ' AND o.user_id = ?';
    params.push(userId);
  }

  const order = db.prepare(query).get(...params);
  if (!order) {
    throw new Error('订单不存在或无权限访问');
  }

  order.availableActions = getOrderStatusActions(order.status, userRole);
  return order;
};

const getOrders = (userId, userRole, options = {}) => {
  const { status, limit = 20, offset = 0 } = options;

  let query = `
    SELECT o.*, v.bike_code, l.lock_code, u.name as user_name
    FROM orders o
    JOIN vehicles v ON o.vehicle_id = v.id
    JOIN locks l ON o.lock_id = l.id
    JOIN users u ON o.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (userRole === 'rider') {
    query += ' AND o.user_id = ?';
    params.push(userId);
  }

  if (status) {
    query += ' AND o.status = ?';
    params.push(status);
  }

  query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const orders = db.prepare(query).all(...params);
  return orders.map(order => ({
    ...order,
    availableActions: getOrderStatusActions(order.status, userRole)
  }));
};

const getDashboardStats = (userRole) => {
  const stats = {};
  
  stats.totalVehicles = db.prepare('SELECT COUNT(*) as count FROM vehicles').get()?.count || 0;
  stats.availableVehicles = db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE status = 'available'").get()?.count || 0;
  stats.inUseVehicles = db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE status = 'in_use'").get()?.count || 0;
  stats.maintenanceVehicles = db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE status = 'maintenance'").get()?.count || 0;
  stats.activeOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'riding'").get()?.count || 0;
  stats.pendingBilling = db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending_billing'").get()?.count || 0;
  stats.pendingExceptions = db.prepare("SELECT COUNT(*) as count FROM exceptions WHERE status = 'pending'").get()?.count || 0;
  stats.pendingDispatches = db.prepare("SELECT COUNT(*) as count FROM dispatches WHERE status = 'pending'").get()?.count || 0;

  return stats;
};

module.exports = {
  createOrder,
  startRide,
  endRide,
  confirmBilling,
  payOrder,
  getOrderById,
  getOrders,
  getDashboardStats
};

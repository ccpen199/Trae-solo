const db = require('../utils/database');
const { 
  ORDER_STATES, 
  generateOrderNumber, 
  generateTicketNumber,
  generateRequestNumber,
  logOperation, 
  createMessage, 
  canTransition,
  updateStatistics
} = require('./stateMachineService');

const createOrder = (orderData, userId) => {
  const { passengerId, flightId, expectedCompletionTime, notes } = orderData;
  
  if (!passengerId || !flightId) {
    return { error: '缺少必填字段' };
  }

  const orderNumber = generateOrderNumber();
  
  const transaction = db.transaction(() => {
    const orderSql = `INSERT INTO orders 
                       (order_number, passenger_id, user_id, status, created_by, expected_completion_time)
                       VALUES (?, ?, ?, ?, ?, ?)`;
    
    const result = db.prepare(orderSql).run(
      orderNumber, 
      passengerId, 
      userId, 
      ORDER_STATES.PENDING_QUERY,
      userId,
      expectedCompletionTime
    );
    
    const orderId = result.lastInsertRowid;
    
    logOperation(orderId, userId, 'create_order', null, ORDER_STATES.PENDING_QUERY, { notes });
    
    createMessage(
      orderId, 
      'agent', 
      null, 
      'todo', 
      '新订单待处理', 
      `订单 ${orderNumber} 已创建，等待代理处理航班查询`,
      true
    );
    
    return {
      orderId,
      orderNumber,
      status: ORDER_STATES.PENDING_QUERY
    };
  });
  
  try {
    return transaction();
  } catch (err) {
    return { error: '创建订单失败', details: err.message };
  }
};

const submitQuery = (orderId, userId, queryData) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  
  if (!order) {
    return { error: '订单不存在' };
  }
  
  if (!canTransition(order.status, 'submit_query', 'agent')) {
    return { error: '当前状态不允许提交查询' };
  }
  
  const { flightId, cabinId, fareId } = queryData;
  
  if (!flightId || !cabinId || !fareId) {
    return { error: '缺少航班、舱位或票价信息' };
  }
  
  const cabin = db.prepare(`SELECT c.*, f.total_price as fare_price 
                              FROM cabins c 
                              JOIN fares f ON c.id = f.cabin_id 
                              WHERE c.id = ? AND f.id = ?`).get(cabinId, fareId);
  
  if (!cabin) {
    return { error: '舱位或票价不存在' };
  }
  
  if (cabin.available_seats <= 0) {
    return { error: '所选舱位已售罄' };
  }
  
  const transaction = db.transaction(() => {
    const itemSql = `INSERT INTO order_items 
                     (order_id, flight_id, cabin_id, fare_id, unit_price, status)
                     VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.prepare(itemSql).run(orderId, flightId, cabinId, fareId, cabin.fare_price, 'pending');
    
    const updateOrderSql = `UPDATE orders 
                             SET status = ?, total_amount = ?, updated_at = CURRENT_TIMESTAMP
                             WHERE id = ?`;
    
    db.prepare(updateOrderSql).run(ORDER_STATES.PENDING_SELECT, cabin.fare_price, orderId);
    
    logOperation(orderId, userId, 'submit_query', order.status, ORDER_STATES.PENDING_SELECT, queryData);
    
    createMessage(
      orderId,
      'passenger',
      order.user_id,
      'notification',
      '航班查询完成',
      '航班查询已完成，请选择舱位和票价',
      false
    );
    
    return {
      orderId,
      status: ORDER_STATES.PENDING_SELECT,
      message: '航班查询已提交，请等待用户选择舱位'
    };
  });
  
  try {
    return transaction();
  } catch (err) {
    return { error: '提交查询失败', details: err.message };
  }
};

const selectCabin = (orderId, userId, selectionData) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  
  if (!order) {
    return { error: '订单不存在' };
  }
  
  if (!canTransition(order.status, 'select_cabin', 'passenger')) {
    return { error: '当前状态不允许选择舱位' };
  }
  
  const { cabinId, fareId, seatNumber } = selectionData;
  
  const transaction = db.transaction(() => {
    const lockExpire = new Date(Date.now() + 15 * 60 * 1000);
    const lockSql = `INSERT INTO inventory_locks 
                     (order_id, cabin_id, lock_count, lock_expire_at, status)
                     VALUES (?, ?, 1, ?, 'active')`;
    
    db.prepare(lockSql).run(orderId, cabinId, lockExpire.toISOString());
    
    const updateItemSql = `UPDATE order_items 
                            SET cabin_id = ?, fare_id = ?, seat_number = ?, status = 'selected'
                            WHERE order_id = ?`;
    
    db.prepare(updateItemSql).run(cabinId, fareId, seatNumber, orderId);
    
    const updateOrderSql = `UPDATE orders 
                             SET status = ?, updated_at = CURRENT_TIMESTAMP
                             WHERE id = ?`;
    
    db.prepare(updateOrderSql).run(ORDER_STATES.PENDING_PAYMENT, orderId);
    
    logOperation(orderId, userId, 'select_cabin', order.status, ORDER_STATES.PENDING_PAYMENT, selectionData);
    
    createMessage(
      orderId,
      'passenger',
      userId,
      'notification',
      '请完成支付',
      '舱位已锁定，请在15分钟内完成支付',
      false
    );
    
    updateStatistics(order, ORDER_STATES.PENDING_PAYMENT);
    
    return {
      orderId,
      status: ORDER_STATES.PENDING_PAYMENT,
      lockExpireAt: lockExpire,
      message: '舱位已锁定，请在15分钟内完成支付'
    };
  });
  
  try {
    return transaction();
  } catch (err) {
    return { error: '选择舱位失败', details: err.message };
  }
};

const payAndIssue = (orderId, userId, paymentData) => {
  const { paymentChannelId } = paymentData;
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  
  if (!order) {
    return { error: '订单不存在' };
  }
  
  if (!canTransition(order.status, 'pay_and_issue', 'passenger')) {
    return { error: '当前状态不允许支付' };
  }
  
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
  
  if (!items || items.length === 0) {
    return { error: '订单明细不存在' };
  }
  
  const item = items[0];
  const ticketNumber = generateTicketNumber();
  const now = new Date().toISOString();
  
  const transaction = db.transaction(() => {
    const updateCabinSql = `UPDATE cabins 
                             SET available_seats = available_seats - 1, updated_at = CURRENT_TIMESTAMP
                             WHERE id = ? AND available_seats > 0`;
    
    const cabinResult = db.prepare(updateCabinSql).run(item.cabin_id);
    if (cabinResult.changes === 0) {
      throw new Error('扣减库存失败，可能库存不足');
    }
    
    const releaseLockSql = `UPDATE inventory_locks 
                             SET status = 'released'
                             WHERE order_id = ? AND cabin_id = ?`;
    
    db.prepare(releaseLockSql).run(orderId, item.cabin_id);
    
    const ticketSql = `INSERT INTO tickets 
                       (ticket_number, order_id, order_item_id, passenger_id, flight_id, cabin_id, fare_id, seat_number, issue_time, status)
                       SELECT ?, ?, ?, o.passenger_id, ?, ?, ?, ?, ?, 'issued'
                       FROM orders o WHERE o.id = ?`;
    
    db.prepare(ticketSql).run(
      ticketNumber, orderId, item.id, item.flight_id, item.cabin_id, 
      item.fare_id, item.seat_number, now, orderId
    );
    
    const updateOrderSql = `UPDATE orders 
                             SET status = ?, paid_amount = total_amount, 
                                 payment_channel_id = ?, payment_time = CURRENT_TIMESTAMP,
                                 updated_at = CURRENT_TIMESTAMP
                             WHERE id = ?`;
    
    db.prepare(updateOrderSql).run(ORDER_STATES.ITINERARY_NOTIFIED, paymentChannelId, orderId);
    
    logOperation(orderId, userId, 'pay_and_issue', order.status, ORDER_STATES.ITINERARY_NOTIFIED, { ticketNumber });
    
    createMessage(
      orderId,
      'passenger',
      userId,
      'notification',
      '出票成功',
      `您的机票 ${ticketNumber} 已出票成功，请按时登机`,
      false
    );
    
    updateStatistics(order, ORDER_STATES.ITINERARY_NOTIFIED);
    
    return {
      orderId,
      ticketNumber,
      status: ORDER_STATES.ITINERARY_NOTIFIED,
      message: '支付成功，已完成出票'
    };
  });
  
  try {
    return transaction();
  } catch (err) {
    return { error: err.message || '支付出票失败', details: err.message };
  }
};

const getOrderList = (userId, role, filters) => {
  let sql = `SELECT o.*, 
                    p.first_name || p.last_name as passenger_name,
                    u.name as created_by_name,
                    (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
             FROM orders o
             JOIN passengers p ON o.passenger_id = p.id
             LEFT JOIN users u ON o.created_by = u.id
             WHERE 1=1`;
  const values = [];
  
  if (role === 'passenger') {
    sql += ' AND o.user_id = ?';
    values.push(userId);
  }
  
  if (filters.status) {
    sql += ' AND o.status = ?';
    values.push(filters.status);
  }
  
  if (filters.orderNumber) {
    sql += ' AND o.order_number LIKE ?';
    values.push(`%${filters.orderNumber}%`);
  }
  
  sql += ' ORDER BY o.created_at DESC';
  
  if (filters.limit) {
    sql += ' LIMIT ?';
    values.push(parseInt(filters.limit));
  }
  
  return db.prepare(sql).all(...values);
};

const getOrderDetail = (orderId, userId, role) => {
  const sql = `SELECT o.*, 
                      p.first_name || p.last_name as passenger_name,
                      p.id_type, p.id_number, p.phone,
                      a.code as airline_code, a.name as airline_name,
                      f.flight_number, f.departure_airport, f.arrival_airport,
                      f.departure_time, f.arrival_time,
                      c.cabin_class, c.price,
                      fr.fare_type, fr.total_price as fare_total_price,
                      fr.refundable, fr.changeable,
                      t.ticket_number, t.issue_time, t.status as ticket_status
               FROM orders o
               JOIN passengers p ON o.passenger_id = p.id
               LEFT JOIN order_items oi ON o.id = oi.order_id
               LEFT JOIN flights f ON oi.flight_id = f.id
               LEFT JOIN airlines a ON f.airline_id = a.id
               LEFT JOIN cabins c ON oi.cabin_id = c.id
               LEFT JOIN fares fr ON oi.fare_id = fr.id
               LEFT JOIN tickets t ON o.id = t.order_id
               WHERE o.id = ?`;
  
  const order = db.prepare(sql).get(orderId);
  
  if (!order) {
    return { error: '订单不存在' };
  }
  
  if (role === 'passenger' && order.user_id !== userId) {
    return { error: '无权查看此订单' };
  }
  
  const logs = db.prepare(`SELECT ol.id, ol.action, ol.previous_status, ol.new_status, 
                                   ol.details, ol.created_at
                            FROM operation_logs ol 
                            WHERE ol.order_id = ? 
                            ORDER BY ol.created_at DESC`).all(orderId);
  
  return {
    ...order,
    operation_logs: logs
  };
};

const createRebookRefundRequest = (orderId, userId, requestData) => {
  const { requestType, reason, newFlightId, newCabinId } = requestData;
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  
  if (!order) {
    return { error: '订单不存在' };
  }
  
  const action = requestType === 'rebook' ? 'request_rebook' : 'request_refund';
  if (!canTransition(order.status, action, 'passenger')) {
    return { error: '当前状态不允许退改签' };
  }
  
  const requestNumber = generateRequestNumber();
  
  const transaction = db.transaction(() => {
    const requestSql = `INSERT INTO rebook_refund_requests
                        (request_number, order_id, request_type, reason, 
                         original_flight_id, new_flight_id, original_cabin_id, new_cabin_id,
                         status, created_by)
                        SELECT ?, ?, ?, ?, 
                               oi.flight_id, ?, oi.cabin_id, ?,
                               'pending', ?
                        FROM order_items oi WHERE oi.order_id = ?`;
    
    db.prepare(requestSql).run(
      requestNumber, orderId, requestType, reason,
      newFlightId || null, newCabinId || null,
      userId, orderId
    );
    
    const updateOrderSql = `UPDATE orders 
                             SET status = ?, updated_at = CURRENT_TIMESTAMP
                             WHERE id = ?`;
    
    db.prepare(updateOrderSql).run(ORDER_STATES.PENDING_REBOOK_REFUND, orderId);
    
    logOperation(orderId, userId, action, order.status, ORDER_STATES.PENDING_REBOOK_REFUND, requestData);
    
    createMessage(
      orderId,
      'customer_service',
      null,
      'todo',
      '退改签待审批',
      `订单 ${order.order_number} 提交了${requestType === 'rebook' ? '改签' : '退票'}申请，请审批`,
      true
    );
    
    return {
      requestNumber,
      orderId,
      status: ORDER_STATES.PENDING_REBOOK_REFUND,
      message: '退改签申请已提交，请等待审批'
    };
  });
  
  try {
    return transaction();
  } catch (err) {
    return { error: '创建退改签请求失败', details: err.message };
  }
};

const processRebookRefund = (requestId, userId, actionData) => {
  const { action, approvalComments, refundAmount, additionalFee } = actionData;
  
  const request = db.prepare(`SELECT rrr.*, o.status as order_status, o.order_number
                              FROM rebook_refund_requests rrr
                              JOIN orders o ON rrr.order_id = o.id
                              WHERE rrr.id = ?`).get(requestId);
  
  if (!request) {
    return { error: '请求不存在' };
  }
  
  if (request.status !== 'pending') {
    return { error: '此请求已处理' };
  }
  
  let newStatus;
  let newOrderStatus;
  
  switch (action) {
    case 'approve':
      newStatus = 'approved';
      newOrderStatus = request.request_type === 'refund' ? ORDER_STATES.CANCELLED : ORDER_STATES.ITINERARY_NOTIFIED;
      break;
    case 'reject':
      newStatus = 'rejected';
      newOrderStatus = ORDER_STATES.ITINERARY_NOTIFIED;
      break;
    case 'request_more_info':
      newStatus = 'need_more_info';
      newOrderStatus = ORDER_STATES.PENDING_REBOOK_REFUND;
      break;
    case 'reassign':
      newStatus = 'pending';
      newOrderStatus = ORDER_STATES.PENDING_REBOOK_REFUND;
      break;
    default:
      return { error: '无效的操作' };
  }
  
  const transaction = db.transaction(() => {
    const updateRequestSql = `UPDATE rebook_refund_requests
                               SET status = ?, approval_comments = ?, refund_amount = ?, 
                                   additional_fee = ?, approved_by = ?, approved_at = CURRENT_TIMESTAMP,
                                   updated_at = CURRENT_TIMESTAMP
                               WHERE id = ?`;
    
    db.prepare(updateRequestSql).run(
      newStatus, approvalComments, refundAmount || null,
      additionalFee || null, userId, requestId
    );
    
    const updateOrderSql = `UPDATE orders
                             SET status = ?, updated_at = CURRENT_TIMESTAMP
                             WHERE id = ?`;
    
    db.prepare(updateOrderSql).run(newOrderStatus, request.order_id);
    
    logOperation(request.order_id, userId, action, request.order_status, newOrderStatus, actionData);
    
    const msgAction = action === 'approve' ? '已批准' : action === 'reject' ? '已驳回' : '需要补充信息';
    createMessage(
      request.order_id,
      'passenger',
      null,
      'notification',
      `退改签申请${msgAction}`,
      `订单 ${request.order_number} 的退改签申请${msgAction}`,
      false
    );
    
    if (action === 'approve' && request.request_type === 'refund') {
      updateStatistics({ status: ORDER_STATES.ITINERARY_NOTIFIED }, ORDER_STATES.CANCELLED);
    }
    
    return {
      requestId,
      status: newStatus,
      message: `退改签请求已${msgAction}`
    };
  });
  
  try {
    return transaction();
  } catch (err) {
    return { error: '处理退改签请求失败', details: err.message };
  }
};

const getTodoCount = (userId, role) => {
  let sql = `SELECT COUNT(*) as count FROM messages 
             WHERE is_todo = 1 AND is_read = 0`;
  const values = [];
  
  if (role !== 'admin') {
    sql += ' AND recipient_role = ?';
    values.push(role);
  }
  
  const result = db.prepare(sql).get(...values);
  return result ? result.count : 0;
};

module.exports = {
  createOrder,
  submitQuery,
  selectCabin,
  payAndIssue,
  getOrderList,
  getOrderDetail,
  createRebookRefundRequest,
  processRebookRefund,
  getTodoCount
};

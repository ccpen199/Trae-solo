const db = require('../utils/database');

const ORDER_STATES = {
  PENDING_QUERY: 'pending_query',
  PENDING_SELECT: 'pending_select',
  PENDING_PAYMENT: 'pending_payment',
  ITINERARY_NOTIFIED: 'itinerary_notified',
  PENDING_REBOOK_REFUND: 'pending_rebook_refund',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const STATE_TRANSITIONS = {
  [ORDER_STATES.PENDING_QUERY]: {
    next: [ORDER_STATES.PENDING_SELECT, ORDER_STATES.CANCELLED],
    actions: ['submit_query', 'cancel'],
    roles: ['passenger', 'agent', 'admin']
  },
  [ORDER_STATES.PENDING_SELECT]: {
    next: [ORDER_STATES.PENDING_PAYMENT, ORDER_STATES.CANCELLED],
    actions: ['select_cabin', 'cancel'],
    roles: ['agent', 'admin', 'passenger']
  },
  [ORDER_STATES.PENDING_PAYMENT]: {
    next: [ORDER_STATES.ITINERARY_NOTIFIED, ORDER_STATES.CANCELLED],
    actions: ['pay_and_issue', 'cancel'],
    roles: ['passenger', 'agent', 'admin']
  },
  [ORDER_STATES.ITINERARY_NOTIFIED]: {
    next: [ORDER_STATES.PENDING_REBOOK_REFUND, ORDER_STATES.COMPLETED],
    actions: ['request_rebook', 'request_refund', 'complete'],
    roles: ['passenger', 'agent', 'customer_service', 'admin']
  },
  [ORDER_STATES.PENDING_REBOOK_REFUND]: {
    next: [ORDER_STATES.ITINERARY_NOTIFIED, ORDER_STATES.COMPLETED, ORDER_STATES.CANCELLED],
    actions: ['approve', 'reject', 'request_more_info', 'reassign'],
    roles: ['customer_service', 'agent', 'admin']
  }
};

const generateOrderNumber = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `FB${dateStr}${random}`;
};

const generateTicketNumber = () => {
  const now = new Date();
  const timestamp = now.getTime().toString().slice(-10);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `TK${timestamp}${random}`;
};

const generateRequestNumber = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RR${dateStr}${random}`;
};

const logOperation = (orderId, userId, action, previousStatus, newStatus, details = {}) => {
  const sql = `INSERT INTO operation_logs 
               (order_id, user_id, action, previous_status, new_status, details)
               VALUES (?, ?, ?, ?, ?, ?)`;
  db.prepare(sql).run(orderId, userId, action, previousStatus, newStatus, JSON.stringify(details));
};

const createMessage = (orderId, recipientRole, recipientId, messageType, title, content, isTodo = false) => {
  const sql = `INSERT INTO messages 
               (order_id, recipient_role, recipient_id, message_type, title, content, is_todo)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.prepare(sql).run(orderId, recipientRole, recipientId, messageType, title, content, isTodo ? 1 : 0);
};

const canTransition = (currentState, action, userRole) => {
  const stateConfig = STATE_TRANSITIONS[currentState];
  if (!stateConfig) return false;
  
  if (!stateConfig.actions.includes(action)) return false;
  if (!stateConfig.roles.includes(userRole) && userRole !== 'admin') return false;
  
  return true;
};

const updateStatistics = (order, newStatus) => {
  const today = new Date().toISOString().slice(0, 10);
  
  const stats = db.prepare('SELECT * FROM order_statistics WHERE stat_date = ?').get(today);
  
  const updates = {
    total_orders: stats ? stats.total_orders : 0,
    pending_orders: stats ? stats.pending_orders : 0,
    paid_orders: stats ? stats.paid_orders : 0,
    issued_orders: stats ? stats.issued_orders : 0,
    cancelled_orders: stats ? stats.cancelled_orders : 0,
    total_amount: stats ? stats.total_amount : 0
  };

  if (!stats) {
    updates.total_orders = 1;
  }

  switch (newStatus) {
    case ORDER_STATES.PENDING_PAYMENT:
      updates.pending_orders += 1;
      break;
    case ORDER_STATES.ITINERARY_NOTIFIED:
      updates.pending_orders -= 1;
      updates.paid_orders += 1;
      updates.issued_orders += 1;
      updates.total_amount += order.total_amount || 0;
      break;
    case ORDER_STATES.CANCELLED:
      updates.cancelled_orders += 1;
      if (order.status === ORDER_STATES.PENDING_PAYMENT) {
        updates.pending_orders -= 1;
      }
      break;
  }

  if (stats) {
    const updateSql = `UPDATE order_statistics 
                        SET pending_orders = ?, paid_orders = ?, issued_orders = ?, 
                            cancelled_orders = ?, total_amount = ?, updated_at = CURRENT_TIMESTAMP
                        WHERE id = ?`;
    db.prepare(updateSql).run(
      updates.pending_orders, updates.paid_orders, updates.issued_orders,
      updates.cancelled_orders, updates.total_amount, stats.id
    );
  } else {
    const insertSql = `INSERT INTO order_statistics 
                        (stat_date, total_orders, pending_orders, paid_orders, issued_orders, cancelled_orders, total_amount)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.prepare(insertSql).run(
      today, updates.total_orders, updates.pending_orders, updates.paid_orders,
      updates.issued_orders, updates.cancelled_orders, updates.total_amount
    );
  }
};

module.exports = {
  ORDER_STATES,
  STATE_TRANSITIONS,
  generateOrderNumber,
  generateTicketNumber,
  generateRequestNumber,
  logOperation,
  createMessage,
  canTransition,
  updateStatistics
};

const { getDb, saveDb } = require('../database');
const { v4: uuidv4 } = require('uuid');

const MAINTENANCE_STATUSES = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const MAINTENANCE_PRIORITIES = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
};

const MAINTENANCE_TYPES = {
  EMERGENCY: 'EMERGENCY',
  REVIEW_TRIGGERED: 'REVIEW_TRIGGERED',
  SCHEDULED: 'SCHEDULED',
  MANUAL: 'MANUAL'
};

function createMaintenanceOrder(chargerId, stationId, userId, type, description, priority = 'normal') {
  const sql = getDb();
  
  const orderId = uuidv4();
  const now = new Date().toISOString();
  
  sql.run(`
    INSERT INTO maintenance_orders (
      id, charger_id, station_id, user_id, type, description, status, priority
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    orderId, chargerId, stationId, userId, type, description,
    MAINTENANCE_STATUSES.PENDING, priority
  ]);
  
  sql.run(
    'UPDATE chargers SET status = "maintenance", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [chargerId]
  );
  
  saveDb();
  
  return {
    orderId,
    chargerId,
    stationId,
    type,
    description,
    status: MAINTENANCE_STATUSES.PENDING,
    priority,
    createdAt: now
  };
}

function assignMaintenanceOrder(orderId, maintainerId) {
  const sql = getDb();
  
  const orderResult = sql.exec(
    'SELECT * FROM maintenance_orders WHERE id = ?',
    [orderId]
  );
  
  if (orderResult.length === 0 || orderResult[0].values.length === 0) {
    throw new Error('Maintenance order not found');
  }
  
  const orderColumns = orderResult[0].columns;
  const orderRow = orderResult[0].values[0];
  const order = {};
  orderColumns.forEach((col, idx) => {
    order[col] = orderRow[idx];
  });
  
  if (order.status !== MAINTENANCE_STATUSES.PENDING) {
    throw new Error(`Order is not in pending state. Current status: ${order.status}`);
  }
  
  const now = new Date().toISOString();
  
  sql.run(`
    UPDATE maintenance_orders 
    SET assigned_to = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [maintainerId, MAINTENANCE_STATUSES.ASSIGNED, orderId]);
  
  saveDb();
  
  return {
    orderId,
    maintainerId,
    status: MAINTENANCE_STATUSES.ASSIGNED,
    assignedAt: now
  };
}

function startMaintenance(orderId, maintainerId) {
  const sql = getDb();
  
  const orderResult = sql.exec(
    'SELECT * FROM maintenance_orders WHERE id = ? AND assigned_to = ?',
    [orderId, maintainerId]
  );
  
  if (orderResult.length === 0 || orderResult[0].values.length === 0) {
    throw new Error('Maintenance order not found or not assigned to this maintainer');
  }
  
  const orderColumns = orderResult[0].columns;
  const orderRow = orderResult[0].values[0];
  const order = {};
  orderColumns.forEach((col, idx) => {
    order[col] = orderRow[idx];
  });
  
  if (order.status !== MAINTENANCE_STATUSES.ASSIGNED) {
    throw new Error(`Order is not in assigned state. Current status: ${order.status}`);
  }
  
  sql.run(`
    UPDATE maintenance_orders 
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [MAINTENANCE_STATUSES.IN_PROGRESS, orderId]);
  
  saveDb();
  
  return {
    orderId,
    status: MAINTENANCE_STATUSES.IN_PROGRESS,
    startedAt: new Date().toISOString()
  };
}

function completeMaintenance(orderId, maintainerId, notes) {
  const sql = getDb();
  
  const orderResult = sql.exec(
    'SELECT * FROM maintenance_orders WHERE id = ?',
    [orderId]
  );
  
  if (orderResult.length === 0 || orderResult[0].values.length === 0) {
    throw new Error('Maintenance order not found');
  }
  
  const orderColumns = orderResult[0].columns;
  const orderRow = orderResult[0].values[0];
  const order = {};
  orderColumns.forEach((col, idx) => {
    order[col] = orderRow[idx];
  });
  
  const validStatuses = [MAINTENANCE_STATUSES.ASSIGNED, MAINTENANCE_STATUSES.IN_PROGRESS];
  if (!validStatuses.includes(order.status)) {
    throw new Error(`Order cannot be completed. Current status: ${order.status}`);
  }
  
  const now = new Date().toISOString();
  
  sql.run(`
    UPDATE maintenance_orders 
    SET status = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [MAINTENANCE_STATUSES.COMPLETED, now, orderId]);
  
  sql.run(
    'UPDATE chargers SET status = "idle", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [order.charger_id]
  );
  
  saveDb();
  
  return {
    orderId,
    status: MAINTENANCE_STATUSES.COMPLETED,
    completedAt: now,
    chargerRestored: true
  };
}

function getMaintenanceOrders(filters = {}) {
  const sql = getDb();
  
  let query = `
    SELECT mo.*,
      c.charger_code, s.name as station_name, s.address as station_address,
      u_assigned.name as assigned_name, u_reporter.name as reporter_name
    FROM maintenance_orders mo
    LEFT JOIN chargers c ON mo.charger_id = c.id
    LEFT JOIN stations s ON mo.station_id = s.id
    LEFT JOIN users u_assigned ON mo.assigned_to = u_assigned.id
    LEFT JOIN users u_reporter ON mo.user_id = u_reporter.id
    WHERE 1=1
  `;
  const params = [];
  
  if (filters.status) {
    query += ' AND mo.status = ?';
    params.push(filters.status);
  }
  
  if (filters.assignedTo) {
    query += ' AND mo.assigned_to = ?';
    params.push(filters.assignedTo);
  }
  
  if (filters.chargerId) {
    query += ' AND mo.charger_id = ?';
    params.push(filters.chargerId);
  }
  
  if (filters.priority) {
    query += ' AND mo.priority = ?';
    params.push(filters.priority);
  }
  
  query += ' ORDER BY mo.created_at DESC';
  
  const result = sql.exec(query, params);
  
  if (result.length === 0 || result[0].values.length === 0) {
    return [];
  }
  
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

function getMaintenanceOrderDetail(orderId) {
  const sql = getDb();
  
  const result = sql.exec(`
    SELECT mo.*,
      c.charger_code, c.connector_type, c.power,
      s.name as station_name, s.address as station_address,
      u_assigned.name as assigned_name, u_reporter.name as reporter_name
    FROM maintenance_orders mo
    LEFT JOIN chargers c ON mo.charger_id = c.id
    LEFT JOIN stations s ON mo.station_id = s.id
    LEFT JOIN users u_assigned ON mo.assigned_to = u_assigned.id
    LEFT JOIN users u_reporter ON mo.user_id = u_reporter.id
    WHERE mo.id = ?
  `, [orderId]);
  
  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }
  
  const columns = result[0].columns;
  const row = result[0].values[0];
  const order = {};
  columns.forEach((col, idx) => {
    order[col] = row[idx];
  });
  
  return order;
}

module.exports = {
  createMaintenanceOrder,
  assignMaintenanceOrder,
  startMaintenance,
  completeMaintenance,
  getMaintenanceOrders,
  getMaintenanceOrderDetail,
  MAINTENANCE_STATUSES,
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_TYPES
};

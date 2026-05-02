const db = require('../config/database');
const { generateId } = require('../utils/helpers');
const statusFlowService = require('./statusFlowService');
const messageService = require('./messageService');

const reportException = (userId, userRole, data) => {
  const exceptionId = generateId();
  const now = new Date().toISOString();

  const { exceptionType, orderId, vehicleId, title, description } = data;

  const insert = db.prepare(`
    INSERT INTO exceptions (
      id, exception_type, order_id, vehicle_id, user_id,
      status, title, description, reported_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    exceptionId, exceptionType, orderId, vehicleId, userId,
    'pending', title, description, now
  );

  statusFlowService.recordStatusFlow(
    'exception', exceptionId, null, 'pending',
    { id: userId, role: userRole }, 'report', description
  );

  messageService.createMessage(
    'exception_reported',
    '新异常待处理',
    `异常类型：${exceptionType}，标题：${title}`,
    { targetRole: 'service', exceptionId, orderId, vehicleId }
  );

  return { exceptionId };
};

const processException = (exceptionId, userId, userRole, action, reason) => {
  const now = new Date().toISOString();

  const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(exceptionId);
  if (!exception) {
    throw new Error('异常记录不存在');
  }

  if (exception.status !== 'pending') {
    throw new Error(`异常状态 ${exception.status} 不可处理`);
  }

  let nextStatus;
  let resolution = reason;

  switch (action) {
    case 'approve':
      nextStatus = 'processing';
      break;
    case 'reject':
      nextStatus = 'rejected';
      break;
    case 'request_more_info':
      nextStatus = 'info_requested';
      break;
    case 'reassign':
      nextStatus = 'pending';
      break;
    default:
      throw new Error(`不支持的操作：${action}`);
  }

  db.prepare(`
    UPDATE exceptions 
    SET status = ?, resolved_by = ?, resolution = ?, updated_at = ? 
    WHERE id = ?
  `).run(nextStatus, userId, resolution, now, exceptionId);

  if (action === 'reject') {
    db.prepare(`
      UPDATE exceptions 
      SET resolved_at = ? 
      WHERE id = ?
    `).run(now, exceptionId);
  }

  statusFlowService.recordStatusFlow(
    'exception', exceptionId, exception.status, nextStatus,
    { id: userId, role: userRole }, action, reason
  );

  messageService.createMessage(
    `exception_${action}`,
    `异常已${action === 'approve' ? '受理' : action === 'reject' ? '驳回' : '处理'}`,
    `处理结果：${reason}`,
    { targetUserId: exception.user_id, exceptionId }
  );

  return { exceptionId, status: nextStatus };
};

const getExceptions = (userId, userRole, options = {}) => {
  const { status, limit = 20, offset = 0 } = options;

  let query = `
    SELECT e.*, 
           o.order_no, v.bike_code,
           u_reporter.name as reporter_name,
           u_resolver.name as resolver_name
    FROM exceptions e
    LEFT JOIN orders o ON e.order_id = o.id
    LEFT JOIN vehicles v ON e.vehicle_id = v.id
    LEFT JOIN users u_reporter ON e.user_id = u_reporter.id
    LEFT JOIN users u_resolver ON e.resolved_by = u_resolver.id
    WHERE 1=1
  `;
  const params = [];

  if (userRole === 'rider') {
    query += ' AND e.user_id = ?';
    params.push(userId);
  }

  if (status) {
    query += ' AND e.status = ?';
    params.push(status);
  }

  query += ' ORDER BY e.reported_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(query).all(...params);
};

const getExceptionById = (exceptionId, userId, userRole) => {
  let query = `
    SELECT e.*, 
           o.order_no, o.user_id as order_user_id,
           v.bike_code,
           u_reporter.name as reporter_name,
           u_resolver.name as resolver_name
    FROM exceptions e
    LEFT JOIN orders o ON e.order_id = o.id
    LEFT JOIN vehicles v ON e.vehicle_id = v.id
    LEFT JOIN users u_reporter ON e.user_id = u_reporter.id
    LEFT JOIN users u_resolver ON e.resolved_by = u_resolver.id
    WHERE e.id = ?
  `;
  const params = [exceptionId];

  if (userRole === 'rider') {
    query += ' AND e.user_id = ?';
    params.push(userId);
  }

  return db.prepare(query).get(...params);
};

module.exports = {
  reportException,
  processException,
  getExceptions,
  getExceptionById
};

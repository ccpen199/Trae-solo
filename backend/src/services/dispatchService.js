const db = require('../config/database');
const { generateId, generateDispatchNo } = require('../utils/helpers');
const statusFlowService = require('./statusFlowService');
const messageService = require('./messageService');

const createDispatch = (userId, userRole, data) => {
  const dispatchId = generateId();
  const dispatchNo = generateDispatchNo();
  const now = new Date().toISOString();

  const { orderId, vehicleId, exceptionId, dispatchType, priority, expectedTime, description, operatorId } = data;

  const insert = db.prepare(`
    INSERT INTO dispatches (
      id, dispatch_no, order_id, vehicle_id, exception_id,
      dispatcher_id, operator_id, status, dispatch_type,
      priority, expected_time, description, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    dispatchId, dispatchNo, orderId, vehicleId, exceptionId,
    userId, operatorId, 'pending', dispatchType,
    priority || 'normal', expectedTime, description, now
  );

  statusFlowService.recordStatusFlow(
    'dispatch', dispatchId, null, 'pending',
    { id: userId, role: userRole }, 'create', description
  );

  if (operatorId) {
    messageService.createMessage(
      'dispatch_assigned',
      '新调度任务',
      `调度类型：${dispatchType}，描述：${description}`,
      { targetUserId: operatorId, dispatchNo }
    );
  }

  return { dispatchId, dispatchNo };
};

const assignOperator = (dispatchId, userId, userRole, operatorId, reason) => {
  const now = new Date().toISOString();

  const dispatch = db.prepare('SELECT * FROM dispatches WHERE id = ?').get(dispatchId);
  if (!dispatch) {
    throw new Error('调度记录不存在');
  }

  db.prepare(`
    UPDATE dispatches 
    SET operator_id = ?, status = 'assigned', updated_at = ? 
    WHERE id = ?
  `).run(operatorId, now, dispatchId);

  statusFlowService.recordStatusFlow(
    'dispatch', dispatchId, dispatch.status, 'assigned',
    { id: userId, role: userRole }, 'assign', reason
  );

  messageService.createMessage(
    'dispatch_assigned',
    '调度已分配',
    `调度单号：${dispatch.dispatch_no}，请及时处理`,
    { targetUserId: operatorId }
  );

  return { dispatchId, status: 'assigned' };
};

const completeDispatch = (dispatchId, userId, userRole, reason) => {
  const now = new Date().toISOString();

  const dispatch = db.prepare('SELECT * FROM dispatches WHERE id = ?').get(dispatchId);
  if (!dispatch) {
    throw new Error('调度记录不存在');
  }

  if (dispatch.status !== 'pending' && dispatch.status !== 'assigned' && dispatch.status !== 'processing') {
    throw new Error(`调度状态 ${dispatch.status} 不可完成`);
  }

  db.prepare(`
    UPDATE dispatches 
    SET status = 'completed', completed_at = ?, updated_at = ? 
    WHERE id = ?
  `).run(now, now, dispatchId);

  statusFlowService.recordStatusFlow(
    'dispatch', dispatchId, dispatch.status, 'completed',
    { id: userId, role: userRole }, 'complete', reason
  );

  messageService.createMessage(
    'dispatch_completed',
    '调度已完成',
    `调度单号：${dispatch.dispatch_no}，处理结果：${reason}`,
    { targetUserId: dispatch.dispatcher_id }
  );

  return { dispatchId, status: 'completed' };
};

const getDispatches = (userId, userRole, options = {}) => {
  const { status, limit = 20, offset = 0 } = options;

  let query = `
    SELECT d.*, 
           o.order_no, v.bike_code,
           u_dispatcher.name as dispatcher_name,
           u_operator.name as operator_name
    FROM dispatches d
    LEFT JOIN orders o ON d.order_id = o.id
    LEFT JOIN vehicles v ON d.vehicle_id = v.id
    LEFT JOIN users u_dispatcher ON d.dispatcher_id = u_dispatcher.id
    LEFT JOIN users u_operator ON d.operator_id = u_operator.id
    WHERE 1=1
  `;
  const params = [];

  if (userRole === 'maintainer') {
    query += ' AND d.operator_id = ?';
    params.push(userId);
  }

  if (status) {
    query += ' AND d.status = ?';
    params.push(status);
  }

  query += ' ORDER BY d.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(query).all(...params);
};

module.exports = {
  createDispatch,
  assignOperator,
  completeDispatch,
  getDispatches
};

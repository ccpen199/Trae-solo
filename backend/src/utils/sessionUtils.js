const db = require('../models/database');
const { v4: uuidv4 } = require('uuid');

const SESSION_STATUS = {
  PENDING_HOUSE_SELECTION: 'pending_house_selection',
  PENDING_3D_SPACE: 'pending_3d_space',
  PENDING_HOTSPOT_VIEW: 'pending_hotspot_view',
  PENDING_CONSULTATION: 'pending_consultation',
  PENDING_LEAD_CAPTURE: 'pending_lead_capture',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected'
};

const SESSION_STEPS = {
  HOUSE_SELECTION: 'house_selection',
  THREE_D_SPACE: 'three_d_space',
  HOTSPOT_VIEW: 'hotspot_view',
  CONSULTATION: 'consultation',
  LEAD_CAPTURE: 'lead_capture'
};

const generateSessionNo = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `VS${year}${month}${day}${random}`;
};

const createStatusFlow = (sessionId, fromStatus, toStatus, action, operatorId, remark = null) => {
  const flowId = uuidv4();
  
  db.prepare(`
    INSERT INTO status_flow (id, session_id, from_status, to_status, action, operator_id, remark, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(flowId, sessionId, fromStatus, toStatus, action, operatorId, remark);

  return flowId;
};

const createMessage = (userId, sessionId, type, title, content) => {
  const messageId = uuidv4();
  
  db.prepare(`
    INSERT INTO messages (id, user_id, session_id, type, title, content, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'unread', CURRENT_TIMESTAMP)
  `).run(messageId, userId, sessionId, type, title, content);

  return messageId;
};

const createSessionDetail = (sessionId, step, status, data, createdBy) => {
  const detailId = uuidv4();
  
  db.prepare(`
    INSERT INTO session_details (id, session_id, step, status, data, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(detailId, sessionId, step, status, JSON.stringify(data), createdBy);

  return detailId;
};

const updateSessionStatus = (sessionId, newStatus, newStep, operatorId, action, remark = null) => {
  const session = db.prepare('SELECT * FROM viewing_sessions WHERE id = ?').get(sessionId);
  
  if (!session) {
    throw new Error('会话不存在');
  }

  const oldStatus = session.status;

  db.prepare(`
    UPDATE viewing_sessions 
    SET status = ?, current_step = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(newStatus, newStep, sessionId);

  createStatusFlow(sessionId, oldStatus, newStatus, action, operatorId, remark);

  return { oldStatus, newStatus };
};

const getNextResponsible = (session) => {
  const steps = [
    { step: SESSION_STEPS.HOUSE_SELECTION, role: 'buyer' },
    { step: SESSION_STEPS.THREE_D_SPACE, role: 'agent' },
    { step: SESSION_STEPS.HOTSPOT_VIEW, role: 'agent' },
    { step: SESSION_STEPS.CONSULTATION, role: 'agent' },
    { step: SESSION_STEPS.LEAD_CAPTURE, role: 'buyer' }
  ];

  const currentIndex = steps.findIndex(s => s.step === session.current_step);
  const nextStep = steps[currentIndex + 1];

  if (!nextStep) {
    return null;
  }

  let responsibleId = null;

  if (nextStep.role === 'buyer') {
    responsibleId = session.buyer_id;
  } else if (nextStep.role === 'agent') {
    if (session.agent_id) {
      responsibleId = session.agent_id;
    } else {
      const agent = db.prepare(`
        SELECT u.id FROM users u 
        WHERE u.role = 'agent' AND u.status = 'active'
        ORDER BY u.created_at LIMIT 1
      `).get();
      responsibleId = agent ? agent.id : null;
    }
  }

  return {
    role: nextStep.role,
    step: nextStep.step,
    userId: responsibleId
  };
};

const lockFloorPlan = (floorPlanId, userId) => {
  const floorPlan = db.prepare('SELECT * FROM floor_plans WHERE id = ?').get(floorPlanId);
  
  if (!floorPlan) {
    return { success: false, error: '户型图不存在' };
  }

  if (floorPlan.is_locked && floorPlan.locked_by !== userId) {
    return { success: false, error: '户型图已被其他用户锁定' };
  }

  db.prepare(`
    UPDATE floor_plans 
    SET is_locked = 1, locked_by = ?, locked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(userId, floorPlanId);

  return { success: true };
};

const unlockFloorPlan = (floorPlanId) => {
  db.prepare(`
    UPDATE floor_plans 
    SET is_locked = 0, locked_by = NULL, locked_at = NULL, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(floorPlanId);
};

const createConflictRecord = (sessionId, conflictType, originalData, conflictData) => {
  const conflictId = uuidv4();
  
  db.prepare(`
    INSERT INTO conflict_records (id, session_id, conflict_type, original_data, conflict_data, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
  `).run(conflictId, sessionId, conflictType, JSON.stringify(originalData), JSON.stringify(conflictData));

  return conflictId;
};

const getUserTodoCount = (userId, role) => {
  let count = 0;

  if (role === 'buyer') {
    count = db.prepare(`
      SELECT COUNT(*) as count FROM viewing_sessions 
      WHERE buyer_id = ? AND status IN ('pending_house_selection', 'pending_lead_capture')
    `).get(userId).count;
  } else if (role === 'agent') {
    count = db.prepare(`
      SELECT COUNT(*) as count FROM viewing_sessions 
      WHERE agent_id = ? AND status IN ('pending_3d_space', 'pending_hotspot_view', 'pending_consultation')
    `).get(userId).count;
  } else if (role === 'admin' || role === 'developer') {
    count = db.prepare(`
      SELECT COUNT(*) as count FROM viewing_sessions 
      WHERE status NOT IN ('completed', 'cancelled')
    `).get().count;
  }

  const messageCount = db.prepare(`
    SELECT COUNT(*) as count FROM messages 
    WHERE user_id = ? AND status = 'unread'
  `).get(userId).count;

  return {
    sessionCount: count,
    messageCount: messageCount,
    totalCount: count + messageCount
  };
};

module.exports = {
  SESSION_STATUS,
  SESSION_STEPS,
  generateSessionNo,
  createStatusFlow,
  createMessage,
  createSessionDetail,
  updateSessionStatus,
  getNextResponsible,
  lockFloorPlan,
  unlockFloorPlan,
  createConflictRecord,
  getUserTodoCount
};

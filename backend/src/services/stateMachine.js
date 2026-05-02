const { v4: uuidv4 } = require('uuid');
const { query, run } = require('../config/database');

const NODES = {
  COLLECT: 'collect',
  RULES: 'rules',
  ALERT: 'alert',
  NOTIFY: 'notify',
  REVIEW: 'review',
  CLOSED: 'closed'
};

const STATUSES = {
  DRAFT: 'draft',
  PENDING_RULES: 'pending_rules',
  PENDING_ALERT: 'pending_alert',
  ALERTING: 'alerting',
  PROCESSING: 'processing',
  PENDING_REVIEW: 'pending_review',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
  BLOCKED: 'blocked'
};

const ACTIONS = {
  SUBMIT: 'submit',
  APPROVE: 'approve',
  REJECT: 'reject',
  CANCEL: 'cancel',
  ASSIGN: 'assign',
  TRANSFER: 'transfer',
  SUPPLEMENT: 'supplement',
  RESOLVE: 'resolve',
  CLOSE: 'close',
  ROLLBACK: 'rollback'
};

const TRANSITIONS = {
  [NODES.COLLECT]: {
    [ACTIONS.SUBMIT]: { toNode: NODES.RULES, toStatus: STATUSES.PENDING_RULES },
    [ACTIONS.CANCEL]: { toNode: NODES.COLLECT, toStatus: STATUSES.CANCELLED }
  },
  [NODES.RULES]: {
    [ACTIONS.APPROVE]: { toNode: NODES.ALERT, toStatus: STATUSES.PENDING_ALERT },
    [ACTIONS.REJECT]: { toNode: NODES.COLLECT, toStatus: STATUSES.DRAFT },
    [ACTIONS.SUPPLEMENT]: { toNode: NODES.COLLECT, toStatus: STATUSES.BLOCKED },
    [ACTIONS.TRANSFER]: { toNode: NODES.RULES, toStatus: STATUSES.PENDING_RULES },
    [ACTIONS.CANCEL]: { toNode: NODES.COLLECT, toStatus: STATUSES.CANCELLED }
  },
  [NODES.ALERT]: {
    [ACTIONS.APPROVE]: { toNode: NODES.NOTIFY, toStatus: STATUSES.ALERTING },
    [ACTIONS.REJECT]: { toNode: NODES.RULES, toStatus: STATUSES.PENDING_RULES },
    [ACTIONS.TRANSFER]: { toNode: NODES.ALERT, toStatus: STATUSES.PENDING_ALERT },
    [ACTIONS.CANCEL]: { toNode: NODES.COLLECT, toStatus: STATUSES.CANCELLED }
  },
  [NODES.NOTIFY]: {
    [ACTIONS.APPROVE]: { toNode: NODES.REVIEW, toStatus: STATUSES.PENDING_REVIEW },
    [ACTIONS.REJECT]: { toNode: NODES.ALERT, toStatus: STATUSES.PENDING_ALERT },
    [ACTIONS.SUPPLEMENT]: { toNode: NODES.ALERT, toStatus: STATUSES.BLOCKED },
    [ACTIONS.TRANSFER]: { toNode: NODES.NOTIFY, toStatus: STATUSES.ALERTING },
    [ACTIONS.RESOLVE]: { toNode: NODES.REVIEW, toStatus: STATUSES.RESOLVED },
    [ACTIONS.CANCEL]: { toNode: NODES.COLLECT, toStatus: STATUSES.CANCELLED }
  },
  [NODES.REVIEW]: {
    [ACTIONS.APPROVE]: { toNode: NODES.CLOSED, toStatus: STATUSES.CLOSED },
    [ACTIONS.REJECT]: { toNode: NODES.NOTIFY, toStatus: STATUSES.ALERTING },
    [ACTIONS.CLOSE]: { toNode: NODES.CLOSED, toStatus: STATUSES.CLOSED }
  }
};

const generateTicketNo = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `ALT${year}${month}${day}${random}`;
};

const getTicketById = (ticketId) => {
  const tickets = query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
  return tickets.length > 0 ? tickets[0] : null;
};

const getTicketByNo = (ticketNo) => {
  const tickets = query('SELECT * FROM tickets WHERE ticket_no = ?', [ticketNo]);
  return tickets.length > 0 ? tickets[0] : null;
};

const createTicket = (data, userId) => {
  const ticketNo = generateTicketNo();
  const now = new Date().toISOString();
  
  const result = run(
    `INSERT INTO tickets 
     (ticket_no, title, description, type, priority, status, current_node, 
      assignee_id, reporter_id, expected_finish_time, attachments, version, 
      created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
    [
      ticketNo,
      data.title,
      data.description || null,
      data.type || 'alert',
      data.priority || 'medium',
      STATUSES.DRAFT,
      NODES.COLLECT,
      data.assignee_id || null,
      userId,
      data.expected_finish_time || null,
      data.attachments ? JSON.stringify(data.attachments) : null
    ]
  );
  
  const ticketId = result.lastInsertRowid;
  
  if (data.metrics && data.metrics.length > 0) {
    data.metrics.forEach((metric, index) => {
      run(
        `INSERT INTO metrics 
         (ticket_id, name, code, category, metric_type, value, unit, threshold, description, source, collected_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          ticketId,
          metric.name,
          metric.code,
          metric.category,
          metric.metric_type || 'gauge',
          metric.value,
          metric.unit,
          metric.threshold,
          metric.description,
          metric.source
        ]
      );
    });
  }
  
  if (data.items && data.items.length > 0) {
    data.items.forEach((item, index) => {
      run(
        `INSERT INTO ticket_items 
         (ticket_id, item_type, item_key, item_value, item_status, sequence)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          ticketId,
          item.item_type,
          item.item_key,
          item.item_value,
          item.item_status || 'pending',
          index
        ]
      );
    });
  }
  
  if (data.assignee_id) {
    run(
      `INSERT INTO messages (user_id, ticket_id, title, content, message_type, priority, status)
       VALUES (?, ?, ?, ?, 'todo', ?, 'unread')`,
      [
        data.assignee_id,
        ticketId,
        `新工单待处理: ${ticketNo}`,
        `您有一个新工单 "${data.title}" 待处理，请及时查看。`,
        data.priority || 'medium'
      ]
    );
  }
  
  logOperation(userId, 'ticket', 'create', ticketId, null, { ticket_no: ticketNo, ...data });
  
  return getTicketById(ticketId);
};

const canTransition = (ticket, action) => {
  if (!ticket || !ticket.current_node) return false;
  const transitions = TRANSITIONS[ticket.current_node];
  if (!transitions) return false;
  return !!transitions[action];
};

const transition = (ticketId, action, userId, comment, details = {}) => {
  const ticket = getTicketById(ticketId);
  if (!ticket) {
    throw new Error('工单不存在');
  }
  
  if (!canTransition(ticket, action)) {
    throw new Error(`当前状态 [${ticket.status}] 不允许执行操作 [${action}]`);
  }
  
  const transitions = TRANSITIONS[ticket.current_node];
  const transitionConfig = transitions[action];
  
  const oldStatus = ticket.status;
  const oldNode = ticket.current_node;
  const newStatus = transitionConfig.toStatus;
  const newNode = transitionConfig.toNode;
  
  let newAssignee = ticket.assignee_id;
  if (details.newAssigneeId) {
    newAssignee = details.newAssigneeId;
  } else if (action === ACTIONS.SUBMIT) {
    const ruleRoles = query(
      `SELECT ur.user_id FROM user_roles ur
       INNER JOIN roles r ON ur.role_id = r.id
       WHERE r.code IN ('manager', 'oncall') LIMIT 1`
    );
    if (ruleRoles.length > 0) {
      newAssignee = ruleRoles[0].user_id;
    }
  }
  
  const newVersion = (ticket.version || 1) + 1;
  
  run(
    `UPDATE tickets 
     SET status = ?, current_node = ?, assignee_id = ?, version = ?, updated_at = datetime('now')
     WHERE id = ? AND version = ?`,
    [newStatus, newNode, newAssignee, newVersion, ticketId, ticket.version]
  );
  
  run(
    `UPDATE ticket_items SET item_status = ?, updated_at = datetime('now')
     WHERE ticket_id = ? AND item_status = 'pending'`,
    [newStatus === STATUSES.CLOSED ? 'completed' : 'in_progress', ticketId]
  );
  
  run(
    `INSERT INTO state_transitions 
     (ticket_id, from_state, to_state, from_node, to_node, action, operator_id, comment, details, version, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      ticketId,
      oldStatus,
      newStatus,
      oldNode,
      newNode,
      action,
      userId,
      comment,
      JSON.stringify(details),
      newVersion
    ]
  );
  
  if (newAssignee && newAssignee !== ticket.assignee_id) {
    run(
      `INSERT INTO messages (user_id, ticket_id, title, content, message_type, priority, status)
       VALUES (?, ?, ?, ?, 'todo', ?, 'unread')`,
      [
        newAssignee,
        ticketId,
        `工单流转: ${ticket.ticket_no}`,
        `工单 "${ticket.title}" 已流转到您处，请及时处理。\n当前状态: ${newStatus}`,
        ticket.priority
      ]
    );
  }
  
  if (action === ACTIONS.CANCEL && ticket.assignee_id) {
    run(
      `UPDATE messages SET status = 'cancelled' WHERE ticket_id = ? AND user_id = ? AND status = 'unread'`,
      [ticketId, ticket.assignee_id]
    );
  }
  
  logOperation(userId, 'ticket', action, ticketId, { status: oldStatus }, { status: newStatus, node: newNode });
  
  const updatedTicket = getTicketById(ticketId);
  
  return {
    ticket: updatedTicket,
    transition: {
      from: { node: oldNode, status: oldStatus },
      to: { node: newNode, status: newStatus },
      action,
      operatorId: userId
    }
  };
};

const logOperation = (userId, module, action, targetId, oldValue, newValue) => {
  const users = userId ? query('SELECT name FROM users WHERE id = ?', [userId]) : [];
  const userName = users.length > 0 ? users[0].name : null;
  
  run(
    `INSERT INTO operation_logs 
     (user_id, user_name, module, action, target_type, target_id, old_value, new_value, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      userId,
      userName,
      module,
      action,
      module,
      targetId,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null
    ]
  );
};

const lockTicket = (ticketId, userId) => {
  const ticket = getTicketById(ticketId);
  if (!ticket) throw new Error('工单不存在');
  
  if (ticket.is_locked && ticket.locked_by !== userId) {
    const locker = query('SELECT name FROM users WHERE id = ?', [ticket.locked_by]);
    const lockerName = locker.length > 0 ? locker[0].name : '其他用户';
    throw new Error(`工单已被 ${lockerName} 锁定`);
  }
  
  run(
    `UPDATE tickets SET is_locked = 1, locked_by = ?, locked_at = datetime('now') WHERE id = ?`,
    [userId, ticketId]
  );
  
  run(
    `UPDATE logs SET is_locked = 1, locked_by = ?, locked_at = datetime('now') WHERE ticket_id = ?`,
    [userId, ticketId]
  );
  
  return true;
};

const unlockTicket = (ticketId, userId) => {
  const ticket = getTicketById(ticketId);
  if (!ticket) throw new Error('工单不存在');
  
  if (ticket.is_locked && ticket.locked_by !== userId) {
    throw new Error('无权解锁此工单');
  }
  
  run(
    `UPDATE tickets SET is_locked = 0, locked_by = NULL, locked_at = NULL WHERE id = ?`,
    [ticketId]
  );
  
  run(
    `UPDATE logs SET is_locked = 0, locked_by = NULL, locked_at = NULL WHERE ticket_id = ?`,
    [ticketId]
  );
  
  return true;
};

const getTicketTransitions = (ticketId) => {
  return query(
    `SELECT st.*, u.name as operator_name
     FROM state_transitions st
     LEFT JOIN users u ON st.operator_id = u.id
     WHERE st.ticket_id = ?
     ORDER BY st.created_at DESC`,
    [ticketId]
  );
};

const getAvailableActions = (ticket) => {
  if (!ticket || !ticket.current_node) return [];
  const transitions = TRANSITIONS[ticket.current_node];
  if (!transitions) return [];
  return Object.keys(transitions);
};

module.exports = {
  NODES,
  STATUSES,
  ACTIONS,
  TRANSITIONS,
  generateTicketNo,
  getTicketById,
  getTicketByNo,
  createTicket,
  canTransition,
  transition,
  logOperation,
  lockTicket,
  unlockTicket,
  getTicketTransitions,
  getAvailableActions
};

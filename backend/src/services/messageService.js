const db = require('../database/config');
const { ROLES } = require('../utils/constants');

const createMessage = (options) => {
  const {
    mainId,
    detailId,
    messageType,
    title,
    content,
    assignedTo,
    assignedRole,
    priority,
    deadline,
  } = options;

  const stmt = db.prepare(`
    INSERT INTO messages (
      main_id, detail_id, message_type, title, content, 
      assigned_to, assigned_role, priority, deadline
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    mainId,
    detailId || null,
    messageType,
    title,
    content || null,
    assignedTo || null,
    assignedRole || null,
    priority || 'normal',
    deadline || null
  );

  return result.lastInsertRowid;
};

const getMessagesByUser = (userId, options = {}) => {
  const { status = 'pending', limit = 50, offset = 0 } = options;
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return { total: 0, data: [] };

  let conditions = [];
  let params = [];

  conditions.push('(assigned_to = ? OR assigned_role = ?)');
  params.push(userId, user.role);

  if (status && status !== 'all') {
    conditions.push('status = ?');
    params.push(status);
  }

  const whereClause = conditions.join(' AND ');

  const countStmt = db.prepare(`
    SELECT COUNT(*) as total FROM messages
    WHERE ${whereClause}
  `);
  const countResult = countStmt.get(...params);
  const total = countResult.total;

  params.push(limit, offset);
  const dataStmt = db.prepare(`
    SELECT * FROM messages
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);

  const data = dataStmt.all(...params);

  return {
    total,
    data,
    limit,
    offset,
  };
};

const getMessagesByRole = (role, options = {}) => {
  const { status = 'pending', limit = 50, offset = 0 } = options;

  let conditions = ['assigned_role = ?'];
  let params = [role];

  if (status && status !== 'all') {
    conditions.push('status = ?');
    params.push(status);
  }

  const whereClause = conditions.join(' AND ');

  const countStmt = db.prepare(`
    SELECT COUNT(*) as total FROM messages
    WHERE ${whereClause}
  `);
  const countResult = countStmt.get(...params);
  const total = countResult.total;

  params.push(limit, offset);
  const dataStmt = db.prepare(`
    SELECT * FROM messages
    WHERE ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);

  const data = dataStmt.all(...params);

  return {
    total,
    data,
    limit,
    offset,
  };
};

const getMessagesByMainId = (mainId, options = {}) => {
  const { limit = 100, offset = 0 } = options;

  const countStmt = db.prepare(`
    SELECT COUNT(*) as total FROM messages WHERE main_id = ?
  `);
  const countResult = countStmt.get(mainId);
  const total = countResult.total;

  const dataStmt = db.prepare(`
    SELECT * FROM messages
    WHERE main_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);

  const data = dataStmt.all(mainId, limit, offset);

  return {
    total,
    data,
    limit,
    offset,
  };
};

const markAsRead = (messageId, userId) => {
  const stmt = db.prepare(`
    UPDATE messages 
    SET status = ?, read_at = datetime('now')
    WHERE id = ? AND (assigned_to = ? OR assigned_role IS NOT NULL)
  `);

  const result = stmt.run('read', messageId, userId);
  return result.changes > 0;
};

const markAsCompleted = (messageId, userId) => {
  const stmt = db.prepare(`
    UPDATE messages 
    SET status = ?, completed_at = datetime('now')
    WHERE id = ? AND (assigned_to = ? OR assigned_role IS NOT NULL)
  `);

  const result = stmt.run('completed', messageId, userId);
  return result.changes > 0;
};

const markMessagesAsReadByMainId = (mainId, userId) => {
  const stmt = db.prepare(`
    UPDATE messages 
    SET status = ?, read_at = datetime('now')
    WHERE main_id = ? AND status = 'pending'
  `);

  const result = stmt.run('read', mainId);
  return result.changes;
};

const getPendingCountByUser = (userId) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return 0;

  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM messages
    WHERE (assigned_to = ? OR assigned_role = ?) AND status = 'pending'
  `);

  const result = stmt.get(userId, user.role);
  return result.count;
};

const getPendingCountByRole = (role) => {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM messages
    WHERE assigned_role = ? AND status = 'pending'
  `);

  const result = stmt.get(role);
  return result.count;
};

module.exports = {
  createMessage,
  getMessagesByUser,
  getMessagesByRole,
  getMessagesByMainId,
  markAsRead,
  markAsCompleted,
  markMessagesAsReadByMainId,
  getPendingCountByUser,
  getPendingCountByRole,
};

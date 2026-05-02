const db = require('../database/config');

const logAction = (options) => {
  const {
    mainId,
    detailId,
    userId,
    userRole,
    action,
    tableName,
    recordId,
    oldValue,
    newValue,
    ipAddress,
    userAgent,
    remark,
  } = options;

  const stmt = db.prepare(`
    INSERT INTO audit_logs (
      main_id, detail_id, user_id, user_role, action, table_name, 
      record_id, old_value, new_value, ip_address, user_agent, remark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    mainId || null,
    detailId || null,
    userId || null,
    userRole || null,
    action,
    tableName || null,
    recordId || null,
    oldValue ? JSON.stringify(oldValue) : null,
    newValue ? JSON.stringify(newValue) : null,
    ipAddress || null,
    userAgent || null,
    remark || null
  );

  return result.lastInsertRowid;
};

const getLogsByMainId = (mainId, limit = 100) => {
  const stmt = db.prepare(`
    SELECT 
      al.*,
      u.name as user_name,
      u.role as user_role
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.main_id = ?
    ORDER BY al.created_at DESC
    LIMIT ?
  `);

  const logs = stmt.all(mainId, limit);
  
  return logs.map(log => ({
    ...log,
    old_value: log.old_value ? JSON.parse(log.old_value) : null,
    new_value: log.new_value ? JSON.parse(log.new_value) : null,
  }));
};

const getLogsByUserId = (userId, limit = 100) => {
  const stmt = db.prepare(`
    SELECT * FROM audit_logs
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `);

  return stmt.all(userId, limit);
};

const searchLogs = (options) => {
  const {
    mainId,
    userId,
    userRole,
    action,
    startTime,
    endTime,
    limit = 100,
    offset = 0,
  } = options;

  let conditions = [];
  let params = [];

  if (mainId) {
    conditions.push('main_id = ?');
    params.push(mainId);
  }
  if (userId) {
    conditions.push('user_id = ?');
    params.push(userId);
  }
  if (userRole) {
    conditions.push('user_role = ?');
    params.push(userRole);
  }
  if (action) {
    conditions.push('action = ?');
    params.push(action);
  }
  if (startTime) {
    conditions.push('created_at >= ?');
    params.push(startTime);
  }
  if (endTime) {
    conditions.push('created_at <= ?');
    params.push(endTime);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM audit_logs ${whereClause}`);
  const countResult = countStmt.get(...params);
  const total = countResult.total;

  params.push(limit, offset);
  const dataStmt = db.prepare(`
    SELECT 
      al.*,
      u.name as user_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ${whereClause}
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?
  `);

  const logs = dataStmt.all(...params);
  const parsedLogs = logs.map(log => ({
    ...log,
    old_value: log.old_value ? JSON.parse(log.old_value) : null,
    new_value: log.new_value ? JSON.parse(log.new_value) : null,
  }));

  return {
    total,
    data: parsedLogs,
    limit,
    offset,
  };
};

module.exports = {
  logAction,
  getLogsByMainId,
  getLogsByUserId,
  searchLogs,
};

const db = require('../config/database');

const logOperation = (options) => {
  const {
    user,
    module,
    action,
    targetType,
    targetId,
    detail,
    ip
  } = options;

  const stmt = db.prepare(`
    INSERT INTO operation_logs 
    (user_id, user_name, module, action, target_type, target_id, detail, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    user?.id || null,
    user?.name || null,
    module,
    action,
    targetType,
    targetId,
    typeof detail === 'string' ? detail : JSON.stringify(detail),
    ip
  );
};

const logOrderTrail = (options) => {
  const {
    orderId,
    action,
    content,
    operator,
    statusBefore,
    statusAfter
  } = options;

  const stmt = db.prepare(`
    INSERT INTO order_trails
    (order_id, action, content, operator_id, operator_name, status_before, status_after)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    orderId,
    action,
    content,
    operator?.id || null,
    operator?.name || null,
    statusBefore,
    statusAfter
  );
};

module.exports = {
  logOperation,
  logOrderTrail
};

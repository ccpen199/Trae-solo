const db = require('../config/database');
const { generateId } = require('../utils/helpers');

const recordStatusFlow = (entityType, entityId, fromStatus, toStatus, operator, action, reason) => {
  const flowId = generateId();
  const now = new Date().toISOString();

  const insert = db.prepare(`
    INSERT INTO status_flows (
      id, entity_type, entity_id, from_status, to_status,
      operator_id, operator_role, action, reason, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insert.run(
    flowId, entityType, entityId, fromStatus, toStatus,
    operator?.id, operator?.role, action, reason, now
  );

  return flowId;
};

const getStatusFlows = (entityType, entityId) => {
  return db.prepare(`
    SELECT sf.*, u.name as operator_name
    FROM status_flows sf
    LEFT JOIN users u ON sf.operator_id = u.id
    WHERE sf.entity_type = ? AND sf.entity_id = ?
    ORDER BY sf.created_at ASC
  `).all(entityType, entityId);
};

module.exports = {
  recordStatusFlow,
  getStatusFlows
};

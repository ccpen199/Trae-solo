const db = require('../database/db');

function logException(auditId, riskId, operationType, originalRequest, error, compensationAction = null) {
  try {
    const stmt = db.prepare(`
      INSERT INTO exceptions (audit_id, risk_id, operation_type, original_request, error_message, error_stack, compensation_action)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      auditId || null,
      riskId || null,
      operationType,
      originalRequest ? JSON.stringify(originalRequest) : null,
      error.message,
      error.stack,
      compensationAction
    );
  } catch (e) {
    console.error('Failed to log exception:', e);
  }
}

function logOperation(userId, action, details = {}) {
  try {
    const stmt = db.prepare(`
      INSERT INTO operation_logs (audit_id, risk_id, rectification_id, user_id, action, old_status, new_status, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      details.auditId || null,
      details.riskId || null,
      details.rectificationId || null,
      userId,
      action,
      details.oldStatus || null,
      details.newStatus || null,
      JSON.stringify(details)
    );
  } catch (e) {
    console.error('Failed to log operation:', e);
  }
}

function validateRuleVersion(ruleId, expectedVersion) {
  const rule = db.prepare('SELECT version FROM rules WHERE id = ? AND is_active = 1').get(ruleId);
  if (!rule) return { valid: false, reason: '规则不存在或未激活' };
  if (rule.version !== expectedVersion) {
    return { valid: false, reason: `规则版本不匹配，期望 ${expectedVersion}，实际 ${rule.version}` };
  }
  return { valid: true };
}

function validatePermission(userId, requiredRole) {
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
  if (!user) return { valid: false, reason: '用户不存在' };
  
  const roleHierarchy = {
    business_owner: ['business_owner', 'model_ops', 'auditor', 'user'],
    model_ops: ['model_ops', 'auditor', 'user'],
    auditor: ['auditor', 'user'],
    user: ['user']
  };
  
  if (!roleHierarchy[user.role]?.includes(requiredRole)) {
    return { valid: false, reason: `权限不足，需要 ${requiredRole} 角色` };
  }
  return { valid: true };
}

function validatePreviousNode(auditId, expectedConclusion) {
  const audit = db.prepare('SELECT previous_conclusion, status FROM audits WHERE id = ?').get(auditId);
  if (!audit) return { valid: false, reason: '审计记录不存在' };
  if (expectedConclusion && audit.previous_conclusion !== expectedConclusion) {
    return { valid: false, reason: `上一节点结论不匹配，期望 ${expectedConclusion}` };
  }
  return { valid: true };
}

function validateRequiredMaterials(auditId, requiredTypes) {
  const materials = db.prepare(`
    SELECT m.type FROM audit_materials am
    JOIN materials m ON am.material_id = m.id
    WHERE am.audit_id = ?
  `).all(auditId);
  
  const types = materials.map(m => m.type);
  const missing = requiredTypes.filter(t => !types.includes(t));
  
  if (missing.length > 0) {
    return { valid: false, reason: `缺少必填材料: ${missing.join(', ')}` };
  }
  return { valid: true };
}

module.exports = {
  logException,
  logOperation,
  validateRuleVersion,
  validatePermission,
  validatePreviousNode,
  validateRequiredMaterials
};

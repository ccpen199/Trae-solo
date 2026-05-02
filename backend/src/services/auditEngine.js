const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { query, run } = require('../config/database');

const RiskLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

const ActionType = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  MFA_INITIATE: 'mfa_initiate',
  MFA_COMPLETE: 'mfa_complete',
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  USER_STATUS_CHANGE: 'user_status_change',
  ORG_CREATE: 'org_create',
  ORG_UPDATE: 'org_update',
  ORG_DELETE: 'org_delete',
  ROLE_CREATE: 'role_create',
  ROLE_UPDATE: 'role_update',
  ROLE_DELETE: 'role_delete',
  PERMISSION_ASSIGN: 'permission_assign',
  PERMISSION_REVOKE: 'permission_revoke',
  POLICY_CREATE: 'policy_create',
  POLICY_UPDATE: 'policy_update',
  POLICY_DELETE: 'policy_delete',
  RESOURCE_ACCESS: 'resource_access',
  SENSITIVE_OPERATION: 'sensitive_operation',
  POSITION_CHANGE: 'position_change',
  PERMISSION_CLEANUP: 'permission_cleanup',
  AUDIT_EXPORT: 'audit_export',
  APP_CREATE: 'app_create',
  APP_UPDATE: 'app_update',
  APP_DELETE: 'app_delete',
  APP_ACCESS_GRANT: 'app_access_grant',
  APP_ACCESS_REVOKE: 'app_access_revoke'
};

const ResourceType = {
  USER: 'user',
  ORGANIZATION: 'organization',
  ROLE: 'role',
  PERMISSION: 'permission',
  POLICY: 'policy',
  RESOURCE: 'resource',
  APPLICATION: 'application',
  AUDIT: 'audit',
  SESSION: 'session'
};

const generateFingerprint = (data) => {
  const hash = crypto.createHash('sha256');
  const timestamp = Date.now().toString();
  const randomSalt = crypto.randomBytes(16).toString('hex');
  
  const fingerprintData = {
    ...data,
    timestamp,
    randomSalt
  };
  
  hash.update(JSON.stringify(fingerprintData));
  return hash.digest('hex');
};

const determineRiskLevel = (action, details = {}) => {
  const actionRiskMap = {
    [ActionType.LOGIN]: RiskLevel.LOW,
    [ActionType.LOGOUT]: RiskLevel.LOW,
    [ActionType.MFA_INITIATE]: RiskLevel.MEDIUM,
    [ActionType.MFA_COMPLETE]: RiskLevel.MEDIUM,
    [ActionType.USER_CREATE]: RiskLevel.MEDIUM,
    [ActionType.USER_UPDATE]: RiskLevel.MEDIUM,
    [ActionType.USER_DELETE]: RiskLevel.HIGH,
    [ActionType.USER_STATUS_CHANGE]: RiskLevel.MEDIUM,
    [ActionType.ORG_CREATE]: RiskLevel.MEDIUM,
    [ActionType.ORG_UPDATE]: RiskLevel.MEDIUM,
    [ActionType.ORG_DELETE]: RiskLevel.HIGH,
    [ActionType.ROLE_CREATE]: RiskLevel.MEDIUM,
    [ActionType.ROLE_UPDATE]: RiskLevel.HIGH,
    [ActionType.ROLE_DELETE]: RiskLevel.HIGH,
    [ActionType.PERMISSION_ASSIGN]: RiskLevel.HIGH,
    [ActionType.PERMISSION_REVOKE]: RiskLevel.HIGH,
    [ActionType.POLICY_CREATE]: RiskLevel.HIGH,
    [ActionType.POLICY_UPDATE]: RiskLevel.HIGH,
    [ActionType.POLICY_DELETE]: RiskLevel.HIGH,
    [ActionType.RESOURCE_ACCESS]: RiskLevel.LOW,
    [ActionType.SENSITIVE_OPERATION]: RiskLevel.CRITICAL,
    [ActionType.POSITION_CHANGE]: RiskLevel.HIGH,
    [ActionType.PERMISSION_CLEANUP]: RiskLevel.HIGH,
    [ActionType.AUDIT_EXPORT]: RiskLevel.MEDIUM,
    [ActionType.APP_CREATE]: RiskLevel.MEDIUM,
    [ActionType.APP_UPDATE]: RiskLevel.MEDIUM,
    [ActionType.APP_DELETE]: RiskLevel.HIGH,
    [ActionType.APP_ACCESS_GRANT]: RiskLevel.HIGH,
    [ActionType.APP_ACCESS_REVOKE]: RiskLevel.HIGH
  };

  let riskLevel = actionRiskMap[action] || RiskLevel.LOW;

  if (details.isSensitive || details.containsCredentials) {
    riskLevel = RiskLevel.CRITICAL;
  }

  if (details.isBulkOperation) {
    riskLevel = riskLevel === RiskLevel.LOW ? RiskLevel.MEDIUM : riskLevel;
  }

  return riskLevel;
};

const logAudit = ({
  userId,
  username,
  action,
  resourceType,
  resourceId,
  details = {},
  ipAddress,
  userAgent,
  riskLevel
}) => {
  const id = uuidv4();
  const actualRiskLevel = riskLevel || determineRiskLevel(action, details);
  const fingerprint = generateFingerprint({
    userId,
    username,
    action,
    resourceType,
    resourceId,
    details,
    ipAddress,
    timestamp: Date.now()
  });

  const detailsJson = JSON.stringify(details);

  run(`
    INSERT INTO audit_logs (
      id, user_id, username, action, resource_type, resource_id,
      details, ip_address, user_agent, risk_level, fingerprint
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id, userId, username, action, resourceType, resourceId,
    detailsJson, ipAddress, userAgent, actualRiskLevel, fingerprint
  ]);

  console.log(`[Audit Engine] ${action} (${actualRiskLevel}) - 用户: ${username || 'anonymous'}, 资源: ${resourceType}#${resourceId || 'N/A'}`);

  return {
    id,
    fingerprint,
    riskLevel: actualRiskLevel
  };
};

const logLogin = ({
  userId,
  username,
  ipAddress,
  userAgent,
  location,
  deviceFingerprint,
  loginResult,
  failureReason,
  riskScore,
  mfaUsed
}) => {
  const id = uuidv4();

  run(`
    INSERT INTO login_logs (
      id, user_id, username, ip_address, user_agent, location,
      device_fingerprint, login_result, failure_reason, risk_score, mfa_used
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id, userId, username, ipAddress, userAgent, location,
    deviceFingerprint, loginResult, failureReason, riskScore, mfaUsed ? 1 : 0
  ]);

  if (loginResult === 'success') {
    logAudit({
      userId,
      username,
      action: ActionType.LOGIN,
      resourceType: ResourceType.SESSION,
      resourceId: null,
      details: { ipAddress, userAgent, location, riskScore, mfaUsed },
      ipAddress,
      userAgent,
      riskLevel: riskScore > 30 ? RiskLevel.MEDIUM : RiskLevel.LOW
    });
  }

  return { id };
};

const logAccess = ({
  userId,
  resourceType,
  resourceId,
  action,
  accessResult,
  ipAddress,
  userAgent
}) => {
  const id = uuidv4();

  run(`
    INSERT INTO access_logs (
      id, user_id, resource_type, resource_id, action,
      access_result, ip_address, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    id, userId, resourceType, resourceId, action,
    accessResult, ipAddress, userAgent
  ]);

  if (accessResult === 'denied') {
    logAudit({
      userId,
      action: ActionType.RESOURCE_ACCESS,
      resourceType,
      resourceId,
      details: { action, accessResult, reason: '权限不足' },
      ipAddress,
      userAgent,
      riskLevel: RiskLevel.MEDIUM
    });
  }

  return { id };
};

const logSensitiveOperation = ({
  userId,
  username,
  operation,
  resourceType,
  resourceId,
  details,
  ipAddress,
  userAgent
}) => {
  return logAudit({
    userId,
    username,
    action: ActionType.SENSITIVE_OPERATION,
    resourceType,
    resourceId,
    details: { operation, ...details },
    ipAddress,
    userAgent,
    riskLevel: RiskLevel.CRITICAL
  });
};

const getAuditLogs = (filters = {}, options = {}) => {
  let sql = `SELECT * FROM audit_logs WHERE 1=1`;
  const params = [];

  if (filters.userId) {
    sql += ` AND user_id = ?`;
    params.push(filters.userId);
  }

  if (filters.username) {
    sql += ` AND username LIKE ?`;
    params.push(`%${filters.username}%`);
  }

  if (filters.action) {
    sql += ` AND action = ?`;
    params.push(filters.action);
  }

  if (filters.resourceType) {
    sql += ` AND resource_type = ?`;
    params.push(filters.resourceType);
  }

  if (filters.riskLevel) {
    sql += ` AND risk_level = ?`;
    params.push(filters.riskLevel);
  }

  if (filters.startTime) {
    sql += ` AND created_at >= ?`;
    params.push(filters.startTime);
  }

  if (filters.endTime) {
    sql += ` AND created_at <= ?`;
    params.push(filters.endTime);
  }

  sql += ` ORDER BY created_at DESC`;

  const page = options.page || 1;
  const pageSize = options.pageSize || 50;

  if (pageSize > 0) {
    const offset = (page - 1) * pageSize;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(pageSize, offset);
  }

  return query(sql, params);
};

const getLoginLogs = (filters = {}, options = {}) => {
  let sql = `SELECT * FROM login_logs WHERE 1=1`;
  const params = [];

  if (filters.userId) {
    sql += ` AND user_id = ?`;
    params.push(filters.userId);
  }

  if (filters.loginResult) {
    sql += ` AND login_result = ?`;
    params.push(filters.loginResult);
  }

  if (filters.startTime) {
    sql += ` AND created_at >= ?`;
    params.push(filters.startTime);
  }

  sql += ` ORDER BY created_at DESC`;

  const page = options.page || 1;
  const pageSize = options.pageSize || 50;

  if (pageSize > 0) {
    const offset = (page - 1) * pageSize;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(pageSize, offset);
  }

  return query(sql, params);
};

const getRealTimeSnapshot = () => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const activeUsers = query(`
    SELECT COUNT(DISTINCT user_id) as count FROM login_sessions 
    WHERE expires_at > datetime('now') AND revoked_at IS NULL
  `);

  const loginLastHour = query(`
    SELECT COUNT(*) as count FROM login_logs 
    WHERE created_at >= ? AND login_result = 'success'
  `, [oneHourAgo]);

  const failedLogins = query(`
    SELECT COUNT(*) as count FROM login_logs 
    WHERE created_at >= ? AND login_result = 'failed'
  `, [twentyFourHoursAgo]);

  const highRiskAudits = query(`
    SELECT COUNT(*) as count FROM audit_logs 
    WHERE created_at >= ? AND risk_level IN ('high', 'critical')
  `, [twentyFourHoursAgo]);

  const recentLogins = query(`
    SELECT ll.*, u.real_name, u.email
    FROM login_logs ll
    LEFT JOIN users u ON ll.user_id = u.id
    WHERE ll.created_at >= ?
    ORDER BY ll.created_at DESC LIMIT 10
  `, [oneHourAgo]);

  const recentAudits = query(`
    SELECT * FROM audit_logs 
    WHERE created_at >= ?
    ORDER BY created_at DESC LIMIT 10
  `, [oneHourAgo]);

  return {
    timestamp: now.toISOString(),
    statistics: {
      activeUsers: activeUsers[0]?.count || 0,
      loginLastHour: loginLastHour[0]?.count || 0,
      failedLogins24h: failedLogins[0]?.count || 0,
      highRiskEvents24h: highRiskAudits[0]?.count || 0
    },
    recentLogins,
    recentAudits
  };
};

module.exports = {
  ActionType,
  ResourceType,
  RiskLevel,
  logAudit,
  logLogin,
  logAccess,
  logSensitiveOperation,
  getAuditLogs,
  getLoginLogs,
  getRealTimeSnapshot,
  determineRiskLevel,
  generateFingerprint
};

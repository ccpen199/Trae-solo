const database = require('../database');
const { v4: uuidv4 } = require('uuid');

const ACTION_TYPES = {
  BLOCK_IP: 'block_ip',
  BLOCK_ACCOUNT: 'block_account',
  BLOCK_DEVICE: 'block_device',
  CHALLENGE: 'challenge',
  ALERT: 'alert',
  LOG: 'log'
};

const ACTION_TARGETS = {
  [ACTION_TYPES.BLOCK_IP]: 'ip_address',
  [ACTION_TYPES.BLOCK_ACCOUNT]: 'user_id',
  [ACTION_TYPES.BLOCK_DEVICE]: 'device_id',
  [ACTION_TYPES.CHALLENGE]: 'session',
  [ACTION_TYPES.ALERT]: 'admin',
  [ACTION_TYPES.LOG]: 'system'
};

const blockedItems = {
  ips: new Set(),
  accounts: new Set(),
  devices: new Set()
};

function createActionRecord(decisionLogId, actionType, actionTarget, actionData = {}) {
  const db = database.getDb();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO action_records (id, decision_log_id, action_type, action_target, action_data, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    decisionLogId,
    actionType,
    actionTarget,
    JSON.stringify(actionData),
    'pending',
    now
  );
  
  return getActionRecordById(id);
}

function getActionRecordById(id) {
  const db = database.getDb();
  const record = db.prepare('SELECT * FROM action_records WHERE id = ?').get(id);
  if (!record) return null;
  
  return {
    ...record,
    action_data: record.action_data ? JSON.parse(record.action_data) : null
  };
}

function getActionRecordsByDecisionLogId(decisionLogId) {
  const db = database.getDb();
  const records = db.prepare(
    'SELECT * FROM action_records WHERE decision_log_id = ? ORDER BY created_at DESC'
  ).all(decisionLogId);
  
  return records.map(r => ({
    ...r,
    action_data: r.action_data ? JSON.parse(r.action_data) : null
  }));
}

function executeBlockIp(ipAddress, reason = '') {
  blockedItems.ips.add(ipAddress);
  
  return {
    success: true,
    actionType: ACTION_TYPES.BLOCK_IP,
    target: ipAddress,
    reason,
    executedAt: new Date().toISOString()
  };
}

function executeBlockAccount(userId, reason = '') {
  blockedItems.accounts.add(userId);
  
  return {
    success: true,
    actionType: ACTION_TYPES.BLOCK_ACCOUNT,
    target: userId,
    reason,
    executedAt: new Date().toISOString()
  };
}

function executeBlockDevice(deviceId, reason = '') {
  blockedItems.devices.add(deviceId);
  
  return {
    success: true,
    actionType: ACTION_TYPES.BLOCK_DEVICE,
    target: deviceId,
    reason,
    executedAt: new Date().toISOString()
  };
}

function executeChallenge(sessionId, challengeType = 'captcha') {
  return {
    success: true,
    actionType: ACTION_TYPES.CHALLENGE,
    target: sessionId,
    challengeType,
    challengeData: {
      id: uuidv4(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    },
    executedAt: new Date().toISOString()
  };
}

function executeAlert(adminGroup, alertMessage) {
  console.log(`[ALERT] 发送告警到 ${adminGroup}: ${alertMessage}`);
  
  return {
    success: true,
    actionType: ACTION_TYPES.ALERT,
    target: adminGroup,
    message: alertMessage,
    executedAt: new Date().toISOString()
  };
}

function isIpBlocked(ipAddress) {
  return blockedItems.ips.has(ipAddress);
}

function isAccountBlocked(userId) {
  return blockedItems.accounts.has(userId);
}

function isDeviceBlocked(deviceId) {
  return blockedItems.devices.has(deviceId);
}

function getBlockedItems() {
  return {
    ips: Array.from(blockedItems.ips),
    accounts: Array.from(blockedItems.accounts),
    devices: Array.from(blockedItems.devices)
  };
}

function unblockIp(ipAddress) {
  blockedItems.ips.delete(ipAddress);
  return { success: true, target: ipAddress };
}

function unblockAccount(userId) {
  blockedItems.accounts.delete(userId);
  return { success: true, target: userId };
}

function unblockDevice(deviceId) {
  blockedItems.devices.delete(deviceId);
  return { success: true, target: deviceId };
}

function executeActionsForDecision(decisionLogId, decisionResult, decisionScore, requestData = {}) {
  const actions = [];
  
  if (decisionResult === 'reject') {
    if (requestData.ip_address) {
      const ipResult = executeBlockIp(requestData.ip_address, '规则引擎触发');
      actions.push(ipResult);
      createActionRecord(decisionLogId, ACTION_TYPES.BLOCK_IP, requestData.ip_address, {
        reason: '规则引擎触发',
        score: decisionScore
      });
    }
    
    if (requestData.user_id) {
      const alertResult = executeAlert('risk_team', `高风险用户检测: userId=${requestData.user_id}, score=${decisionScore}`);
      actions.push(alertResult);
      createActionRecord(decisionLogId, ACTION_TYPES.ALERT, 'risk_team', {
        userId: requestData.user_id,
        score: decisionScore,
        message: '高风险用户检测'
      });
    }
  } else if (decisionResult === 'manual') {
    if (requestData.session_id) {
      const challengeResult = executeChallenge(requestData.session_id, '2fa');
      actions.push(challengeResult);
      createActionRecord(decisionLogId, ACTION_TYPES.CHALLENGE, requestData.session_id, {
        challengeType: '2fa',
        score: decisionScore
      });
    }
  }
  
  updateActionRecordStatus(decisionLogId);
  
  return actions;
}

function updateActionRecordStatus(decisionLogId) {
  const db = database.getDb();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    UPDATE action_records SET status = ?, executed_at = ? WHERE decision_log_id = ? AND status = 'pending'
  `);
  stmt.run('executed', now, decisionLogId);
}

function getAllActionRecords(options = {}) {
  const db = database.getDb();
  let sql = 'SELECT * FROM action_records';
  const conditions = [];
  const params = [];
  
  if (options.status) {
    conditions.push('status = ?');
    params.push(options.status);
  }
  if (options.actionType) {
    conditions.push('action_type = ?');
    params.push(options.actionType);
  }
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  
  sql += ' ORDER BY created_at DESC';
  
  if (options.limit) {
    sql += ` LIMIT ${options.limit}`;
  }
  
  const records = db.prepare(sql).all(...params);
  return records.map(r => ({
    ...r,
    action_data: r.action_data ? JSON.parse(r.action_data) : null
  }));
}

module.exports = {
  ACTION_TYPES,
  createActionRecord,
  getActionRecordById,
  getActionRecordsByDecisionLogId,
  executeBlockIp,
  executeBlockAccount,
  executeBlockDevice,
  executeChallenge,
  executeAlert,
  executeActionsForDecision,
  isIpBlocked,
  isAccountBlocked,
  isDeviceBlocked,
  getBlockedItems,
  unblockIp,
  unblockAccount,
  unblockDevice,
  getAllActionRecords
};

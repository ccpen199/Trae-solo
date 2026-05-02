const { getDb, saveDb } = require('../database');
const { v4: uuidv4 } = require('uuid');
const billingService = require('./billingService');
const hashChainService = require('./hashChainService');
const dayjs = require('dayjs');

const CHARGER_STATUSES = {
  IDLE: 'idle',
  CHARGING: 'charging',
  LOCKED: 'locked',
  MAINTENANCE: 'maintenance',
  ERROR: 'error'
};

const SESSION_STATUSES = {
  PENDING: 'pending',
  CHARGING: 'charging',
  COMPLETED: 'completed',
  ABORTED: 'aborted',
  ERROR: 'error'
};

const activeSessions = new Map();
const chargerStatuses = new Map();

function handleBootNotification(chargerId, payload) {
  const sql = getDb();
  
  const result = sql.exec(
    'SELECT * FROM chargers WHERE id = ? OR charger_code = ?',
    [chargerId, chargerId]
  );
  
  if (result.length === 0 || result[0].values.length === 0) {
    throw new Error('Charger not registered');
  }
  
  const columns = result[0].columns;
  const row = result[0].values[0];
  const charger = {};
  columns.forEach((col, idx) => {
    charger[col] = row[idx];
  });
  
  chargerStatuses.set(charger.id, {
    status: charger.status,
    lastHeartbeat: new Date(),
    model: payload.chargePointModel,
    vendor: payload.chargePointVendor
  });
  
  sql.run(
    'UPDATE chargers SET last_heartbeat = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [charger.id]
  );
  saveDb();
  
  return {
    status: 'Accepted',
    currentTime: new Date().toISOString(),
    interval: 30
  };
}

function handleHeartbeat(chargerId) {
  const status = chargerStatuses.get(chargerId);
  if (status) {
    status.lastHeartbeat = new Date();
  }
  
  const sql = getDb();
  sql.run(
    'UPDATE chargers SET last_heartbeat = CURRENT_TIMESTAMP WHERE id = ? OR charger_code = ?',
    [chargerId, chargerId]
  );
  saveDb();
  
  return {
    currentTime: new Date().toISOString()
  };
}

function handleStatusNotification(chargerId, payload) {
  const sql = getDb();
  
  const result = sql.exec(
    'SELECT * FROM chargers WHERE id = ? OR charger_code = ?',
    [chargerId, chargerId]
  );
  
  if (result.length === 0 || result[0].values.length === 0) {
    throw new Error('Charger not found');
  }
  
  const columns = result[0].columns;
  const row = result[0].values[0];
  const charger = {};
  columns.forEach((col, idx) => {
    charger[col] = row[idx];
  });
  
  let newStatus = charger.status;
  switch (payload.status) {
    case 'Available':
      newStatus = CHARGER_STATUSES.IDLE;
      break;
    case 'Charging':
      newStatus = CHARGER_STATUSES.CHARGING;
      break;
    case 'Faulted':
      newStatus = CHARGER_STATUSES.ERROR;
      break;
    case 'Reserved':
      newStatus = CHARGER_STATUSES.LOCKED;
      break;
  }
  
  sql.run(
    'UPDATE chargers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [newStatus, charger.id]
  );
  saveDb();
  
  if (chargerStatuses.has(charger.id)) {
    chargerStatuses.get(charger.id).status = newStatus;
  }
  
  return { success: true };
}

function handleMeterValues(chargerId, payload) {
  const sql = getDb();
  
  const result = sql.exec(
    'SELECT * FROM chargers WHERE id = ? OR charger_code = ?',
    [chargerId, chargerId]
  );
  
  if (result.length === 0 || result[0].values.length === 0) {
    throw new Error('Charger not found');
  }
  
  const columns = result[0].columns;
  const row = result[0].values[0];
  const charger = {};
  columns.forEach((col, idx) => {
    charger[col] = row[idx];
  });
  
  const sessionResult = sql.exec(`
    SELECT * FROM charging_sessions 
    WHERE charger_id = ? AND status = 'charging'
    ORDER BY start_time DESC LIMIT 1
  `, [charger.id]);
  
  if (sessionResult.length === 0 || sessionResult[0].values.length === 0) {
    return { success: true };
  }
  
  const sessionColumns = sessionResult[0].columns;
  const sessionRow = sessionResult[0].values[0];
  const session = {};
  sessionColumns.forEach((col, idx) => {
    session[col] = sessionRow[idx];
  });
  
  let energyValue = 0;
  let voltage = 0;
  let current = 0;
  let power = 0;
  let temperature = 0;
  
  if (payload.meterValue && Array.isArray(payload.meterValue)) {
    for (const mv of payload.meterValue) {
      if (mv.sampledValue && Array.isArray(mv.sampledValue)) {
        for (const sv of mv.sampledValue) {
          const value = parseFloat(sv.value) || 0;
          switch (sv.measurand) {
            case 'Energy.Active.Import.Register':
              energyValue = value;
              break;
            case 'Voltage':
              voltage = value;
              break;
            case 'Current.Import':
              current = value;
              break;
            case 'Power.Active.Import':
              power = value;
              break;
            case 'Temperature':
              temperature = value;
              break;
          }
        }
      }
    }
  }
  
  const recordId = uuidv4();
  const now = new Date().toISOString();
  
  sql.run(`
    INSERT INTO charging_records (
      id, session_id, timestamp, voltage, current, power, energy, temperature, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    recordId, session.id, now, voltage, current, power, energyValue, temperature, 'normal'
  ]);
  
  saveDb();
  
  if (activeSessions.has(session.id)) {
    const sessionData = activeSessions.get(session.id);
    sessionData.currentEnergy = energyValue;
    sessionData.voltage = voltage;
    sessionData.current = current;
    sessionData.power = power;
    sessionData.temperature = temperature;
    
    if (temperature > 85) {
      triggerEmergencyStop(session.id, 'OVERTEMPERATURE');
    }
  }
  
  return { success: true };
}

function startChargingSession(chargerId, userId) {
  const sql = getDb();
  
  const chargerResult = sql.exec(
    'SELECT * FROM chargers WHERE id = ?',
    [chargerId]
  );
  
  if (chargerResult.length === 0 || chargerResult[0].values.length === 0) {
    throw new Error('Charger not found');
  }
  
  const chargerColumns = chargerResult[0].columns;
  const chargerRow = chargerResult[0].values[0];
  const charger = {};
  chargerColumns.forEach((col, idx) => {
    charger[col] = chargerRow[idx];
  });
  
  if (charger.status !== 'idle' && charger.status !== 'locked') {
    throw new Error(`Charger is not available. Current status: ${charger.status}`);
  }
  
  const sessionId = uuidv4();
  const now = new Date().toISOString();
  
  sql.run(`
    INSERT INTO charging_sessions (
      id, charger_id, user_id, start_time, status
    ) VALUES (?, ?, ?, ?, ?)
  `, [sessionId, chargerId, userId, now, SESSION_STATUSES.CHARGING]);
  
  sql.run(
    'UPDATE chargers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [CHARGER_STATUSES.CHARGING, chargerId]
  );
  
  saveDb();
  
  activeSessions.set(sessionId, {
    id: sessionId,
    chargerId,
    userId,
    startTime: now,
    status: SESSION_STATUSES.CHARGING,
    startEnergy: 0,
    currentEnergy: 0,
    voltage: 0,
    current: 0,
    power: 0,
    temperature: 25
  });
  
  const sessionData = {
    id: sessionId,
    chargerId,
    userId,
    startTime: now,
    status: SESSION_STATUSES.CHARGING
  };
  
  hashChainService.addHashRecord('charging_session', sessionId, sessionData);
  
  return {
    sessionId,
    chargerId,
    startTime: now,
    status: SESSION_STATUSES.CHARGING,
    ocppCommand: {
      action: 'RemoteStartTransaction',
      connectorId: 1,
      idTag: sessionId
    }
  };
}

function stopChargingSession(sessionId, reason = 'USER_REQUEST') {
  const sql = getDb();
  
  const sessionResult = sql.exec(
    'SELECT * FROM charging_sessions WHERE id = ?',
    [sessionId]
  );
  
  if (sessionResult.length === 0 || sessionResult[0].values.length === 0) {
    throw new Error('Session not found');
  }
  
  const sessionColumns = sessionResult[0].columns;
  const sessionRow = sessionResult[0].values[0];
  const session = {};
  sessionColumns.forEach((col, idx) => {
    session[col] = sessionRow[idx];
  });
  
  if (session.status !== 'charging') {
    throw new Error(`Session is not in charging state. Current status: ${session.status}`);
  }
  
  const now = new Date().toISOString();
  let endEnergy = 0;
  let startEnergy = 0;
  
  const recordsResult = sql.exec(`
    SELECT energy FROM charging_records 
    WHERE session_id = ? 
    ORDER BY timestamp ASC
  `, [sessionId]);
  
  if (recordsResult.length > 0 && recordsResult[0].values.length > 0) {
    startEnergy = parseFloat(recordsResult[0].values[0][0]) || 0;
    endEnergy = parseFloat(recordsResult[0].values[recordsResult[0].values.length - 1][0]) || startEnergy + (Math.random() * 50 + 10);
  } else {
    endEnergy = startEnergy + (Math.random() * 50 + 10);
  }
  
  const cost = billingService.calculateChargingCost(
    session.start_time,
    now,
    startEnergy,
    endEnergy
  );
  
  sql.run(`
    UPDATE charging_sessions 
    SET end_time = ?, start_energy = ?, end_energy = ?, 
        total_energy = ?, total_amount = ?, status = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    now, startEnergy, endEnergy, 
    cost.totalEnergy, cost.totalAmount,
    SESSION_STATUSES.COMPLETED, sessionId
  ]);
  
  sql.run(
    'UPDATE chargers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [CHARGER_STATUSES.IDLE, session.charger_id]
  );
  
  saveDb();
  
  activeSessions.delete(sessionId);
  
  const updatedSession = {
    ...session,
    end_time: now,
    start_energy: startEnergy,
    end_energy: endEnergy,
    total_energy: cost.totalEnergy,
    total_amount: cost.totalAmount,
    status: SESSION_STATUSES.COMPLETED
  };
  
  hashChainService.addHashRecord('charging_session', sessionId, updatedSession);
  
  return {
    sessionId,
    chargerId: session.charger_id,
    startTime: session.start_time,
    endTime: now,
    totalEnergy: cost.totalEnergy,
    totalAmount: cost.totalAmount,
    costDetails: cost,
    status: SESSION_STATUSES.COMPLETED,
    ocppCommand: {
      action: 'RemoteStopTransaction',
      transactionId: sessionId
    }
  };
}

function triggerEmergencyStop(sessionId, reason) {
  const sql = getDb();
  
  const sessionResult = sql.exec(
    'SELECT * FROM charging_sessions WHERE id = ?',
    [sessionId]
  );
  
  if (sessionResult.length === 0 || sessionResult[0].values.length === 0) {
    return null;
  }
  
  const sessionColumns = sessionResult[0].columns;
  const sessionRow = sessionResult[0].values[0];
  const session = {};
  sessionColumns.forEach((col, idx) => {
    session[col] = sessionRow[idx];
  });
  
  const now = new Date().toISOString();
  
  sql.run(`
    UPDATE charging_sessions 
    SET end_time = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [now, SESSION_STATUSES.ERROR, sessionId]);
  
  sql.run(
    'UPDATE chargers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [CHARGER_STATUSES.MAINTENANCE, session.charger_id]
  );
  
  saveDb();
  
  const maintenanceOrderId = uuidv4();
  sql.run(`
    INSERT INTO maintenance_orders (
      id, charger_id, station_id, type, description, status, priority
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    maintenanceOrderId, session.charger_id, 
    (() => {
      const result = sql.exec('SELECT station_id FROM chargers WHERE id = ?', [session.charger_id]);
      if (result.length > 0 && result[0].values.length > 0) {
        return result[0].values[0][0];
      }
      return null;
    })(),
    'EMERGENCY',
    `Emergency stop triggered: ${reason}`,
    'pending',
    'urgent'
  ]);
  
  saveDb();
  
  activeSessions.delete(sessionId);
  
  const notificationId = uuidv4();
  sql.run(`
    INSERT INTO notifications (id, user_id, title, content, type)
    VALUES (?, ?, ?, ?, ?)
  `, [
    notificationId, session.user_id,
    '充电异常中断',
    `您的充电会话因 ${reason} 已自动中断，已为您生成运维工单。`,
    'alert'
  ]);
  
  saveDb();
  
  return {
    sessionId,
    status: SESSION_STATUSES.ERROR,
    reason,
    stoppedAt: now,
    maintenanceOrderId
  };
}

function getSessionStatus(sessionId) {
  const sql = getDb();
  
  const sessionResult = sql.exec(
    'SELECT * FROM charging_sessions WHERE id = ?',
    [sessionId]
  );
  
  if (sessionResult.length === 0 || sessionResult[0].values.length === 0) {
    return null;
  }
  
  const sessionColumns = sessionResult[0].columns;
  const sessionRow = sessionResult[0].values[0];
  const session = {};
  sessionColumns.forEach((col, idx) => {
    session[col] = sessionRow[idx];
  });
  
  const liveData = activeSessions.get(sessionId) || {};
  
  let estimatedCost = null;
  if (session.status === 'charging') {
    const elapsedMs = Date.now() - new Date(session.start_time).getTime();
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    const estimatedEnergy = elapsedHours * 60;
    estimatedCost = billingService.estimateCost(estimatedEnergy);
  }
  
  return {
    ...session,
    liveData: {
      currentEnergy: liveData.currentEnergy || 0,
      voltage: liveData.voltage || 0,
      current: liveData.current || 0,
      power: liveData.power || 0,
      temperature: liveData.temperature || 25
    },
    estimatedCost
  };
}

module.exports = {
  handleBootNotification,
  handleHeartbeat,
  handleStatusNotification,
  handleMeterValues,
  startChargingSession,
  stopChargingSession,
  triggerEmergencyStop,
  getSessionStatus,
  CHARGER_STATUSES,
  SESSION_STATUSES,
  activeSessions
};

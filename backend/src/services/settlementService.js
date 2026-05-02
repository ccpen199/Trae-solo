const { getDb, saveDb } = require('../database');
const { v4: uuidv4 } = require('uuid');
const hashChainService = require('./hashChainService');

const PLATFORM_FEE_RATIO = 0.1;

function calculateSettlement(sessionId, totalAmount) {
  const sql = getDb();
  
  const sessionResult = sql.exec(`
    SELECT s.*, st.operator_id, st.venue_id
    FROM charging_sessions s
    JOIN chargers c ON s.charger_id = c.id
    JOIN stations st ON c.station_id = st.id
    WHERE s.id = ?
  `, [sessionId]);
  
  if (sessionResult.length === 0 || sessionResult[0].values.length === 0) {
    throw new Error('Session not found');
  }
  
  const sessionRow = sessionResult[0].values[0];
  const columns = sessionResult[0].columns;
  const session = {};
  columns.forEach((col, idx) => {
    session[col] = sessionRow[idx];
  });
  
  const operatorResult = sql.exec('SELECT * FROM operators WHERE id = ?', [session.operator_id]);
  const venueResult = sql.exec('SELECT * FROM venues WHERE id = ?', [session.venue_id]);
  
  const operator = operatorResult.length > 0 && operatorResult[0].values.length > 0 
    ? (() => {
        const cols = operatorResult[0].columns;
        const vals = operatorResult[0].values[0];
        const obj = {};
        cols.forEach((c, i) => obj[c] = vals[i]);
        return obj;
      })()
    : { settlement_ratio: 0.7 };
  
  const venue = venueResult.length > 0 && venueResult[0].values.length > 0
    ? (() => {
        const cols = venueResult[0].columns;
        const vals = venueResult[0].values[0];
        const obj = {};
        cols.forEach((c, i) => obj[c] = vals[i]);
        return obj;
      })()
    : { settlement_ratio: 0.2 };
  
  const platformFee = totalAmount * PLATFORM_FEE_RATIO;
  const remainingAmount = totalAmount - platformFee;
  
  const operatorRatio = operator.settlement_ratio;
  const venueRatio = venue.settlement_ratio;
  
  const operatorAmount = remainingAmount * (operatorRatio / (operatorRatio + venueRatio));
  const venueAmount = remainingAmount * (venueRatio / (operatorRatio + venueRatio));
  
  return {
    totalAmount,
    operatorAmount: Number(operatorAmount.toFixed(2)),
    venueAmount: Number(venueAmount.toFixed(2)),
    platformFee: Number(platformFee.toFixed(2)),
    operatorRatio,
    venueRatio,
    operatorId: session.operator_id,
    venueId: session.venue_id
  };
}

async function executeSettlement(sessionId) {
  const sql = getDb();
  
  const sessionResult = sql.exec(`
    SELECT * FROM charging_sessions WHERE id = ? AND status = 'completed'
  `, [sessionId]);
  
  if (sessionResult.length === 0 || sessionResult[0].values.length === 0) {
    throw new Error('Session not found or not completed');
  }
  
  const sessionRow = sessionResult[0].values[0];
  const columns = sessionResult[0].columns;
  const session = {};
  columns.forEach((col, idx) => {
    session[col] = sessionRow[idx];
  });
  
  const existingSettlement = sql.exec('SELECT * FROM settlements WHERE session_id = ?', [sessionId]);
  
  if (existingSettlement.length > 0 && existingSettlement[0].values.length > 0) {
    const settlementRow = existingSettlement[0].values[0];
    const cols = existingSettlement[0].columns;
    const settlement = {};
    cols.forEach((col, idx) => {
      settlement[col] = settlementRow[idx];
    });
    return settlement;
  }
  
  const settlementCalc = calculateSettlement(sessionId, session.total_amount);
  
  const settlementId = uuidv4();
  const now = new Date().toISOString();
  
  sql.run(`
    INSERT INTO settlements (
      id, session_id, operator_id, venue_id, total_amount,
      operator_amount, venue_amount, platform_fee, status, settled_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    settlementId, sessionId, settlementCalc.operatorId, settlementCalc.venueId,
    settlementCalc.totalAmount, settlementCalc.operatorAmount,
    settlementCalc.venueAmount, settlementCalc.platformFee,
    'completed', now
  ]);
  
  const settlementData = {
    id: settlementId,
    sessionId,
    operatorId: settlementCalc.operatorId,
    venueId: settlementCalc.venueId,
    totalAmount: settlementCalc.totalAmount,
    operatorAmount: settlementCalc.operatorAmount,
    venueAmount: settlementCalc.venueAmount,
    platformFee: settlementCalc.platformFee,
    status: 'completed',
    settledAt: now
  };
  
  hashChainService.addHashRecord('settlement', settlementId, settlementData);
  saveDb();
  
  return settlementData;
}

function getSettlementReport(operatorId, venueId, startDate, endDate) {
  const sql = getDb();
  let query = `
    SELECT 
      s.*,
      cs.id as session_id,
      cs.total_energy,
      cs.start_time,
      cs.end_time
    FROM settlements s
    JOIN charging_sessions cs ON s.session_id = cs.id
    WHERE 1=1
  `;
  const params = [];
  
  if (operatorId) {
    query += ' AND s.operator_id = ?';
    params.push(operatorId);
  }
  
  if (venueId) {
    query += ' AND s.venue_id = ?';
    params.push(venueId);
  }
  
  if (startDate) {
    query += ' AND cs.start_time >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    query += ' AND cs.start_time <= ?';
    params.push(endDate);
  }
  
  query += ' ORDER BY cs.start_time DESC';
  
  const result = sql.exec(query, params);
  
  if (result.length === 0 || result[0].values.length === 0) {
    return {
      settlements: [],
      summary: {
        totalSessions: 0,
        totalEnergy: 0,
        totalAmount: 0,
        operatorTotal: 0,
        venueTotal: 0,
        platformFeeTotal: 0
      }
    };
  }
  
  const columns = result[0].columns;
  const settlements = result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
  
  const summary = settlements.reduce((acc, s) => ({
    totalSessions: acc.totalSessions + 1,
    totalEnergy: acc.totalEnergy + (s.total_energy || 0),
    totalAmount: acc.totalAmount + (s.total_amount || 0),
    operatorTotal: acc.operatorTotal + (s.operator_amount || 0),
    venueTotal: acc.venueTotal + (s.venue_amount || 0),
    platformFeeTotal: acc.platformFeeTotal + (s.platform_fee || 0)
  }), {
    totalSessions: 0,
    totalEnergy: 0,
    totalAmount: 0,
    operatorTotal: 0,
    venueTotal: 0,
    platformFeeTotal: 0
  });
  
  return {
    settlements,
    summary: {
      totalSessions: summary.totalSessions,
      totalEnergy: Number(summary.totalEnergy.toFixed(2)),
      totalAmount: Number(summary.totalAmount.toFixed(2)),
      operatorTotal: Number(summary.operatorTotal.toFixed(2)),
      venueTotal: Number(summary.venueTotal.toFixed(2)),
      platformFeeTotal: Number(summary.platformFeeTotal.toFixed(2))
    }
  };
}

module.exports = {
  calculateSettlement,
  executeSettlement,
  getSettlementReport,
  PLATFORM_FEE_RATIO
};

const { getDb, saveDb } = require('../database');
const { v4: uuidv4 } = require('uuid');
const hashChainService = require('./hashChainService');

const PAYMENT_METHODS = {
  WECHAT: 'wechat',
  ALIPAY: 'alipay',
  BALANCE: 'balance'
};

const PAYMENT_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

function createPayment(sessionId, userId, amount, paymentMethod) {
  const sql = getDb();
  
  const paymentId = uuidv4();
  const now = new Date().toISOString();
  const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  sql.run(`
    INSERT INTO payments (
      id, session_id, user_id, amount, payment_method, status, transaction_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    paymentId, sessionId, userId, amount, 
    paymentMethod, PAYMENT_STATUSES.PENDING, transactionId
  ]);
  
  saveDb();
  
  return {
    paymentId,
    sessionId,
    userId,
    amount,
    paymentMethod,
    status: PAYMENT_STATUSES.PENDING,
    transactionId,
    createdAt: now
  };
}

function processPayment(paymentId) {
  const sql = getDb();
  
  const paymentResult = sql.exec(
    'SELECT * FROM payments WHERE id = ?',
    [paymentId]
  );
  
  if (paymentResult.length === 0 || paymentResult[0].values.length === 0) {
    throw new Error('Payment not found');
  }
  
  const paymentColumns = paymentResult[0].columns;
  const paymentRow = paymentResult[0].values[0];
  const payment = {};
  paymentColumns.forEach((col, idx) => {
    payment[col] = paymentRow[idx];
  });
  
  if (payment.status !== PAYMENT_STATUSES.PENDING) {
    throw new Error(`Payment is not in pending state. Current status: ${payment.status}`);
  }
  
  const now = new Date().toISOString();
  const success = true;
  
  sql.run(`
    UPDATE payments 
    SET status = ?, paid_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    success ? PAYMENT_STATUSES.SUCCESS : PAYMENT_STATUSES.FAILED,
    success ? now : null,
    paymentId
  ]);
  
  if (success && payment.session_id) {
    sql.run(`
      UPDATE charging_sessions 
      SET payment_status = 'paid', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [payment.session_id]);
  }
  
  saveDb();
  
  if (success) {
    const paymentData = {
      ...payment,
      status: PAYMENT_STATUSES.SUCCESS,
      paid_at: now
    };
    hashChainService.addHashRecord('payment', paymentId, paymentData);
  }
  
  return {
    paymentId,
    status: success ? PAYMENT_STATUSES.SUCCESS : PAYMENT_STATUSES.FAILED,
    paidAt: success ? now : null,
    transactionId: payment.transaction_id
  };
}

function getPaymentBySession(sessionId) {
  const sql = getDb();
  
  const result = sql.exec(`
    SELECT * FROM payments WHERE session_id = ? ORDER BY created_at DESC LIMIT 1
  `, [sessionId]);
  
  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }
  
  const columns = result[0].columns;
  const row = result[0].values[0];
  const payment = {};
  columns.forEach((col, idx) => {
    payment[col] = row[idx];
  });
  
  return payment;
}

function getUserPayments(userId) {
  const sql = getDb();
  
  const result = sql.exec(`
    SELECT p.*, cs.total_energy, cs.start_time, cs.end_time
    FROM payments p
    JOIN charging_sessions cs ON p.session_id = cs.id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
  `, [userId]);
  
  if (result.length === 0 || result[0].values.length === 0) {
    return [];
  }
  
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

module.exports = {
  createPayment,
  processPayment,
  getPaymentBySession,
  getUserPayments,
  PAYMENT_METHODS,
  PAYMENT_STATUSES
};

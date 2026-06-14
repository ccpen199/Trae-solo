
const crypto = require('crypto');
const db = require('../database/db');

const createTransaction = async (type, amount, fromUserId, toUserId, recommendationId, commissionPlanId, remarks) => {
  const txnId = 'TXN_' + crypto.randomBytes(16).toString('hex');
  const paymentTxnId = 'PAY_' + crypto.randomBytes(20).toString('hex');

  const stmt = db.prepare(`
    INSERT INTO transactions (
      type, amount, from_user_id, to_user_id, recommendation_id,
      commission_plan_id, status, payment_gateway_txn_id, remarks
    ) VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?)
  `);

  const info = stmt.run(type, amount, fromUserId, toUserId, recommendationId, commissionPlanId, paymentTxnId, remarks);

  return { id: info.lastInsertRowid, txnId, paymentTxnId, success: true };
};

module.exports = { createTransaction };

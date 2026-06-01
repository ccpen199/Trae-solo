const db = require('../config/database');
const { success, error, generateTransactionNo } = require('../utils/response');

const getMerchantStore = (req, res) => {
  const userId = req.user.id;
  
  try {
    const store = db.prepare('SELECT * FROM merchant_stores WHERE user_id = ?').get(userId);
    res.json(success(store));
  } catch (err) {
    console.error('获取商户信息失败:', err);
    res.status(500).json(error('获取商户信息失败'));
  }
};

const createMerchantStore = (req, res) => {
  const userId = req.user.id;
  const { store_name, store_description } = req.body;

  if (!store_name) {
    return res.status(400).json(error('商户名称不能为空'));
  }

  try {
    const result = db.prepare('INSERT INTO merchant_stores (user_id, store_name, store_description) VALUES (?, ?, ?)').run(userId, store_name, store_description || '');
    res.json(success({ id: result.lastInsertRowid }, '商户创建成功'));
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json(error('您已创建过商户'));
    }
    console.error('创建商户失败:', err);
    res.status(500).json(error('创建商户失败'));
  }
};

const createTransaction = (req, res) => {
  const payerId = req.user?.id || null;
  const { payee_id, amount, note, payment_method } = req.body;

  if (!payee_id || !amount || amount <= 0) {
    return res.status(400).json(error('参数错误'));
  }

  try {
    const transactionNo = generateTransactionNo();
    const riskLevel = amount > 10000 ? 'high' : (amount > 1000 ? 'medium' : 'normal');
    const riskRemark = riskLevel !== 'normal' ? '大额交易，请注意核实' : '';

    const result = db.prepare('INSERT INTO transactions (transaction_no, payer_id, payee_id, amount, note, payment_method, risk_level, risk_remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(transactionNo, payerId, payee_id, amount, note || '', payment_method || 'balance', riskLevel, riskRemark);

    setTimeout(() => {
      db.prepare('UPDATE transactions SET status = ?, arrived_at = CURRENT_TIMESTAMP WHERE id = ?').run('success', result.lastInsertRowid);
      db.prepare('UPDATE merchant_stores SET total_received = total_received + ?, today_received = today_received + ? WHERE user_id = ?').run(amount, amount, payee_id);
    }, 1000);

    res.json(success({
      transaction_id: result.lastInsertRowid,
      transaction_no: transactionNo,
      status: 'processing'
    }, '支付处理中'));
  } catch (err) {
    console.error('创建交易失败:', err);
    res.status(500).json(error('创建交易失败'));
  }
};

const getTransactionStatus = (req, res) => {
  const transactionId = req.params.id;

  try {
    const transaction = db.prepare('SELECT t.*, u.nickname as payee_name, u2.nickname as payer_name FROM transactions t LEFT JOIN users u ON t.payee_id = u.id LEFT JOIN users u2 ON t.payer_id = u2.id WHERE t.id = ?').get(transactionId);
    
    if (!transaction) {
      return res.status(404).json(error('交易不存在'));
    }
    res.json(success(transaction));
  } catch (err) {
    console.error('获取交易状态失败:', err);
    res.status(500).json(error('获取交易状态失败'));
  }
};

const getTransactionList = (req, res) => {
  const userId = req.user.id;
  const { type = 'all' } = req.query;

  let query, params;

  if (type === 'payer') {
    query = 'SELECT t.*, u.nickname as payee_name FROM transactions t LEFT JOIN users u ON t.payee_id = u.id WHERE t.payer_id = ? ORDER BY t.created_at DESC LIMIT 50';
    params = [userId];
  } else if (type === 'payee') {
    query = 'SELECT t.*, u.nickname as payer_name FROM transactions t LEFT JOIN users u ON t.payer_id = u.id WHERE t.payee_id = ? ORDER BY t.created_at DESC LIMIT 50';
    params = [userId];
  } else {
    query = 'SELECT t.*, u.nickname as payee_name, u2.nickname as payer_name FROM transactions t LEFT JOIN users u ON t.payee_id = u.id LEFT JOIN users u2 ON t.payer_id = u2.id WHERE t.payer_id = ? OR t.payee_id = ? ORDER BY t.created_at DESC LIMIT 50';
    params = [userId, userId];
  }

  try {
    const transactions = db.prepare(query).all(...params);
    res.json(success(transactions));
  } catch (err) {
    console.error('获取交易记录失败:', err);
    res.status(500).json(error('获取交易记录失败'));
  }
};

const createRefund = (req, res) => {
  const userId = req.user.id;
  const transactionId = req.params.id;
  const { reason } = req.body;

  try {
    const transaction = db.prepare('SELECT * FROM transactions WHERE id = ? AND payee_id = ? AND status = ?').get(transactionId, userId, 'success');
    
    if (!transaction) {
      return res.status(400).json(error('无法退款'));
    }

    const result = db.prepare('INSERT INTO refunds (transaction_id, refund_amount, reason, status) VALUES (?, ?, ?, ?)').run(transactionId, transaction.amount, reason || '', 'pending');

    setTimeout(() => {
      db.prepare('UPDATE refunds SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?').run('success', result.lastInsertRowid);
      db.prepare('UPDATE transactions SET status = ? WHERE id = ?').run('refunded', transactionId);
    }, 2000);

    res.json(success({ refund_id: result.lastInsertRowid }, '退款申请已提交'));
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json(error('已申请退款'));
    }
    console.error('退款申请失败:', err);
    res.status(500).json(error('退款申请失败'));
  }
};

module.exports = { getMerchantStore, createMerchantStore, createTransaction, getTransactionStatus, getTransactionList, createRefund };
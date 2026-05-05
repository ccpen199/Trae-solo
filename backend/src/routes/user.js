const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken, checkVerification, checkDeposit } = require('../middleware/auth');

router.get('/profile', authenticateToken, (req, res) => {
  const user = db.prepare(`
    SELECT id, phone, nickname, avatar, real_name, is_verified, 
           has_deposit, deposit_amount, credit_score, credit_authorized, balance
    FROM users WHERE id = ?
  `).get(req.user.id);

  const activeOrder = db.prepare(`
    SELECT o.id, o.order_no, o.start_time, o.status,
           b.bike_code, b.plate_number, b.battery
    FROM orders o
    JOIN bikes b ON o.bike_id = b.id
    WHERE o.user_id = ? AND o.status = 'riding'
  `).get(req.user.id);

  res.json({
    success: true,
    user: {
      ...user,
      isVerified: user.is_verified === 1,
      hasDeposit: user.has_deposit === 1,
      creditAuthorized: user.credit_authorized === 1
    },
    activeOrder
  });
});

router.post('/verify', authenticateToken, (req, res) => {
  const { realName, idCard } = req.body;

  if (!realName || !idCard) {
    return res.status(400).json({ error: '请输入真实姓名和身份证号' });
  }

  const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  if (!idCardRegex.test(idCard)) {
    return res.status(400).json({ error: '身份证号格式不正确' });
  }

  db.prepare(`
    UPDATE users 
    SET is_verified = 1, real_name = ?, id_card = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(realName, idCard, req.user.id);

  res.json({
    success: true,
    message: '实名认证成功'
  });
});

router.post('/deposit', authenticateToken, checkVerification, (req, res) => {
  const { amount } = req.body;
  const depositAmount = amount || 299;

  if (req.user.has_deposit === 1) {
    return res.status(400).json({ error: '您已缴纳押金' });
  }

  const transactionId = `DP${Date.now()}`;

  db.prepare(`
    INSERT INTO deposits (user_id, amount, type, transaction_id)
    VALUES (?, ?, 'pay', ?)
  `).run(req.user.id, depositAmount, transactionId);

  db.prepare(`
    UPDATE users 
    SET has_deposit = 1, deposit_amount = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(depositAmount, req.user.id);

  res.json({
    success: true,
    message: '押金缴纳成功',
    transactionId,
    amount: depositAmount
  });
});

router.post('/credit-auth', authenticateToken, checkVerification, (req, res) => {
  if (req.user.credit_authorized === 1) {
    return res.status(400).json({ error: '您已授权芝麻信用' });
  }

  const creditScore = Math.floor(Math.random() * 200) + 550;

  db.prepare(`
    UPDATE users 
    SET credit_authorized = 1, credit_score = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(creditScore, req.user.id);

  const eligible = creditScore >= 650;

  res.json({
    success: true,
    creditScore,
    eligible,
    message: eligible ? '信用分达标，可免押金骑行' : '信用分不足，需缴纳押金'
  });
});

router.get('/onboarding-status', authenticateToken, (req, res) => {
  const user = db.prepare(`
    SELECT is_verified, has_deposit, credit_authorized, credit_score
    FROM users WHERE id = ?
  `).get(req.user.id);

  const canRide = (user.is_verified === 1) && (
    user.has_deposit === 1 || 
    (user.credit_authorized === 1 && user.credit_score >= 650)
  );

  res.json({
    success: true,
    isVerified: user.is_verified === 1,
    hasDeposit: user.has_deposit === 1,
    creditAuthorized: user.credit_authorized === 1,
    creditScore: user.credit_score,
    canRide,
    nextStep: !user.is_verified ? 'verify' : 
              (!user.has_deposit && !(user.credit_authorized === 1 && user.credit_score >= 650)) ? 'deposit' : 
              'home'
  });
});

router.get('/orders', authenticateToken, (req, res) => {
  const { status, limit = 10 } = req.query;

  let query = `
    SELECT o.id, o.order_no, o.start_time, o.end_time, o.duration, 
           o.distance, o.final_amount, o.status, o.payment_status,
           b.bike_code, b.plate_number
    FROM orders o
    JOIN bikes b ON o.bike_id = b.id
    WHERE o.user_id = ?
  `;

  const params = [req.user.id];

  if (status && status !== 'all') {
    query += ' AND o.status = ?';
    params.push(status);
  }

  query += ' ORDER BY o.created_at DESC LIMIT ?';
  params.push(parseInt(limit));

  const orders = db.prepare(query).all(...params);

  res.json({
    success: true,
    orders: orders.map(order => ({
      ...order,
      durationFormatted: formatDuration(order.duration),
      amountFormatted: order.final_amount ? `¥${order.final_amount.toFixed(2)}` : '待支付'
    }))
  });
});

function formatDuration(minutes) {
  if (!minutes) return '0分钟';
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
}

module.exports = router;

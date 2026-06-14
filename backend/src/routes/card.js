const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function generateQRToken(userId, cardId) {
  const timestamp = Date.now();
  const nonce = Math.random().toString(36).slice(2, 10);
  const payload = `${userId}:${cardId}:${timestamp}:${nonce}`;
  const token = crypto.createHmac('sha256', 'tianfutong_qr_secret').update(payload).digest('hex');
  return `${token.slice(0, 32)}${timestamp.toString(36)}${nonce}`;
}

router.get('/my-cards', authenticateToken, (req, res) => {
  const cards = db.prepare('SELECT * FROM tianfutong_cards WHERE user_id = ?').all(req.user.id);
  res.success(cards, '获取成功');
});

router.post('/apply-card', authenticateToken, (req, res) => {
  const { card_type, region } = req.body;
  
  if (!card_type) {
    return res.error('卡类型不能为空', 400);
  }
  
  const cardNo = 'TF' + Date.now().toString().slice(-10) + Math.floor(Math.random() * 100);
  
  db.prepare(`
    INSERT INTO tianfutong_cards (user_id, card_no, card_type, region)
    VALUES (?, ?, ?, ?)
  `).run(req.user.id, cardNo, card_type, region || '成都市');
  
  res.success({ card_no: cardNo }, '申请成功');
});

router.get('/qrcode/:cardId', authenticateToken, (req, res) => {
  const { cardId } = req.params;
  
  const card = db.prepare('SELECT * FROM tianfutong_cards WHERE id = ? AND user_id = ?').get(cardId, req.user.id);
  
  if (!card) {
    return res.error('卡片不存在', 404);
  }
  
  if (card.card_status !== 'active') {
    return res.error('卡片状态异常', 400);
  }
  
  if (card.balance < 2 && card.times_count < 1) {
    return res.error('余额不足或次数用完，请先充值', 400);
  }
  
  const qrToken = generateQRToken(req.user.id, cardId);
  const expiresAt = Date.now() + 60 * 1000;
  
  db.prepare(`
    UPDATE tianfutong_cards SET qr_token = ?, qr_expires_at = ?, last_used_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(qrToken, expiresAt, cardId);
  
  res.success({
    qr_token: qrToken,
    card_no: card.card_no,
    card_type: card.card_type,
    balance: card.balance,
    times_count: card.times_count,
    expires_at: expiresAt,
    qr_data: `tft://${card.card_no}/${qrToken}/${expiresAt}`
  }, '获取二维码成功');
});

router.post('/scan-gate', authenticateToken, (req, res) => {
  const { qr_token, station, gate_type, transport_type } = req.body;
  
  if (!qr_token || !station || !gate_type) {
    return res.error('参数不完整', 400);
  }
  
  const card = db.prepare('SELECT * FROM tianfutong_cards WHERE qr_token = ?').get(qr_token);
  
  if (!card) {
    return res.error('二维码无效', 400);
  }
  
  if (card.card_status !== 'active') {
    return res.error('卡片已停用', 403);
  }
  
  if (card.qr_expires_at && card.qr_expires_at < Date.now()) {
    return res.error('二维码已过期', 400);
  }
  
  const recentTx = db.prepare(`
    SELECT * FROM transactions 
    WHERE card_id = ? AND created_at >= datetime('now', '-1 hour')
    ORDER BY created_at DESC LIMIT 1
  `).get(card.id);
  
  const txNo = 'TX' + Date.now().toString() + Math.floor(Math.random() * 1000);
  
  if (gate_type === 'in') {
    db.prepare(`
      INSERT INTO transactions (transaction_no, user_id, card_id, card_no, transaction_type, amount, transport_type, route_name, station_in, status)
      VALUES (?, ?, ?, ?, 'ride_start', 0, ?, ?, ?, 'pending')
    `).run(txNo, card.user_id, card.id, card.card_no, transport_type || 'metro', station);
    
    res.success({ transaction_no: txNo, station_in: station }, '进站成功');
  } else if (gate_type === 'out') {
    if (!recentTx || recentTx.transaction_type !== 'ride_start' || recentTx.status !== 'pending') {
      return res.error('未找到进站记录', 400);
    }
    
    const route = db.prepare('SELECT fare FROM routes WHERE route_name LIKE ? LIMIT 1').get(`%${transport_type || '地铁'}%`);
    const fare = route ? route.fare : 2.0;
    
    let actualFare = fare;
    let paymentMethod = 'balance';
    
    if (card.times_count > 0 && transport_type === 'metro') {
      db.prepare('UPDATE tianfutong_cards SET times_count = times_count - 1 WHERE id = ?').run(card.id);
      actualFare = 0;
      paymentMethod = 'times';
    } else if (card.balance >= fare) {
      db.prepare('UPDATE tianfutong_cards SET balance = balance - ? WHERE id = ?').run(fare, card.id);
    } else {
      const channel = db.prepare('SELECT * FROM payment_channels WHERE user_id = ? AND is_default = 1 AND status = 1').get(card.user_id);
      if (channel) {
        paymentMethod = channel.channel_type;
      } else {
        return res.error('余额不足且未设置代扣渠道', 400);
      }
    }
    
    const balanceAfter = card.balance - (paymentMethod === 'balance' ? fare : 0);
    
    db.prepare(`
      UPDATE transactions 
      SET transaction_type = 'ride_complete', amount = ?, station_out = ?, status = 'success', payment_channel = ?, balance_before = ?, balance_after = ?
      WHERE id = ?
    `).run(fare, station, paymentMethod, card.balance, balanceAfter, recentTx.id);
    
    db.prepare(`
      UPDATE tianfutong_cards SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(card.id);
    
    const pointsEarned = Math.floor(fare);
    db.prepare('UPDATE user_points SET points = points + ?, total_points = total_points + ? WHERE user_id = ?')
      .run(pointsEarned, pointsEarned, card.user_id);
    db.prepare('INSERT INTO point_history (user_id, points, type, reason, related_transaction_id) VALUES (?, ?, "earn", ?, ?)')
      .run(card.user_id, pointsEarned, '乘车消费赠积分', recentTx.id);
    
    res.success({
      transaction_no: recentTx.transaction_no,
      fare,
      actual_paid: paymentMethod === 'times' ? '次卡抵扣' : fare,
      payment_method: paymentMethod,
      balance_after: balanceAfter,
      times_after: card.times_count - (paymentMethod === 'times' ? 1 : 0),
      points_earned: pointsEarned,
      station_out: station
    }, '出站成功');
  }
});

router.post('/recharge', authenticateToken, (req, res) => {
  const { card_id, recharge_type, amount, times, payment_method } = req.body;
  
  if (!card_id || !recharge_type || !payment_method) {
    return res.error('参数不完整', 400);
  }
  
  if (recharge_type === 'balance' && (!amount || amount <= 0)) {
    return res.error('充值金额不能为空', 400);
  }
  
  if (recharge_type === 'times' && (!times || times <= 0)) {
    return res.error('充值次数不能为空', 400);
  }
  
  const orderNo = 'RC' + Date.now().toString() + Math.floor(Math.random() * 1000);
  
  db.prepare(`
    INSERT INTO recharge_orders (order_no, user_id, card_id, recharge_type, amount, times, payment_method)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(orderNo, req.user.id, card_id, recharge_type, amount || 0, times || 0, payment_method);
  
  const card = db.prepare('SELECT * FROM tianfutong_cards WHERE id = ?').get(card_id);
  const newBalance = recharge_type === 'balance' ? card.balance + amount : card.balance;
  const newTimes = recharge_type === 'times' ? card.times_count + times : card.times_count;
  
  db.prepare(`
    UPDATE tianfutong_cards SET balance = ?, times_count = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newBalance, newTimes, card_id);
  
  db.prepare(`
    UPDATE recharge_orders SET status = 'success', paid_at = CURRENT_TIMESTAMP
    WHERE order_no = ?
  `).run(orderNo);
  
  const txNo = 'TX' + Date.now().toString() + Math.floor(Math.random() * 1000);
  db.prepare(`
    INSERT INTO transactions (transaction_no, user_id, card_id, card_no, transaction_type, amount, balance_before, balance_after, payment_channel, status)
    VALUES (?, ?, ?, ?, 'recharge', ?, ?, ?, ?, 'success')
  `).run(txNo, req.user.id, card_id, card.card_no, amount || times * 2, card.balance, newBalance, payment_method);
  
  res.success({
    order_no: orderNo,
    recharge_type,
    amount,
    times,
    new_balance: newBalance,
    new_times: newTimes
  }, '充值成功');
});

router.get('/renewal/apply', authenticateToken, (req, res) => {
  const cards = db.prepare('SELECT * FROM tianfutong_cards WHERE user_id = ? AND card_type IN (?, ?)')
    .all(req.user.id, 'student', 'elderly');
  
  res.success(cards, '获取成功');
});

router.post('/renewal/apply', authenticateToken, (req, res) => {
  const { card_id, renewal_type, documents } = req.body;
  
  if (!card_id || !renewal_type) {
    return res.error('参数不完整', 400);
  }
  
  const renewalNo = 'RN' + Date.now().toString() + Math.floor(Math.random() * 1000);
  
  db.prepare(`
    INSERT INTO card_renewals (renewal_no, user_id, card_id, renewal_type, documents)
    VALUES (?, ?, ?, ?, ?)
  `).run(renewalNo, req.user.id, card_id, renewal_type, documents || '');
  
  res.success({ renewal_no: renewalNo }, '申请提交成功');
});

router.get('/renewal/list', authenticateToken, (req, res) => {
  const renewals = db.prepare(`
    SELECT cr.*, tc.card_no, tc.card_type
    FROM card_renewals cr
    LEFT JOIN tianfutong_cards tc ON cr.card_id = tc.id
    WHERE cr.user_id = ?
    ORDER BY cr.created_at DESC
  `).all(req.user.id);
  
  res.success(renewals, '获取成功');
});

router.get('/transactions', authenticateToken, (req, res) => {
  const { page = 1, page_size = 20 } = req.query;
  const offset = (page - 1) * page_size;
  
  const transactions = db.prepare(`
    SELECT * FROM transactions 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `).all(req.user.id, parseInt(page_size), offset);
  
  const total = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE user_id = ?').get(req.user.id).count;
  
  res.success({
    list: transactions,
    total,
    page: parseInt(page),
    page_size: parseInt(page_size)
  }, '获取成功');
});

router.get('/payment-channels', authenticateToken, (req, res) => {
  const channels = db.prepare('SELECT * FROM payment_channels WHERE user_id = ?').all(req.user.id);
  res.success(channels, '获取成功');
});

router.post('/payment-channels', authenticateToken, (req, res) => {
  const { channel_type, channel_name, account_info, is_default } = req.body;
  
  if (!channel_type || !channel_name) {
    return res.error('参数不完整', 400);
  }
  
  if (is_default) {
    db.prepare('UPDATE payment_channels SET is_default = 0 WHERE user_id = ?').run(req.user.id);
  }
  
  const result = db.prepare(`
    INSERT INTO payment_channels (user_id, channel_type, channel_name, account_info, is_default)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.user.id, channel_type, channel_name, account_info || '', is_default ? 1 : 0);
  
  res.success({ id: result.lastInsertRowid }, '添加成功');
});

module.exports = router;

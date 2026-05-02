const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const auditService = require('../services/audit.service');
const disputeResolvingService = require('../services/dispute-resolving.service');
const { v4: uuidv4 } = require('uuid');

const generateSessionId = () => {
  return `CHAT${uuidv4().replace(/-/g, '').substring(0, 16)}`;
};

router.get('/sessions', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const sessions = db.prepare(`
    SELECT 
      cs.*,
      p.title as product_title,
      p.images as product_images,
      p.price as product_price,
      seller.nickname as seller_nickname,
      seller.avatar as seller_avatar,
      buyer.nickname as buyer_nickname,
      buyer.avatar as buyer_avatar
    FROM chat_sessions cs
    JOIN products p ON cs.product_id = p.id
    LEFT JOIN users seller ON cs.seller_id = seller.id
    LEFT JOIN users buyer ON cs.buyer_id = buyer.id
    WHERE cs.seller_id = ? OR cs.buyer_id = ?
    ORDER BY cs.last_message_time DESC
  `).all(userId, userId);

  const formattedSessions = sessions.map(s => ({
    ...s,
    productImages: s.product_images ? JSON.parse(s.product_images) : [],
    unreadCount: s.seller_id === userId ? s.unread_count_seller : s.unread_count_buyer,
    otherUser: s.seller_id === userId 
      ? { id: s.buyer_id, nickname: s.buyer_nickname, avatar: s.buyer_avatar }
      : { id: s.seller_id, nickname: s.seller_nickname, avatar: s.seller_avatar }
  }));

  res.json({
    success: true,
    data: formattedSessions
  });
});

router.get('/session/:productId', authenticateToken, (req, res) => {
  const productId = req.params.productId;
  const userId = req.user.id;

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: '商品不存在'
    });
  }

  if (product.seller_id === userId) {
    return res.status(400).json({
      success: false,
      message: '不能与自己聊天'
    });
  }

  let session = db.prepare(`
    SELECT 
      cs.*,
      p.title as product_title,
      p.images as product_images,
      p.price as product_price,
      seller.nickname as seller_nickname,
      seller.avatar as seller_avatar,
      buyer.nickname as buyer_nickname,
      buyer.avatar as buyer_avatar
    FROM chat_sessions cs
    JOIN products p ON cs.product_id = p.id
    LEFT JOIN users seller ON cs.seller_id = seller.id
    LEFT JOIN users buyer ON cs.buyer_id = buyer.id
    WHERE cs.product_id = ? AND cs.buyer_id = ?
  `).get(productId, userId);

  if (!session) {
    const sessionId = generateSessionId();
    
    db.prepare(`
      INSERT INTO chat_sessions (
        session_id, product_id, seller_id, buyer_id, status
      ) VALUES (?, ?, ?, ?, ?)
    `).run(sessionId, productId, product.seller_id, userId, 'active');

    session = db.prepare(`
      SELECT 
        cs.*,
        p.title as product_title,
        p.images as product_images,
        p.price as product_price,
        seller.nickname as seller_nickname,
        seller.avatar as seller_avatar,
        buyer.nickname as buyer_nickname,
        buyer.avatar as buyer_avatar
      FROM chat_sessions cs
      JOIN products p ON cs.product_id = p.id
      LEFT JOIN users seller ON cs.seller_id = seller.id
      LEFT JOIN users buyer ON cs.buyer_id = buyer.id
      WHERE cs.session_id = ?
    `).get(sessionId);

    auditService.logCreate({
      user: req.user,
      module: auditService.MODULES.CHAT,
      resourceType: 'chat_session',
      resourceId: sessionId,
      description: `创建聊天会话: 商品 ${product.title}`
    });
  }

  res.json({
    success: true,
    data: {
      ...session,
      productImages: session.product_images ? JSON.parse(session.product_images) : [],
      unreadCount: session.seller_id === userId ? session.unread_count_seller : session.unread_count_buyer,
      otherUser: session.seller_id === userId 
        ? { id: session.buyer_id, nickname: session.buyer_nickname, avatar: session.buyer_avatar }
        : { id: session.seller_id, nickname: session.seller_nickname, avatar: session.seller_avatar }
    }
  });
});

router.get('/messages/:sessionId', authenticateToken, (req, res) => {
  const sessionId = req.params.sessionId;
  const userId = req.user.id;
  const { before, limit = 50 } = req.query;

  const session = db.prepare('SELECT * FROM chat_sessions WHERE session_id = ?').get(sessionId);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: '会话不存在'
    });
  }

  if (session.seller_id !== userId && session.buyer_id !== userId) {
    return res.status(403).json({
      success: false,
      message: '无权访问此会话'
    });
  }

  let sql = `
    SELECT 
      cm.*,
      sender.nickname as sender_nickname,
      sender.avatar as sender_avatar
    FROM chat_messages cm
    LEFT JOIN users sender ON cm.sender_id = sender.id
    WHERE cm.session_id = ?
  `;
  const params = [sessionId];

  if (before) {
    sql += ' AND cm.id < ?';
    params.push(parseInt(before));
  }

  sql += ' ORDER BY cm.id DESC LIMIT ?';
  params.push(parseInt(limit));

  const messages = db.prepare(sql).all(...params).reverse();

  const unreadField = session.seller_id === userId ? 'unread_count_seller' : 'unread_count_buyer';
  db.prepare(`UPDATE chat_sessions SET ${unreadField} = 0 WHERE session_id = ?`).run(sessionId);

  db.prepare(`
    UPDATE chat_messages 
    SET is_read = 1, read_at = CURRENT_TIMESTAMP 
    WHERE session_id = ? AND receiver_id = ? AND is_read = 0
  `).run(sessionId, userId);

  const formattedMessages = messages.map(m => ({
    ...m,
    isMine: m.sender_id === userId,
    isFlagged: m.is_flagged === 1
  }));

  auditService.logQuery({
    user: req.user,
    module: auditService.MODULES.CHAT,
    resourceType: 'chat_session',
    resourceId: sessionId,
    description: `查看聊天消息，共 ${formattedMessages.length} 条`
  });

  res.json({
    success: true,
    data: {
      messages: formattedMessages,
      hasMore: messages.length >= limit,
      isFraudDetected: session.is_fraud_detected === 1,
      fraudWarning: session.fraud_warning
    }
  });
});

router.post('/messages', authenticateToken, (req, res) => {
  const { sessionId, content, messageType = 'text' } = req.body;
  const senderId = req.user.id;

  if (!sessionId || !content) {
    return res.status(400).json({
      success: false,
      message: '会话ID和消息内容不能为空'
    });
  }

  const session = db.prepare('SELECT * FROM chat_sessions WHERE session_id = ?').get(sessionId);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: '会话不存在'
    });
  }

  if (session.seller_id !== senderId && session.buyer_id !== senderId) {
    return res.status(403).json({
      success: false,
      message: '无权发送消息'
    });
  }

  const receiverId = session.seller_id === senderId ? session.buyer_id : session.seller_id;

  const fraudCheck = disputeResolvingService.checkFraudContent(content);

  const insertStmt = db.prepare(`
    INSERT INTO chat_messages (
      session_id, sender_id, receiver_id, content, message_type, is_flagged, flag_reason
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insertStmt.run(
    sessionId,
    senderId,
    receiverId,
    content,
    messageType,
    fraudCheck.isFraud ? 1 : 0,
    fraudCheck.warning || null
  );

  const messageId = result.lastInsertRowid;

  const unreadField = session.seller_id === receiverId ? 'unread_count_seller' : 'unread_count_buyer';
  
  db.prepare(`
    UPDATE chat_sessions 
    SET last_message = ?, last_message_time = CURRENT_TIMESTAMP, ${unreadField} = ${unreadField} + 1,
        is_fraud_detected = CASE WHEN ? = 1 THEN 1 ELSE is_fraud_detected END,
        fraud_warning = CASE WHEN ? = 1 THEN ? ELSE fraud_warning END,
        updated_at = CURRENT_TIMESTAMP
    WHERE session_id = ?
  `).run(
    content.substring(0, 100),
    fraudCheck.isFraud ? 1 : 0,
    fraudCheck.isFraud ? 1 : 0,
    fraudCheck.warning,
    sessionId
  );

  const message = db.prepare(`
    SELECT 
      cm.*,
      sender.nickname as sender_nickname,
      sender.avatar as sender_avatar
    FROM chat_messages cm
    LEFT JOIN users sender ON cm.sender_id = sender.id
    WHERE cm.id = ?
  `).get(messageId);

  auditService.logCreate({
    user: req.user,
    module: auditService.MODULES.CHAT,
    resourceType: 'chat_message',
    resourceId: messageId,
    newValue: { sessionId, content: content.substring(0, 50), isFraud: fraudCheck.isFraud },
    description: `发送消息${fraudCheck.isFraud ? ' (检测到欺诈内容)' : ''}`
  });

  res.json({
    success: true,
    data: {
      ...message,
      isMine: true,
      isFlagged: message.is_flagged === 1,
      fraudCheck
    }
  });
});

router.post('/messages/:messageId/flag', authenticateToken, (req, res) => {
  const messageId = req.params.messageId;
  const userId = req.user.id;
  const { reason } = req.body;

  const message = db.prepare('SELECT * FROM chat_messages WHERE id = ?').get(messageId);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: '消息不存在'
    });
  }

  if (message.sender_id === userId) {
    return res.status(400).json({
      success: false,
      message: '不能举报自己发送的消息'
    });
  }

  const flaggedMessage = disputeResolvingService.flagMessage(
    messageId, 
    reason || '用户举报欺诈内容',
    req.user
  );

  res.json({
    success: true,
    message: '消息已标记',
    data: {
      ...flaggedMessage,
      isFlagged: flaggedMessage.is_flagged === 1
    }
  });
});

router.get('/check-fraud', authenticateToken, (req, res) => {
  const { content } = req.query;

  if (!content) {
    return res.status(400).json({
      success: false,
      message: '请提供要检查的内容'
    });
  }

  const fraudCheck = disputeResolvingService.checkFraudContent(content);

  res.json({
    success: true,
    data: fraudCheck
  });
});

module.exports = router;

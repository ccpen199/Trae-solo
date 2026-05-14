const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');

const sendMessage = async (req, res) => {
  const { orderId, content } = req.body;
  const user_id = req.user.id;

  if (!content) {
    return res.status(400).json({ success: false, message: '消息内容不能为空' });
  }

  const messageId = uuidv4();
  
  let order = null;
  let toUserId = null;
  
  if (orderId) {
    order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (order && order.user_id === user_id) {
      toUserId = order.driver_id;
    }
  }

  db.prepare(`
    INSERT INTO messages (id, order_id, from_user_id, to_user_id, content, type, is_read)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(messageId, orderId || null, user_id, toUserId || 'system', content, 'text', 0);

  if (order && Math.random() > 0.5) {
    const replies = [
      '好的，我知道了',
      '收到，请稍等',
      '马上就到',
      '好的，我正在往那边走',
      '明白，请耐心等待'
    ];
    const replyId = uuidv4();
    const reply = replies[Math.floor(Math.random() * replies.length)];
    
    db.prepare(`
      INSERT INTO messages (id, order_id, from_user_id, to_user_id, content, type, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(replyId, orderId, toUserId, user_id, reply, 'text', 0);
  }

  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);

  res.json({
    success: true,
    message: '消息发送成功',
    data: message
  });
};

const getMessages = async (req, res) => {
  const { orderId, limit = 50, offset = 0 } = req.query;
  const user_id = req.user.id;

  let query = `
    SELECT m.*, 
           CASE WHEN m.from_user_id = ? THEN 1 ELSE 0 END as is_from_me
    FROM messages m
    WHERE (m.from_user_id = ? OR m.to_user_id = ?)
  `;
  const params = [user_id, user_id, user_id];

  if (orderId) {
    query += ' AND m.order_id = ?';
    params.push(orderId);
  }

  query += ' ORDER BY m.created_at ASC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const messages = db.prepare(query).all(...params);

  res.json({
    success: true,
    data: messages
  });
};

const getUnreadCount = async (req, res) => {
  const user_id = req.user.id;

  const count = db.prepare(`
    SELECT COUNT(*) as unread_count
    FROM messages
    WHERE to_user_id = ? AND is_read = 0
  `).get(user_id);

  res.json({
    success: true,
    data: { unread_count: count.unread_count }
  });
};

const markAsRead = async (req, res) => {
  const { orderId, messageId } = req.body;
  const user_id = req.user.id;

  let query = 'UPDATE messages SET is_read = 1 WHERE to_user_id = ?';
  const params = [user_id];

  if (orderId) {
    query += ' AND order_id = ?';
    params.push(orderId);
  } else if (messageId) {
    query += ' AND id = ?';
    params.push(messageId);
  }

  db.prepare(query).run(...params);

  res.json({
    success: true,
    message: '消息已标记为已读'
  });
};

const getAnnouncements = async (req, res) => {
  const { type, limit = 20, offset = 0 } = req.query;

  let query = `
    SELECT * FROM announcements 
    WHERE is_active = 1
  `;
  const params = [];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  query += ' ORDER BY priority DESC, created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const announcements = db.prepare(query).all(...params);

  res.json({
    success: true,
    data: announcements
  });
};

const getAnnouncementById = async (req, res) => {
  const { id } = req.params;

  const announcement = db.prepare('SELECT * FROM announcements WHERE id = ? AND is_active = 1').get(id);

  if (!announcement) {
    return res.status(404).json({ success: false, message: '公告不存在' });
  }

  res.json({
    success: true,
    data: announcement
  });
};

const getConversations = async (req, res) => {
  const user_id = req.user.id;

  const conversations = db.prepare(`
    SELECT 
      m.order_id,
      MAX(m.created_at) as last_message_time,
      COUNT(CASE WHEN m.to_user_id = ? AND m.is_read = 0 THEN 1 END) as unread_count,
      (SELECT content FROM messages WHERE order_id = m.order_id ORDER BY created_at DESC LIMIT 1) as last_message
    FROM messages m
    WHERE m.from_user_id = ? OR m.to_user_id = ?
    GROUP BY m.order_id
    ORDER BY last_message_time DESC
  `).all(user_id, user_id, user_id);

  res.json({
    success: true,
    data: conversations
  });
};

module.exports = {
  sendMessage,
  getMessages,
  getUnreadCount,
  markAsRead,
  getAnnouncements,
  getAnnouncementById,
  getConversations
};
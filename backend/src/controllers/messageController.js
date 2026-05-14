const { db } = require('../models/database')

function sendMessage(req, res) {
  const { toUserId, content, type } = req.body
  const fromUserId = req.user.userId

  if (!toUserId || !content) {
    return res.status(400).json({ success: false, message: '缺少参数' })
  }

  const result = db.prepare('INSERT INTO messages (from_user_id, to_user_id, content, type) VALUES (?, ?, ?, ?)')
    .run(fromUserId, toUserId, content, type || 'text')

  res.json({ success: true, data: { id: result.lastInsertRowid } })
}

function getMessages(req, res) {
  const { otherUserId } = req.params
  const userId = req.user.userId

  const messages = db.prepare(`
    SELECT * FROM messages 
    WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)
    ORDER BY created_at ASC LIMIT 50
  `).all(userId, otherUserId, otherUserId, userId)

  res.json({ success: true, data: messages })
}

function getConversations(req, res) {
  const userId = req.user.userId

  const conversations = db.prepare(`
    SELECT DISTINCT 
      CASE WHEN from_user_id = ? THEN to_user_id ELSE from_user_id END as other_user_id,
      MAX(created_at) as last_message_time
    FROM messages 
    WHERE from_user_id = ? OR to_user_id = ?
    GROUP BY other_user_id
    ORDER BY last_message_time DESC
  `).all(userId, userId, userId)

  if (conversations.length === 0) {
    return res.json({ success: true, data: [] })
  }

  const userIds = conversations.map(c => c.other_user_id)
  const placeholders = userIds.map(() => '?').join(',')
  
  const users = db.prepare(`SELECT id, avatar, nickname FROM users WHERE id IN (${placeholders})`).all(...userIds)
  const userMap = {}
  users.forEach(u => userMap[u.id] = u)

  const result = conversations.map(c => ({
    user: userMap[c.other_user_id],
    lastMessageTime: c.last_message_time
  }))

  res.json({ success: true, data: result })
}

module.exports = { sendMessage, getMessages, getConversations }

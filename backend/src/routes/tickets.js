const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

router.get('/types', (req, res) => {
  res.json({
    types: [
      { id: 'refund', name: '退订申请', description: '报刊杂志退订', icon: '↩️' },
      { id: 'resend', name: '补寄申请', description: '缺失刊物补寄', icon: '📦' },
      { id: 'damage', name: '破损索赔', description: '物品破损赔偿', icon: '💔' },
      { id: 'other', name: '其他问题', description: '其他售后服务', icon: '❓' }
    ],
    statuses: [
      { id: 'open', name: '待处理', color: 'red' },
      { id: 'processing', name: '处理中', color: 'blue' },
      { id: 'closed', name: '已关闭', color: 'default' }
    ],
    priorities: [
      { id: 'high', name: '高', color: 'red' },
      { id: 'normal', name: '普通', color: 'blue' },
      { id: 'low', name: '低', color: 'default' }
    ]
  });
});

router.get('/my', authenticateToken, (req, res) => {
  const db = getDb();
  const tickets = db.prepare(`
    SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.user.id);
  
  res.json({ tickets, total: tickets.length });
});

router.get('/:id', authenticateToken, (req, res) => {
  const db = getDb();
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  
  if (!ticket) {
    return res.status(404).json({ error: '工单不存在' });
  }
  
  const messages = db.prepare(`
    SELECT tm.*, u.username, u.type
    FROM ticket_messages tm
    JOIN users u ON tm.sender_id = u.id
    WHERE tm.ticket_id = ?
    ORDER BY tm.created_at ASC
  `).all(req.params.id);
  
  res.json({ ticket, messages });
});

router.post('/', authenticateToken, (req, res) => {
  const { type, related_id, title, description } = req.body;
  const db = getDb();
  
  if (!type) return res.status(400).json({ error: '请选择问题类型' });
  if (!title || title.trim() === '') return res.status(400).json({ error: '请输入问题标题' });
  if (!description || description.trim() === '') return res.status(400).json({ error: '请输入详细描述' });
  
  try {
    const result = db.prepare(`
      INSERT INTO tickets (user_id, type, related_id, title, description, status, priority)
      VALUES (?, ?, ?, ?, ?, 'open', 'normal')
    `).run(req.user.id, type, related_id || null, title.trim(), description.trim());
    
    db.prepare(`
      INSERT INTO ticket_messages (ticket_id, sender_id, content)
      VALUES (?, ?, ?)
    `).run(result.lastInsertRowid, req.user.id, description.trim());
    
    res.json({ id: result.lastInsertRowid, message: '工单创建成功，我们将尽快处理' });
  } catch (err) {
    res.status(500).json({ error: '创建失败：' + err.message });
  }
});

router.post('/:id/messages', authenticateToken, (req, res) => {
  const { content } = req.body;
  const db = getDb();
  
  if (!content || content.trim() === '') {
    return res.status(400).json({ error: '请输入消息内容' });
  }
  
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  
  if (!ticket) {
    return res.status(404).json({ error: '工单不存在' });
  }
  
  if (ticket.user_id !== req.user.id && req.user.type !== 'enterprise') {
    return res.status(403).json({ error: '无权操作' });
  }
  
  try {
    db.prepare(`
      INSERT INTO ticket_messages (ticket_id, sender_id, content)
      VALUES (?, ?, ?)
    `).run(req.params.id, req.user.id, content.trim());
    
    res.json({ message: '消息发送成功' });
  } catch (err) {
    res.status(500).json({ error: '发送失败' });
  }
});

router.put('/:id/status', authenticateToken, (req, res) => {
  const { status } = req.body;
  const db = getDb();
  
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  
  if (!ticket) {
    return res.status(404).json({ error: '工单不存在' });
  }
  
  if (ticket.user_id !== req.user.id && req.user.type !== 'enterprise') {
    return res.status(403).json({ error: '无权操作' });
  }
  
  db.prepare('UPDATE tickets SET status = ? WHERE id = ?').run(status, req.params.id);
  
  res.json({ message: '状态更新成功' });
});

module.exports = router;

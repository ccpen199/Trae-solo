const express = require('express');
const db = require('../utils/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, requireRole('admin', 'operator', 'customer_service'), (req, res) => {
  const { status, type } = req.query;
  let sql = `
    SELECT e.*, 
           g.title as game_title,
           u.nickname as user_name,
           h.nickname as handler_name
    FROM exceptions e
    LEFT JOIN games g ON e.game_id = g.id
    LEFT JOIN users u ON e.user_id = u.id
    LEFT JOIN users h ON e.handled_by = h.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND e.status = ?';
    params.push(status);
  }
  if (type) {
    sql += ' AND e.type = ?';
    params.push(type);
  }
  
  sql += ' ORDER BY e.created_at DESC';
  const exceptions = db.prepare(sql).all(...params);
  res.json(exceptions);
});

router.post('/:id/handle', authenticate, requireRole('admin', 'operator', 'customer_service'), (req, res) => {
  const { id } = req.params;
  const { notes, action } = req.body;
  
  const exception = db.prepare('SELECT * FROM exceptions WHERE id = ?').get(id);
  if (!exception) return res.status(404).json({ error: '异常不存在' });
  
  const tx = db.transaction(() => {
    if (action === 'refund' && exception.game_id) {
      const members = db.prepare(`
        SELECT user_id, deposit_paid FROM game_members WHERE game_id = ?
      `).all(exception.game_id);
      
      members.forEach(m => {
        if (m.deposit_paid > 0) {
          db.prepare(`
            INSERT INTO payments (game_id, user_id, amount, payment_type, status, refunded_amount)
            VALUES (?, ?, ?, 'refund', 'completed', ?)
          `).run(exception.game_id, m.user_id, m.deposit_paid, m.deposit_paid);
        }
      });
    }
    
    db.prepare(`
      UPDATE exceptions 
      SET status = 'handled', handled_by = ?, handled_at = CURRENT_TIMESTAMP, notes = ?
      WHERE id = ?
    `).run(req.user.id, notes, id);
  });
  
  tx();
  res.json({ message: '异常已处理' });
});

router.get('/types', authenticate, (req, res) => {
  res.json([
    { type: 'insufficient_players', name: '人数不足', description: '球局报名人数不足最低要求' },
    { type: 'temporary_leave', name: '临时退场', description: '用户报名后临时无法参加' },
    { type: 'court_conflict', name: '场地冲突', description: '时段预订冲突' },
    { type: 'deposit_refund', name: '订金退款', description: '需要处理订金退款' },
    { type: 'malicious_booking', name: '恶意占位', description: '用户恶意占位不参加' },
    { type: 'level_mismatch', name: '等级不匹配', description: '报名用户等级不符合要求' },
    { type: 'other', name: '其他异常', description: '其他类型的异常' }
  ]);
});

module.exports = router;

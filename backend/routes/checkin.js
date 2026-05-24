const express = require('express');
const db = require('../utils/db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

const createNotification = (userId, type, title, content) => {
  db.prepare(`
    INSERT INTO notifications (user_id, type, title, content)
    VALUES (?, ?, ?, ?)
  `).run(userId, type, title, content);
};

router.post('/game/:gameId/checkin', authenticate, (req, res) => {
  const gameId = req.params.gameId;
  const userId = req.body.user_id || req.user.id;
  
  const member = db.prepare(`
    SELECT gm.*, g.title FROM game_members gm
    JOIN games g ON gm.game_id = g.id
    WHERE gm.game_id = ? AND gm.user_id = ?
  `).get(gameId, userId);
  
  if (!member) return res.status(404).json({ error: '该用户未报名此球局' });
  if (member.checked_in) return res.status(400).json({ error: '已核销' });
  
  db.prepare(`
    UPDATE game_members 
    SET checked_in = 1, checkin_time = CURRENT_TIMESTAMP
    WHERE game_id = ? AND user_id = ?
  `).run(gameId, userId);
  
  createNotification(userId, 'checkin', '核销成功', `您已成功核销球局"${member.title}"`);
  
  res.json({ message: '核销成功' });
});

router.post('/game/:gameId/mark-no-show', authenticate, (req, res) => {
  const gameId = req.params.gameId;
  const { user_id } = req.body;
  
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  if (!game) return res.status(404).json({ error: '球局不存在' });
  if (game.organizer_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限操作' });
  }
  
  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE game_members 
      SET no_show = 1, checked_in = 0
      WHERE game_id = ? AND user_id = ?
    `).run(gameId, user_id);
    
    db.prepare(`
      UPDATE users 
      SET credit_score = credit_score - 10
      WHERE id = ?
    `).run(user_id);
    
    createNotification(user_id, 'no_show', '爽约记录', `您被标记为球局"${game.title}"爽约，信用分-10`);
  });
  
  tx();
  res.json({ message: '已标记爽约' });
});

router.post('/game/:gameId/complete', authenticate, (req, res) => {
  const gameId = req.params.gameId;
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  
  if (!game) return res.status(404).json({ error: '球局不存在' });
  if (game.organizer_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: '无权限操作' });
  }
  
  const members = db.prepare(`
    SELECT gm.*, u.nickname 
    FROM game_members gm
    JOIN users u ON gm.user_id = u.id
    WHERE gm.game_id = ? AND gm.checked_in = 1
  `).all(gameId);
  
  const totalFee = game.total_fee || game.deposit_amount * members.length;
  const perPerson = members.length > 0 ? totalFee / members.length : 0;
  
  const tx = db.transaction(() => {
    members.forEach(m => {
      db.prepare(`
        UPDATE game_members 
        SET actual_fee = ?, status = 'completed'
        WHERE id = ?
      `).run(perPerson, m.id);
      
      db.prepare(`
        INSERT INTO payments (game_id, user_id, amount, payment_type, status)
        VALUES (?, ?, ?, 'aa_fee', 'completed')
      `).run(gameId, m.user_id, perPerson);
    });
    
    db.prepare('UPDATE games SET status = ?, total_fee = ? WHERE id = ?').run('completed', totalFee, gameId);
    db.prepare('UPDATE time_slots SET status = ? WHERE id = ?').run('used', game.time_slot_id);
    
    members.forEach(m => {
      createNotification(m.user_id, 'game_completed', '球局已完成', `球局"${game.title}"已完成，AA费用：¥${perPerson.toFixed(2)}`);
    });
  });
  
  tx();
  
  res.json({ message: '球局已完成', total_fee: totalFee, per_person: perPerson });
});

router.post('/game/:gameId/review', authenticate, (req, res) => {
  const gameId = req.params.gameId;
  const { target_user_id, rating, comment, credit_impact } = req.body;
  
  const existing = db.prepare(`
    SELECT * FROM reviews 
    WHERE game_id = ? AND reviewer_id = ? AND target_user_id = ?
  `).get(gameId, req.user.id, target_user_id);
  
  if (existing) return res.status(400).json({ error: '已评价过该用户' });
  
  const tx = db.transaction(() => {
    db.prepare(`
      INSERT INTO reviews (game_id, reviewer_id, target_user_id, rating, comment, credit_impact)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(gameId, req.user.id, target_user_id, rating, comment, credit_impact || 0);
    
    if (credit_impact) {
      db.prepare(`
        UPDATE users 
        SET credit_score = MAX(0, MIN(100, credit_score + ?))
        WHERE id = ?
      `).run(credit_impact, target_user_id);
    }
  });
  
  tx();
  res.json({ message: '评价成功' });
});

module.exports = router;

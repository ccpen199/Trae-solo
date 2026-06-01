const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

router.get('/settlements', authMiddleware, (req, res) => {
  const db = req.db;
  const { page = 1, pageSize = 20, author_id, period, status } = req.query;
  
  let where = 'WHERE 1=1';
  let params = [];
  
  if (req.user.role === 'author') {
    where += ' AND s.author_id = ?';
    params.push(req.user.id);
  } else if (author_id) {
    where += ' AND s.author_id = ?';
    params.push(author_id);
  }
  if (period) {
    where += ' AND s.period = ?';
    params.push(period);
  }
  if (status) {
    where += ' AND s.status = ?';
    params.push(status);
  }
  
  const offset = (page - 1) * pageSize;
  params.push(pageSize, offset);
  
  const settlements = db.prepare(`
    SELECT s.*, u.nickname as author_name
    FROM settlements s LEFT JOIN users u ON s.author_id = u.id
    ${where}
    ORDER BY s.id DESC LIMIT ? OFFSET ?
  `).all(...params);
  
  const total = db.prepare(`SELECT COUNT(*) as count FROM settlements s ${where}`).get(...params.slice(0, -2)).count;
  
  res.json({ list: settlements, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/settlement/:id/details', authMiddleware, (req, res) => {
  const db = req.db;
  const details = db.prepare(`
    SELECT d.*, n.title as novel_title
    FROM settlement_details d LEFT JOIN novels n ON d.novel_id = n.id
    WHERE d.settlement_id = ? ORDER BY d.id DESC
  `).all(req.params.id);
  res.json(details);
});

router.post('/calculate', authMiddleware, roleMiddleware('finance', 'admin'), (req, res) => {
  const db = req.db;
  const { period, author_id } = req.body;
  
  db.prepare('BEGIN').run();
  try {
    const authors = author_id 
      ? [db.prepare('SELECT id FROM users WHERE id = ? AND role = ?').get(author_id, 'author')]
      : db.prepare("SELECT id FROM users WHERE role = 'author'").all();
    
    for (const author of authors.filter(Boolean)) {
      const novels = db.prepare('SELECT id FROM novels WHERE author_id = ?').all(author.id);
      let totalSubscribe = 0;
      let totalReward = 0;
      const details = [];
      
      for (const novel of novels) {
        const subIncome = db.prepare(`
          SELECT COALESCE(SUM(amount * 0.7), 0) as income FROM subscriptions 
          WHERE novel_id = ? AND status = 'success'
        `).get(novel.id).income;
        
        const rewardIncome = db.prepare(`
          SELECT COALESCE(SUM(amount * 0.8), 0) as income FROM rewards 
          WHERE novel_id = ?
        `).get(novel.id).income;
        
        totalSubscribe += subIncome;
        totalReward += rewardIncome;
        
        if (subIncome > 0) details.push({ novel_id: novel.id, type: 'subscribe', amount: subIncome });
        if (rewardIncome > 0) details.push({ novel_id: novel.id, type: 'reward', amount: rewardIncome });
      }
      
      const activityBonus = totalSubscribe * 0.1;
      const deduction = 0;
      const totalAmount = totalSubscribe + totalReward + activityBonus - deduction;
      
      const result = db.prepare(`
        INSERT INTO settlements (author_id, period, subscribe_income, reward_income, activity_bonus, deduction, total_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(author.id, period, totalSubscribe, totalReward, activityBonus, deduction, totalAmount);
      
      const insertDetail = db.prepare(`
        INSERT INTO settlement_details (settlement_id, type, novel_id, amount, description)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      details.forEach(d => {
        insertDetail.run(result.lastInsertRowid, d.type, d.novel_id, d.amount, 
          d.type === 'subscribe' ? '订阅分成70%' : '打赏分成80%');
      });
      
      if (activityBonus > 0) {
        insertDetail.run(result.lastInsertRowid, 'activity_bonus', null, activityBonus, '活跃奖励10%');
      }
    }
    
    db.prepare('COMMIT').run();
    res.json({ message: '结算计算完成' });
  } catch (e) {
    db.prepare('ROLLBACK').run();
    console.error(e);
    res.status(500).json({ error: '结算计算失败' });
  }
});

router.put('/settlement/:id/status', authMiddleware, roleMiddleware('finance', 'admin'), (req, res) => {
  const db = req.db;
  const { status, remark } = req.body;
  
  const settlement = db.prepare('SELECT * FROM settlements WHERE id = ?').get(req.params.id);
  if (!settlement) return res.status(404).json({ error: '结算单不存在' });
  
  if (status === 'paid') {
    db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(settlement.total_amount, settlement.author_id);
  }
  
  db.prepare('UPDATE settlements SET status = ?, remark = ? WHERE id = ?').run(status, remark, req.params.id);
  res.json({ message: '状态更新成功' });
});

router.get('/income-summary', authMiddleware, roleMiddleware('author'), (req, res) => {
  const db = req.db;
  
  const summary = db.prepare(`
    SELECT 
      COALESCE(SUM(subscribe_income), 0) as total_subscribe,
      COALESCE(SUM(reward_income), 0) as total_reward,
      COALESCE(SUM(activity_bonus), 0) as total_bonus,
      COALESCE(SUM(deduction), 0) as total_deduction,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END), 0) as paid_amount,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END), 0) as pending_amount
    FROM settlements WHERE author_id = ?
  `).get(req.user.id);
  
  res.json(summary);
});

router.get('/orders', authMiddleware, roleMiddleware('finance', 'admin'), (req, res) => {
  const db = req.db;
  const { page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  const orders = db.prepare(`
    SELECT o.*, u.nickname as user_name, n.title as novel_title, c.title as chapter_title
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.id
    LEFT JOIN novels n ON o.novel_id = n.id
    LEFT JOIN chapters c ON o.chapter_id = c.id
    ORDER BY o.id DESC LIMIT ? OFFSET ?
  `).all(pageSize, offset);
  
  const total = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  
  res.json({ list: orders, total, page: parseInt(page), pageSize: parseInt(pageSize) });
});

module.exports = router;

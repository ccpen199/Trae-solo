const express = require('express');
const db = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', authenticate, (req, res) => {
  res.json({
    user: req.user
  });
});

router.put('/profile', authenticate, (req, res) => {
  const { nickname, avatar } = req.body;
  
  const updates = [];
  const values = [];
  
  if (nickname !== undefined) {
    updates.push('nickname = ?');
    values.push(nickname);
  }
  
  if (avatar !== undefined) {
    updates.push('avatar = ?');
    values.push(avatar);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }
  
  values.push(req.user.id);
  
  db.prepare(`UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(...values);
  
  const user = db.prepare('SELECT id, phone, nickname, avatar, is_shop_owner, level, points FROM users WHERE id = ?')
    .get(req.user.id);
  
  res.json({ user });
});

router.post('/become-shop-owner', authenticate, (req, res) => {
  db.prepare('UPDATE users SET is_shop_owner = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(req.user.id);
  
  const user = db.prepare('SELECT id, phone, nickname, avatar, is_shop_owner, level, points FROM users WHERE id = ?')
    .get(req.user.id);
  
  res.json({ user, message: 'Successfully became shop owner' });
});

router.get('/search-history', authenticate, (req, res) => {
  const history = db.prepare(`
    SELECT DISTINCT keyword 
    FROM search_history 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 20
  `).all(req.user.id);
  
  res.json({ history: history.map(h => h.keyword) });
});

router.post('/search-history', authenticate, (req, res) => {
  const { keyword } = req.body;
  
  if (!keyword || keyword.trim().length === 0) {
    return res.status(400).json({ error: 'Keyword is required' });
  }
  
  db.prepare('INSERT INTO search_history (user_id, keyword) VALUES (?, ?)')
    .run(req.user.id, keyword.trim());
  
  res.json({ success: true });
});

router.delete('/search-history', authenticate, (req, res) => {
  const { keyword } = req.body;
  
  if (keyword) {
    db.prepare('DELETE FROM search_history WHERE user_id = ? AND keyword = ?')
      .run(req.user.id, keyword);
  } else {
    db.prepare('DELETE FROM search_history WHERE user_id = ?')
      .run(req.user.id);
  }
  
  res.json({ success: true });
});

module.exports = router;

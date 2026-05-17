const express = require('express');
const db = require('../database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/list', optionalAuth, (req, res) => {
  const { category, is_hot, is_new, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;

  let whereClause = 'WHERE status = 1';
  const params = [];

  if (category) {
    whereClause += ' AND category = ?';
    params.push(category);
  }
  if (is_hot) {
    whereClause += ' AND is_hot = 1';
  }
  if (is_new) {
    whereClause += ' AND is_new = 1';
  }

  const games = db.prepare(`
    SELECT * FROM game_centers
    ${whereClause}
    ORDER BY sort_order ASC, created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);

  const total = db.prepare(`SELECT COUNT(*) as count FROM game_centers ${whereClause}`).get(...params);

  res.json({
    success: true,
    data: {
      list: games,
      total: total.count
    }
  });
});

router.get('/detail/:id', (req, res) => {
  const game = db.prepare('SELECT * FROM game_centers WHERE id = ? AND status = 1').get(req.params.id);
  
  if (!game) {
    return res.status(404).json({ success: false, message: '游戏不存在' });
  }

  res.json({ success: true, data: game });
});

module.exports = router;

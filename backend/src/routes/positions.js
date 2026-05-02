const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('./auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', requireRole('investor'), async (req, res) => {
  try {
    const positions = db.prepare(`
      SELECT p.*, s.name as security_name
      FROM positions p
      LEFT JOIN securities s ON p.security_code = s.code
      WHERE p.user_id = ?
      ORDER BY p.total_quantity DESC
    `).all(req.user.id);

    res.json(positions);
  } catch (error) {
    console.error('获取持仓错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/all', requireRole('exchange_admin', 'financial_settler'), async (req, res) => {
  try {
    const { userId } = req.query;
    
    let query = `
      SELECT p.*, u.username, u.name as user_name, s.name as security_name
      FROM positions p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN securities s ON p.security_code = s.code
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      query += ' AND p.user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY p.user_id, p.security_code';

    const positions = db.prepare(query).all(...params);
    res.json(positions);
  } catch (error) {
    console.error('获取全部持仓错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/:securityCode', requireRole('investor'), async (req, res) => {
  try {
    const { securityCode } = req.params;
    
    const position = db.prepare(`
      SELECT p.*, s.name as security_name
      FROM positions p
      LEFT JOIN securities s ON p.security_code = s.code
      WHERE p.user_id = ? AND p.security_code = ?
    `).get(req.user.id, securityCode);

    if (!position) {
      return res.status(404).json({ error: '持仓不存在' });
    }

    res.json(position);
  } catch (error) {
    console.error('获取持仓详情错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;

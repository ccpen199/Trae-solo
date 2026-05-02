const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('./auth');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('risk_officer', 'exchange_admin'));

router.get('/logs', async (req, res) => {
  try {
    const { userId, startDate, endDate, checkResult, limit = 100, offset = 0 } = req.query;
    
    let query = `
      SELECT r.*, u.username, u.name as user_name
      FROM risk_check_logs r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      query += ' AND r.user_id = ?';
      params.push(userId);
    }

    if (checkResult) {
      query += ' AND r.check_result = ?';
      params.push(checkResult);
    }

    if (startDate) {
      query += ' AND r.timestamp >= ?';
      params.push(new Date(startDate).getTime());
    }

    if (endDate) {
      query += ' AND r.timestamp <= ?';
      params.push(new Date(endDate).getTime());
    }

    query += ' ORDER BY r.timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const logs = db.prepare(query).all(...params);

    const stats = db.prepare(`
      SELECT 
        check_result,
        check_type,
        COUNT(*) as count
      FROM risk_check_logs
      WHERE 1=1
      GROUP BY check_result, check_type
    `).all();

    res.json({
      logs,
      stats
    });
  } catch (error) {
    console.error('获取风控日志错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTimestamp = todayStart.getTime();

    const todayStats = db.prepare(`
      SELECT 
        check_result,
        check_type,
        COUNT(*) as count
      FROM risk_check_logs
      WHERE timestamp >= ?
      GROUP BY check_result, check_type
    `).all(todayTimestamp);

    const totalChecks = db.prepare(`
      SELECT 
        check_result,
        COUNT(*) as count
      FROM risk_check_logs
      GROUP BY check_result
    `).all();

    const failedReasons = db.prepare(`
      SELECT 
        check_message,
        COUNT(*) as count
      FROM risk_check_logs
      WHERE check_result = 'failed'
      GROUP BY check_message
      ORDER BY count DESC
      LIMIT 10
    `).all();

    res.json({
      todayStats,
      totalChecks,
      failedReasons
    });
  } catch (error) {
    console.error('获取风控统计错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/interceptions', async (req, res) => {
  try {
    const { userId, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        r.id,
        r.order_id,
        r.user_id,
        r.check_type,
        r.check_message,
        r.timestamp,
        u.username,
        u.name as user_name,
        o.security_code,
        o.direction,
        o.price,
        o.quantity
      FROM risk_check_logs r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN orders o ON r.order_id = o.id
      WHERE r.check_result = 'failed'
    `;
    const params = [];

    if (userId) {
      query += ' AND r.user_id = ?';
      params.push(userId);
    }

    query += ' ORDER BY r.timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const interceptions = db.prepare(query).all(...params);

    res.json({ interceptions });
  } catch (error) {
    console.error('获取风控拦截记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;

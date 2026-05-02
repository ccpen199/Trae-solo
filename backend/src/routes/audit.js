const express = require('express');
const { db } = require('../database');
const { authenticateToken, requireRole } = require('./auth');
const AuditLogger = require('../audit-logger');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('exchange_admin', 'risk_officer', 'financial_settler'));

router.get('/logs', async (req, res) => {
  try {
    const { 
      userId, 
      action, 
      resourceType, 
      startTime, 
      endTime, 
      status,
      limit = 100, 
      offset = 0 
    } = req.query;

    const filters = {
      userId,
      action,
      resourceType,
      startTime: startTime ? new Date(startTime).getTime() : undefined,
      endTime: endTime ? new Date(endTime).getTime() : undefined,
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const logs = AuditLogger.query(filters);

    const stats = db.prepare(`
      SELECT 
        action,
        status,
        COUNT(*) as count
      FROM audit_logs
      WHERE 1=1
      GROUP BY action, status
      ORDER BY count DESC
    `).all();

    res.json({
      logs,
      stats
    });
  } catch (error) {
    console.error('获取审计日志错误:', error);
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
        action,
        status,
        COUNT(*) as count
      FROM audit_logs
      WHERE timestamp >= ?
      GROUP BY action, status
    `).all(todayTimestamp);

    const actionsStats = db.prepare(`
      SELECT 
        action,
        COUNT(*) as count
      FROM audit_logs
      GROUP BY action
      ORDER BY count DESC
      LIMIT 20
    `).all();

    const userActivity = db.prepare(`
      SELECT 
        user_id,
        username,
        COUNT(*) as action_count,
        MAX(timestamp) as last_active
      FROM audit_logs
      WHERE user_id IS NOT NULL
      GROUP BY user_id, username
      ORDER BY action_count DESC
      LIMIT 10
    `).all();

    res.json({
      todayStats,
      actionsStats,
      userActivity
    });
  } catch (error) {
    console.error('获取审计统计错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/order-trace/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const fullPath = AuditLogger.getOrderFullPath(orderId);

    if (!fullPath) {
      return res.status(404).json({ error: '订单不存在' });
    }

    res.json(fullPath);
  } catch (error) {
    console.error('订单溯源错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

router.get('/users/:userId/activity', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    const activity = db.prepare(`
      SELECT * FROM audit_logs 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `).all(userId, parseInt(limit));

    const user = db.prepare('SELECT id, username, name, role FROM users WHERE id = ?').get(userId);

    res.json({
      user,
      activity
    });
  } catch (error) {
    console.error('获取用户活动记录错误:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;

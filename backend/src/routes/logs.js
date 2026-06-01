const express = require('express');
const db = require('../models/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/call', authenticateToken, async (req, res) => {
  try {
    const { appId, status, startDate, endDate, operationType } = req.query;
    let sql = `
      SELECT c.*, a.name as app_name
      FROM call_logs c
      LEFT JOIN applications a ON c.app_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (appId) {
      sql += ' AND c.app_id = ?';
      params.push(appId);
    }
    if (status) {
      if (status === 'success') {
        sql += ' AND c.response_status >= 200 AND c.response_status < 300';
      } else {
        sql += ' AND c.response_status >= 400';
      }
    }
    if (operationType) {
      sql += ' AND c.operation_type = ?';
      params.push(operationType);
    }
    if (startDate) {
      sql += ' AND c.created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND c.created_at <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY c.created_at DESC LIMIT 500';
    const logs = await db.all(sql, params);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/call/:id', authenticateToken, async (req, res) => {
  try {
    const log = await db.get(`
      SELECT c.*, a.name as app_name, t.task_id
      FROM call_logs c
      LEFT JOIN applications a ON c.app_id = a.id
      LEFT JOIN tasks t ON c.task_id = t.id
      WHERE c.id = ?
    `, [req.params.id]);
    
    if (!log) {
      return res.status(404).json({ error: '日志不存在' });
    }
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/audit', authenticateToken, requireRole('admin', 'security', 'ops'), async (req, res) => {
  try {
    const { userId, action, resourceType, startDate, endDate } = req.query;
    let sql = `
      SELECT a.*, u.name as user_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (userId) {
      sql += ' AND a.user_id = ?';
      params.push(userId);
    }
    if (action) {
      sql += ' AND a.action = ?';
      params.push(action);
    }
    if (resourceType) {
      sql += ' AND a.resource_type = ?';
      params.push(resourceType);
    }
    if (startDate) {
      sql += ' AND a.created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND a.created_at <= ?';
      params.push(endDate);
    }

    sql += ' ORDER BY a.created_at DESC LIMIT 500';
    const logs = await db.all(sql, params);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { appId, startDate, endDate } = req.query;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (appId) {
      whereClause += ' AND app_id = ?';
      params.push(appId);
    }
    if (startDate) {
      whereClause += ' AND created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND created_at <= ?';
      params.push(endDate);
    }

    const totalCalls = await db.get(`SELECT COUNT(*) as count FROM call_logs ${whereClause}`, params);
    const successCalls = await db.get(`SELECT COUNT(*) as count FROM call_logs ${whereClause} AND response_status >= 200 AND response_status < 300`, params);
    const totalProcessed = await db.get(`SELECT SUM(processed_count) as total FROM call_logs ${whereClause}`, params);
    const avgDuration = await db.get(`SELECT AVG(duration_ms) as avg FROM call_logs ${whereClause}`, params);

    res.json({
      totalCalls: totalCalls.count || 0,
      successCalls: successCalls.count || 0,
      successRate: totalCalls.count ? ((successCalls.count / totalCalls.count) * 100).toFixed(2) : 0,
      totalProcessed: totalProcessed.total || 0,
      avgDuration: avgDuration.avg ? Math.round(avgDuration.avg) : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

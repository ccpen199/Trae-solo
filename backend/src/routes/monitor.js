const express = require('express');
const router = express.Router();
const monitor = require('../monitoring');
const auth = require('../middleware/auth');
const db = require('../database');

router.get('/metrics', (req, res) => {
  res.json(monitor.getMetrics());
});

router.get('/detailed', auth, (req, res) => {
  if (req.userType !== 'admin') {
    return res.status(403).json({ error: '无权限访问' });
  }
  
  const { hours = 24 } = req.query;
  const stats = monitor.getDetailedStats(parseInt(hours));
  
  res.json(stats);
});

router.get('/logs', auth, (req, res) => {
  if (req.userType !== 'admin') {
    return res.status(403).json({ error: '无权限访问' });
  }
  
  const { page = 1, pageSize = 50, status, method } = req.query;
  const offset = (page - 1) * pageSize;
  
  let where = [];
  let params = [];
  
  if (status === 'error') {
    where.push('status_code >= 400');
  } else if (status === 'success') {
    where.push('status_code < 400');
  }
  if (method) {
    where.push('method = ?');
    params.push(method.toUpperCase());
  }
  
  const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
  
  const logs = db.prepare(`
    SELECT * FROM api_monitor_logs
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM api_monitor_logs ${whereSql}
  `).get(...params).count;
  
  res.json({ list: logs, total });
});

router.get('/health', (req, res) => {
  const metrics = monitor.getMetrics();
  
  const isHealthy = metrics.success_rate >= 95 && metrics.database_status === 'healthy';
  
  res.json({
    status: isHealthy ? 'healthy' : 'degraded',
    checks: {
      api: {
        status: metrics.success_rate >= 99 ? 'healthy' : metrics.success_rate >= 95 ? 'degraded' : 'unhealthy',
        successRate: metrics.success_rate
      },
      database: {
        status: metrics.database_status
      },
      performance: {
        status: metrics.average_duration_ms < 500 ? 'healthy' : metrics.average_duration_ms < 1000 ? 'degraded' : 'unhealthy',
        avgDuration: metrics.average_duration_ms
      }
    },
    metrics
  });
});

module.exports = router;

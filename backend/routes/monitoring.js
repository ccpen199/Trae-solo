const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');

router.get('/availability', (req, res) => {
  try {
    const db = getDb();
    const { service_id } = req.query;
    let data;
    if (service_id) {
      data = db.prepare('SELECT sa.*, si.name as service_name FROM service_availability sa JOIN service_items si ON sa.service_id = si.id WHERE sa.service_id = ? ORDER BY sa.check_time DESC LIMIT 50').all(service_id);
    } else {
      data = db.prepare('SELECT sa.*, si.name as service_name FROM service_availability sa JOIN service_items si ON sa.service_id = si.id ORDER BY sa.check_time DESC LIMIT 100').all();
    }

    const total = data.length;
    const available = data.filter(d => d.is_available === 1).length;
    const unavailable = total - available;
    const avgResponseTime = total > 0 ? Math.round(data.reduce((sum, d) => sum + (d.response_time || 0), 0) / total) : 0;
    const availabilityRate = total > 0 ? parseFloat(((available / total) * 100).toFixed(1)) : 0;

    res.json({
      success: true,
      data: {
        summary: { total, available, unavailable, avgResponseTime, availabilityRate },
        records: data
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/behavior', (req, res) => {
  try {
    const db = getDb();
    const topVisits = db.prepare('SELECT service_name, visit_count, apply_count, complete_count, avg_days, bottleneck_node FROM behavior_stats ORDER BY visit_count DESC LIMIT 10').all();
    const bottleneckStats = db.prepare('SELECT bottleneck_node, COUNT(*) as count, SUM(visit_count) as total_visits FROM behavior_stats WHERE bottleneck_node IS NOT NULL GROUP BY bottleneck_node ORDER BY count DESC').all();
    const overallStats = db.prepare('SELECT SUM(visit_count) as total_visits, SUM(apply_count) as total_applies, SUM(complete_count) as total_completes, AVG(avg_days) as avg_days FROM behavior_stats').get();

    res.json({
      success: true,
      data: {
        topVisits,
        bottleneckHeatmap: bottleneckStats,
        overall: {
          totalVisits: overallStats.total_visits || 0,
          totalApplies: overallStats.total_applies || 0,
          totalCompletes: overallStats.total_completes || 0,
          avgDays: overallStats.avg_days ? parseFloat(overallStats.avg_days.toFixed(1)) : 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/biz-metrics', (req, res) => {
  try {
    const db = getDb();
    const { year, month, period } = req.query;
    const conditions = [];
    const params = [];

    if (year) {
      conditions.push('year = ?');
      params.push(parseInt(year));
    }
    if (month) {
      conditions.push('month = ?');
      params.push(parseInt(month));
    }
    if (period) {
      conditions.push('period = ?');
      params.push(period);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const metrics = db.prepare(`SELECT * FROM biz_metrics ${where} ORDER BY created_at DESC`).all(...params);

    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/api-logs', (req, res) => {
  try {
    const db = getDb();
    const { page = 1, pageSize = 20, api_path, method, status_code } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const conditions = [];
    const params = [];

    if (api_path) {
      conditions.push('api_path LIKE ?');
      params.push(`%${api_path}%`);
    }
    if (method) {
      conditions.push('method = ?');
      params.push(method);
    }
    if (status_code) {
      conditions.push('status_code = ?');
      params.push(parseInt(status_code));
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const total = db.prepare(`SELECT COUNT(*) as cnt FROM monitor_logs ${where}`).get(...params).cnt;
    const logs = db.prepare(`SELECT * FROM monitor_logs ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(...params, parseInt(pageSize), offset);

    const summary = db.prepare(`SELECT method, COUNT(*) as count, AVG(response_time) as avg_time, SUM(CASE WHEN is_timeout = 1 THEN 1 ELSE 0 END) as timeout_count FROM monitor_logs ${where} GROUP BY method`).all(...params);

    res.json({
      success: true,
      data: {
        list: logs,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        summary
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/check', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const services = db.prepare('SELECT id, name FROM service_items WHERE status = ?').all('active');
    const results = [];

    services.forEach(service => {
      const isAvailable = Math.random() > 0.05 ? 1 : 0;
      const responseTime = Math.floor(Math.random() * 800 + 50);
      const id = uuidv4();
      db.prepare('INSERT INTO service_availability (id, service_id, check_time, is_available, error_msg, response_time) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, service.id, new Date().toISOString(), isAvailable, isAvailable ? null : '连接超时', responseTime);
      results.push({ service_id: service.id, service_name: service.name, is_available: isAvailable, response_time: responseTime });
    });

    res.json({ success: true, data: { checkedCount: results.length, results } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

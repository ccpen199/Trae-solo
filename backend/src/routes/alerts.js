import express from 'express';
import db from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware.js';

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { type, status, severity, page = 1, pageSize = 20 } = req.query;
  
  let query = 'SELECT * FROM alerts WHERE 1=1';
  const params = [];
  
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (severity) {
    query += ' AND severity = ?';
    params.push(severity);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
  
  const alerts = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM alerts WHERE 1=1' + 
    (type ? ' AND type = ?' : '') + 
    (status ? ' AND status = ?' : '') +
    (severity ? ' AND severity = ?' : '')
  ).get(...params.slice(0, params.length - 2));
  
  res.json({ alerts, total: total.count });
});

router.post('/check-anomaly', (req, res) => {
  const { device_id, flow_rate, duration_minutes = 10 } = req.body;
  
  const highFlowThreshold = 10;
  const maxDurationMinutes = 10;
  
  if (flow_rate >= highFlowThreshold && duration_minutes >= maxDurationMinutes) {
    const message = `设备${device_id}检测到异常用水：连续${duration_minutes}分钟流量超过${highFlowThreshold}L/min`;
    
    db.prepare(`
      INSERT INTO alerts (type, device_id, message, severity)
      VALUES (?, ?, ?, ?)
    `).run('water_anomaly', device_id, message, 'critical');
    
    return res.json({
      anomaly: true,
      message,
      severity: 'critical'
    });
  }
  
  res.json({ anomaly: false });
});

router.post('/:id/resolve', authenticateToken, requireAdmin, (req, res) => {
  const { conclusion } = req.body;
  const resolvedBy = req.user.name || req.user.username || 'admin';
  
  db.prepare(`
    UPDATE alerts SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP, resolved_by = ?
    WHERE id = ?
  `).run(resolvedBy + (conclusion ? `|${conclusion}` : ''), req.params.id);
  
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(req.params.id);
  res.json(alert);
});

router.get('/stats', authenticateToken, (req, res) => {
  const unread = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE status = 'unread'").get().count;
  const critical = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE severity = 'critical' AND status = 'unread'").get().count;
  const warning = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE severity = 'warning' AND status = 'unread'").get().count;
  const today = db.prepare("SELECT COUNT(*) as count FROM alerts WHERE DATE(created_at) = DATE('now')").get().count;
  
  const typeDistribution = db.prepare(`
    SELECT type, COUNT(*) as count 
    FROM alerts 
    GROUP BY type
  `).all();
  
  res.json({
    unread,
    critical,
    warning,
    today,
    typeDistribution
  });
});

export default router;

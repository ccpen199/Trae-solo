const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');

const router = express.Router();

router.get('/', (req, res) => {
  const { page = 1, pageSize = 10, status, alert_type } = req.query;
  const offset = (page - 1) * pageSize;
  
  let whereClause = 'WHERE 1=1';
  const params = [];
  
  if (status) {
    whereClause += ' AND a.status = ?';
    params.push(status);
  }
  
  if (alert_type) {
    whereClause += ' AND a.alert_type = ?';
    params.push(alert_type);
  }
  
  const list = db.prepare(`
    SELECT a.*, ip.name as insured_name 
    FROM abnormal_behavior_alerts a
    LEFT JOIN insured_persons ip ON a.insured_person_id = ip.id
    ${whereClause}
    ORDER BY a.detect_time DESC 
    LIMIT ? OFFSET ?
  `).all(...params, parseInt(pageSize), offset);
  
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM abnormal_behavior_alerts a
    ${whereClause}
  `).get(...params);
  
  res.json({ list, total: total.count, page: parseInt(page), pageSize: parseInt(pageSize) });
});

router.get('/statistics/summary', (req, res) => {
  const stats = db.prepare(`
    SELECT 
      status,
      COUNT(*) as count
    FROM abnormal_behavior_alerts
    GROUP BY status
  `).all();
  
  const typeStats = db.prepare(`
    SELECT 
      alert_type,
      COUNT(*) as count
    FROM abnormal_behavior_alerts
    GROUP BY alert_type
  `).all();
  
  res.json({ status_stats: stats, type_stats: typeStats });
});

router.post('/detect/frequent-purchase', (req, res) => {
  const { insured_person_id, threshold = 5, days = 30 } = req.body;
  
  const count = db.prepare(`
    SELECT COUNT(*) as count FROM settlement_records 
    WHERE insured_person_id = ? 
    AND settlement_type = '药店购药'
    AND settlement_date >= date('now', '-' || ? || ' days')
  `).get(insured_person_id, days);
  
  if (count.count >= threshold) {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO abnormal_behavior_alerts 
      (id, insured_person_id, alert_type, alert_level, description)
      VALUES (?, ?, '高频购药', '中', ?)
    `).run(id, insured_person_id, `${days}天内购药${count.count}次，超过阈值${threshold}次`);
    
    res.json({
      alert_triggered: true,
      alert_id: id,
      purchase_count: count.count,
      threshold,
      days
    });
  } else {
    res.json({
      alert_triggered: false,
      purchase_count: count.count,
      threshold,
      days
    });
  }
});

router.get('/:id', (req, res) => {
  const alert = db.prepare(`
    SELECT a.*, ip.name as insured_name, ip.id_card, ip.phone
    FROM abnormal_behavior_alerts a
    LEFT JOIN insured_persons ip ON a.insured_person_id = ip.id
    WHERE a.id = ?
  `).get(req.params.id);
  
  if (!alert) {
    return res.status(404).json({ error: '预警记录不存在' });
  }
  res.json(alert);
});

router.put('/:id/status', (req, res) => {
  const { status, handler, remarks } = req.body;
  
  db.prepare(`
    UPDATE abnormal_behavior_alerts 
    SET status = ?, handler = ?, handle_time = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, handler, req.params.id);
  
  res.json({ id: req.params.id, status, handler });
});

module.exports = router;

const express = require('express');
const db = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  const { point_id, status, page = 1, pageSize = 20 } = req.query;
  const offset = (page - 1) * pageSize;
  
  let query = `
    SELECT a.*, mp.name as point_name, mp.device_code, mp.responsible_unit
    FROM alerts a
    LEFT JOIN monitoring_points mp ON a.point_id = mp.id
    WHERE 1=1
  `;
  let countQuery = 'SELECT COUNT(*) as total FROM alerts WHERE 1=1';
  const params = [];
  const countParams = [];
  
  if (point_id) {
    query += ' AND a.point_id = ?';
    countQuery += ' AND point_id = ?';
    params.push(point_id);
    countParams.push(point_id);
  }
  
  if (status) {
    query += ' AND a.status = ?';
    countQuery += ' AND status = ?';
    params.push(status);
    countParams.push(status);
  }
  
  query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(pageSize), offset);
  
  const alerts = db.prepare(query).all(...params);
  const { total } = db.prepare(countQuery).get(...countParams);
  
  res.json({ data: alerts, total });
});

router.get('/:id', (req, res) => {
  const alert = db.prepare(`
    SELECT a.*, mp.name as point_name, mp.device_code, mp.responsible_unit
    FROM alerts a
    LEFT JOIN monitoring_points mp ON a.point_id = mp.id
    WHERE a.id = ?
  `).get(req.params.id);
  
  if (!alert) {
    return res.status(404).json({ error: '预警不存在' });
  }
  res.json(alert);
});

router.put('/:id/status', (req, res) => {
  const { status } = req.body;
  
  const result = db.prepare('UPDATE alerts SET status = ? WHERE id = ?').run(status, req.params.id);
  
  if (result.changes === 0) {
    return res.status(404).json({ error: '预警不存在' });
  }
  
  res.json({ message: '状态更新成功' });
});

module.exports = router;

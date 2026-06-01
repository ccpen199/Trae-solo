const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/track', (req, res) => {
  const { container_number, booking_number } = req.query;
  
  if (!container_number && !booking_number) {
    return res.status(400).json({ error: '请提供箱号或订舱号' });
  }
  
  let container;
  if (container_number) {
    container = db.prepare('SELECT * FROM containers WHERE container_number = ?').get(container_number);
  } else {
    container = db.prepare('SELECT * FROM containers WHERE booking_number = ?').get(booking_number);
  }
  
  if (!container) {
    return res.status(404).json({ error: '未找到相关箱号信息' });
  }
  
  const nodes = db.prepare('SELECT * FROM container_nodes WHERE container_id = ? ORDER BY node_time DESC').all(container.id);
  const exceptions = db.prepare('SELECT id, container_id, exception_type, description, status, reported_at FROM exceptions WHERE container_id = ? AND status != \'resolved\' ORDER BY created_at DESC').all(container.id);
  
  res.json({
    container: {
      id: container.id,
      container_number: container.container_number,
      booking_number: container.booking_number,
      container_type: container.container_type,
      origin_port: container.origin_port,
      destination_port: container.destination_port,
      status: container.status
    },
    nodes,
    exceptions
  });
});

router.get('/containers', (req, res) => {
  const { shipper, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  let query = 'SELECT id, container_number, booking_number, container_type, origin_port, destination_port, status, created_at FROM containers WHERE 1=1';
  const params = [];
  
  if (shipper) {
    query += ' AND shipper = ?';
    params.push(shipper);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));
  
  const containers = db.prepare(query).all(...params);
  
  const countQuery = 'SELECT COUNT(*) as total FROM containers WHERE 1=1' + (shipper ? ' AND shipper = ?' : '');
  const countParams = shipper ? [shipper] : [];
  const { total } = db.prepare(countQuery).get(...countParams);
  
  res.json({ data: containers, total, page: parseInt(page), limit: parseInt(limit) });
});

module.exports = router;

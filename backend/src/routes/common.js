const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/stores', (req, res) => {
  const stores = db.prepare('SELECT * FROM stores ORDER BY name').all();
  res.json({ success: true, data: stores });
});

router.get('/providers', (req, res) => {
  const providers = db.prepare('SELECT * FROM service_providers ORDER BY name').all();
  res.json({ success: true, data: providers });
});

router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM warranty_products WHERE status = ?').all('active');
  res.json({ success: true, data: categories.map(c => c.category) });
});

router.get('/users', (req, res) => {
  const { phone } = req.query;
  let sql = 'SELECT * FROM users';
  const params = [];
  if (phone) {
    sql += ' WHERE phone LIKE ?';
    params.push('%' + phone + '%');
  }
  sql += ' ORDER BY created_at DESC LIMIT 50';
  const users = db.prepare(sql).all(...params);
  res.json({ success: true, data: users });
});

router.get('/service-orders', (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT so.*, sp.name as provider_name, c.claim_no, c.fault_type,
           p.policy_no, p.device_serial, u.name as user_name, u.phone
    FROM service_orders so
    LEFT JOIN service_providers sp ON so.provider_id = sp.id
    LEFT JOIN claims c ON so.claim_id = c.id
    LEFT JOIN policies p ON c.policy_id = p.id
    LEFT JOIN users u ON p.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND so.status = ?';
    params.push(status);
  }
  sql += ' ORDER BY so.created_at DESC';
  
  const orders = db.prepare(sql).all(...params);
  res.json({ success: true, data: orders });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/stats', (req, res) => {
  try {
    const totalDrivers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'driver'").get().count;
    const totalTechnicians = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'technician'").get().count;
    const totalSuppliers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'supplier'").get().count;
    const totalAdmins = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count;
    const totalRescueRequests = db.prepare('SELECT COUNT(*) as count FROM rescue_requests').get().count;
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM parts_orders').get().count;
    const totalCourses = db.prepare('SELECT COUNT(*) as count FROM courses').get().count;
    res.json({
      users_by_role: { driver: totalDrivers, technician: totalTechnicians, supplier: totalSuppliers, admin: totalAdmins },
      total_rescue_requests: totalRescueRequests,
      total_orders: totalOrders,
      total_courses: totalCourses
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/credit-scores', (req, res) => {
  try {
    const technicians = db.prepare(
      'SELECT t.*, u.name, u.phone FROM technicians t JOIN users u ON t.user_id = u.id ORDER BY t.credit_score DESC'
    ).all();
    res.json(technicians);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/credit-scores/:technician_id', (req, res) => {
  try {
    const { action, score_change, description } = req.body;
    const technician_id = req.params.technician_id;
    db.prepare(
      'INSERT INTO credit_history (technician_id, action, score_change, description) VALUES (?,?,?,?)'
    ).run(technician_id, action, score_change, description);
    db.prepare('UPDATE technicians SET credit_score = credit_score + ? WHERE id = ?').run(score_change, technician_id);
    res.status(201).json({ technician_id: Number(technician_id), action, score_change });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/heatmap', (req, res) => {
  try {
    const entries = db.prepare('SELECT * FROM rescue_heatmap ORDER BY request_count DESC').all();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/heatmap', (req, res) => {
  try {
    const { region_code, region_name, lat, lng, request_count, avg_response_minutes, period } = req.body;
    const existing = db.prepare('SELECT id FROM rescue_heatmap WHERE region_code = ? AND period = ?').get(region_code, period || 'monthly');
    if (existing) {
      db.prepare(
        'UPDATE rescue_heatmap SET region_name = ?, lat = ?, lng = ?, request_count = ?, avg_response_minutes = ? WHERE id = ?'
      ).run(region_name, lat, lng, request_count, avg_response_minutes, existing.id);
      res.json({ id: existing.id, updated: true });
    } else {
      const result = db.prepare(
        'INSERT INTO rescue_heatmap (region_code, region_name, lat, lng, request_count, avg_response_minutes, period) VALUES (?,?,?,?,?,?,?)'
      ).run(region_code, region_name, lat, lng, request_count, avg_response_minutes, period || 'monthly');
      res.status(201).json({ id: result.lastInsertRowid });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard', (req, res) => {
  try {
    const usersByRole = db.prepare('SELECT role, COUNT(*) as count FROM users GROUP BY role').all();
    const totalRescue = db.prepare('SELECT COUNT(*) as count FROM rescue_requests').get().count;
    const rescueByStatus = db.prepare('SELECT status, COUNT(*) as count FROM rescue_requests GROUP BY status').all();
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM parts_orders').get().count;
    const ordersByStatus = db.prepare('SELECT status, COUNT(*) as count FROM parts_orders GROUP BY status').all();
    const totalCourses = db.prepare('SELECT COUNT(*) as count FROM courses').get().count;
    const totalEnrollments = db.prepare('SELECT COUNT(*) as count FROM enrollments').get().count;
    const avgCreditScore = db.prepare('SELECT AVG(credit_score) as avg FROM technicians').get().avg;
    const topHeatmap = db.prepare(
      'SELECT region_name, request_count, avg_response_minutes FROM rescue_heatmap ORDER BY request_count DESC LIMIT 10'
    ).all();
    res.json({
      users_by_role: usersByRole,
      rescue: { total: totalRescue, by_status: rescueByStatus },
      orders: { total: totalOrders, by_status: ordersByStatus },
      courses: { total: totalCourses, total_enrollments: totalEnrollments },
      avg_credit_score: avgCreditScore,
      top_heatmap: topHeatmap
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

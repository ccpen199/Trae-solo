const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/stats', (req, res) => {
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  const pendingOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = ?').get('pending').count;
  const dispatchedOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = ?').get('dispatched').count;
  const completedOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE status = ?').get('completed').count;
  const availableDrivers = db.prepare('SELECT COUNT(*) as count FROM drivers WHERE status = ?').get('available').count;
  const availableVehicles = db.prepare('SELECT COUNT(*) as count FROM vehicles WHERE status = ?').get('available').count;
  const pendingFees = db.prepare('SELECT COUNT(*) as count FROM fees WHERE status = ?').get('pending').count;
  const openExceptions = db.prepare('SELECT COUNT(*) as count FROM exceptions WHERE status = ?').get('open').count;
  
  res.json({
    totalOrders,
    pendingOrders,
    dispatchedOrders,
    completedOrders,
    availableDrivers,
    availableVehicles,
    pendingFees,
    openExceptions
  });
});

router.get('/dispatch-board', (req, res) => {
  const pendingOrders = db.prepare(`
    SELECT o.*, c.name as customer_name
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    WHERE o.status IN ('pending')
    ORDER BY o.cut_off_time ASC
  `).all();
  
  const activeOrders = db.prepare(`
    SELECT o.*, c.name as customer_name, d.name as driver_name, v.plate_number
    FROM orders o
    LEFT JOIN customers c ON o.customer_id = c.id
    LEFT JOIN drivers d ON o.driver_id = d.id
    LEFT JOIN vehicles v ON o.vehicle_id = v.id
    WHERE o.status IN ('dispatched', 'in_port')
    ORDER BY o.cut_off_time ASC
  `).all();
  
  const availableResources = db.prepare(`
    SELECT d.id as driver_id, d.name as driver_name, d.qualifications,
           v.id as vehicle_id, v.plate_number, v.vehicle_type, v.capacity
    FROM drivers d
    LEFT JOIN vehicles v ON d.id = v.driver_id
    WHERE d.status = 'available' AND v.status = 'available'
  `).all();
  
  res.json({
    pendingOrders,
    activeOrders,
    availableResources
  });
});

router.get('/timeline', (req, res) => {
  const timelines = db.prepare(`
    SELECT ot.*, o.order_no
    FROM order_timelines ot
    LEFT JOIN orders o ON ot.order_id = o.id
    ORDER BY ot.timestamp DESC
    LIMIT 50
  `).all();
  res.json(timelines);
});

module.exports = router;

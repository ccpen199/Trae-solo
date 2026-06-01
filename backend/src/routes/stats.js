const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const orderStats = db.prepare(`
    SELECT 
      COUNT(*) as total_orders,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
      SUM(CASE WHEN status = 'picking' THEN 1 ELSE 0 END) as picking_orders,
      SUM(CASE WHEN status = 'out_for_delivery' THEN 1 ELSE 0 END) as delivering_orders,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
      SUM(CASE WHEN status = 'delivery_failed' THEN 1 ELSE 0 END) as failed_orders,
      SUM(total_amount) as total_revenue
    FROM orders
  `).get();
  
  const inventoryStats = db.prepare(`
    SELECT 
      COUNT(*) as total_items,
      SUM(quantity) as total_quantity,
      SUM(CASE WHEN quality_level != 'normal' THEN 1 ELSE 0 END) as abnormal_items,
      SUM(CASE WHEN expiry_date < DATE('now') THEN 1 ELSE 0 END) as expired_items
    FROM inventory
  `).get();
  
  const today = new Date().toISOString().split('T')[0];
  const todayStats = db.prepare(`
    SELECT 
      COUNT(*) as today_orders,
      SUM(total_amount) as today_revenue
    FROM orders
    WHERE DATE(created_at) = ?
  `).get(today);
  
  res.json({
    orders: orderStats,
    inventory: inventoryStats,
    today: todayStats
  });
});

module.exports = router;

const express = require('express');
const db = require('../database');
const router = express.Router();

router.get('/', (req, res) => {
  const { status, order_id, vehicle_id } = req.query;
  let sql = `
    SELECT i.*, o.order_no, v.plate_number, v.brand, v.model
    FROM inspections i
    LEFT JOIN orders o ON i.order_id = o.id
    LEFT JOIN vehicles v ON i.vehicle_id = v.id
    WHERE 1=1
  `;
  const params = [];
  if (status) {
    sql += ' AND i.status = ?';
    params.push(status);
  }
  if (order_id) {
    sql += ' AND i.order_id = ?';
    params.push(order_id);
  }
  if (vehicle_id) {
    sql += ' AND i.vehicle_id = ?';
    params.push(vehicle_id);
  }
  sql += ' ORDER BY i.id DESC';
  const inspections = db.prepare(sql).all(...params);
  res.json(inspections);
});

router.get('/:id', (req, res) => {
  const inspection = db.prepare(`
    SELECT i.*, o.order_no, o.status as order_status, o.total_amount, o.damage_fee,
           v.plate_number, v.brand, v.model, v.status as vehicle_status
    FROM inspections i
    LEFT JOIN orders o ON i.order_id = o.id
    LEFT JOIN vehicles v ON i.vehicle_id = v.id
    WHERE i.id = ?
  `).get(req.params.id);
  if (!inspection) return res.status(404).json({ error: '验收记录不存在' });
  res.json(inspection);
});

router.post('/', (req, res) => {
  const { order_id } = req.body;
  
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(order.vehicle_id);
  
  const today = new Date().toISOString().split('T')[0];
  const isMaintenanceOverdue = (vehicle.mileage - vehicle.last_maintenance_km) >= vehicle.maintenance_cycle_km;
  const isCrossCityReturn = order.pickup_store_id !== order.return_store_id;
  const hasViolations = db.prepare('SELECT COUNT(*) as count FROM violations WHERE order_id = ? AND status = "pending"').get(order_id).count > 0;
  const hasDamageFee = order.damage_fee > 0;
  
  const result = db.prepare(`
    INSERT INTO inspections (
      order_id, vehicle_id, check_duplicate_dispatch, check_cross_city_return,
      check_violations, check_damage_fee, check_maintenance_overdue,
      vehicle_status_match, status
    ) VALUES (?, ?, 0, ?, 0, ?, 0, 0, 'pending')
  `).run(order_id, order.vehicle_id, isCrossCityReturn ? 1 : 0, hasDamageFee ? 1 : 0);
  
  res.json({ 
    id: result.lastInsertRowid,
    order_id,
    vehicle_id: order.vehicle_id,
    is_cross_city_return: isCrossCityReturn,
    has_violations: hasViolations,
    has_damage_fee: hasDamageFee,
    is_maintenance_overdue: isMaintenanceOverdue,
    vehicle_status: vehicle.status
  });
});

router.put('/:id/complete', (req, res) => {
  const {
    check_duplicate_dispatch, check_cross_city_return, check_violations,
    check_damage_fee, check_maintenance_overdue, vehicle_status_match, notes
  } = req.body;
  
  db.prepare(`
    UPDATE inspections SET 
      check_duplicate_dispatch = ?, check_cross_city_return = ?,
      check_violations = ?, check_damage_fee = ?, check_maintenance_overdue = ?,
      vehicle_status_match = ?, notes = ?, status = 'completed'
    WHERE id = ?
  `).run(
    check_duplicate_dispatch ? 1 : 0,
    check_cross_city_return ? 1 : 0,
    check_violations ? 1 : 0,
    check_damage_fee ? 1 : 0,
    check_maintenance_overdue ? 1 : 0,
    vehicle_status_match ? 1 : 0,
    notes || '',
    req.params.id
  );
  
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM inspections WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;

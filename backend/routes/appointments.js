const express = require('express');
const db = require('../config/db');
const { authenticateToken, requireRole, requireOwnerOrAdmin, requireStoreOrAdmin } = require('../middleware/auth');
const { validateAppointment, checkServiceCapacity, checkBoardingCapacity, calculateBoardingFee, generateOrderNo } = require('../utils/validation');

const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  const { status, owner_id, store_id, pet_id, start_date, end_date } = req.query;
  let sql = 'SELECT a.*, p.name as pet_name, p.species as pet_species, s.name as service_name, s.category as service_category, u.name as owner_name, u2.name as staff_name FROM appointments a LEFT JOIN pets p ON a.pet_id = p.id LEFT JOIN services s ON a.service_id = s.id LEFT JOIN users u ON a.owner_id = u.id LEFT JOIN users u2 ON a.staff_id = u2.id WHERE 1=1';
  const params = [];
  
  if (req.user.role === 'owner') {
    sql += ' AND a.owner_id = ?';
    params.push(req.user.id);
  } else if (req.user.role === 'store' || req.user.role === 'staff') {
    sql += ' AND a.store_id = ?';
    params.push(req.user.role === 'store' ? req.user.id : req.user.store_id);
  } else if (req.user.role === 'driver') {
    sql += ' AND EXISTS (SELECT 1 FROM transport_tasks tt WHERE tt.appointment_id = a.id AND tt.driver_id = ?)';
    params.push(req.user.id);
  }
  
  if (status) {
    sql += ' AND a.status = ?';
    params.push(status);
  }
  if (owner_id) {
    sql += ' AND a.owner_id = ?';
    params.push(owner_id);
  }
  if (store_id) {
    sql += ' AND a.store_id = ?';
    params.push(store_id);
  }
  if (pet_id) {
    sql += ' AND a.pet_id = ?';
    params.push(pet_id);
  }
  if (start_date) {
    sql += ' AND a.appointment_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND a.appointment_date <= ?';
    params.push(end_date);
  }
  
  sql += ' ORDER BY a.appointment_date DESC, a.created_at DESC';
  const appointments = db.prepare(sql).all(...params);
  
  res.json(appointments);
});

router.get('/:id', authenticateToken, (req, res) => {
  const apt = db.prepare(`
    SELECT a.*, p.*, s.name as service_name, s.category as service_category, s.base_price, 
           u.name as owner_name, u.phone as owner_phone, u2.name as staff_name, u3.name as store_name
    FROM appointments a 
    LEFT JOIN pets p ON a.pet_id = p.id 
    LEFT JOIN services s ON a.service_id = s.id 
    LEFT JOIN users u ON a.owner_id = u.id 
    LEFT JOIN users u2 ON a.staff_id = u2.id
    LEFT JOIN users u3 ON a.store_id = u3.id
    WHERE a.id = ?
  `).get(req.params.id);
  
  if (!apt) {
    return res.status(404).json({ error: '预约不存在' });
  }
  
  if (req.user.role === 'owner' && apt.owner_id !== req.user.id) {
    return res.status(403).json({ error: '无权限访问此预约' });
  }
  
  const vaccines = db.prepare('SELECT * FROM vaccines WHERE pet_id = ? ORDER BY expire_date DESC').all(apt.pet_id);
  const transportTasks = db.prepare('SELECT * FROM transport_tasks WHERE appointment_id = ?').all(req.params.id);
  const serviceRecords = db.prepare('SELECT * FROM service_records WHERE appointment_id = ?').all(req.params.id);
  const servicePhotos = db.prepare('SELECT * FROM service_photos WHERE appointment_id = ? ORDER BY created_at DESC').all(req.params.id);
  const feeOrder = db.prepare('SELECT * FROM fee_orders WHERE appointment_id = ?').get(req.params.id);
  const boardingStay = db.prepare('SELECT bs.*, br.room_no, br.room_type FROM boarding_stays bs LEFT JOIN boarding_rooms br ON bs.room_id = br.id WHERE bs.appointment_id = ?').get(req.params.id);
  const review = db.prepare('SELECT * FROM reviews WHERE appointment_id = ?').get(req.params.id);
  
  res.json({
    appointment: apt,
    vaccines,
    transportTasks,
    serviceRecords,
    servicePhotos,
    feeOrder,
    boardingStay,
    review
  });
});

router.post('/validate', authenticateToken, (req, res) => {
  const { pet_id, service_id, slot_id } = req.body;
  
  if (!pet_id || !service_id) {
    return res.status(400).json({ error: '宠物ID和服务ID不能为空' });
  }
  
  const validation = validateAppointment(pet_id, service_id, slot_id);
  res.json(validation);
});

router.post('/', authenticateToken, requireRole('owner', 'admin', 'customer_service'), (req, res) => {
  const ownerId = req.user.role === 'owner' ? req.user.id : req.body.owner_id;
  const { pet_id, service_id, slot_id, store_id, appointment_date, start_time, end_time, pickup_address, delivery_address, need_pickup, need_delivery, special_requirements, check_in_date, check_out_date, room_id, feeding_requirements, medication_requirements } = req.body;
  
  if (!pet_id || !service_id || !store_id || !appointment_date) {
    return res.status(400).json({ error: '宠物ID、服务ID、门店ID和预约日期不能为空' });
  }
  
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(service_id);
  if (!service) {
    return res.status(404).json({ error: '服务不存在' });
  }
  
  const validation = validateAppointment(pet_id, service_id, slot_id);
  if (!validation.valid) {
    return res.status(400).json({ 
      error: '预约校验失败', 
      validation,
      errors: validation.errors
    });
  }
  
  if (service.category === 'boarding') {
    const capacity = checkBoardingCapacity(store_id, check_in_date, check_out_date);
    if (!capacity.valid) {
      return res.status(400).json({ error: capacity.message });
    }
  }
  
  const tx = db.transaction(() => {
    const orderNo = generateOrderNo('AP');
    
    const info = db.prepare(`
      INSERT INTO appointments (order_no, owner_id, pet_id, service_id, slot_id, store_id, appointment_date, start_time, end_time, pickup_address, delivery_address, need_pickup, need_delivery, special_requirements, status, vaccine_checked, vaccine_valid, size_checked, aggression_checked, capacity_checked)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)
    `).run(orderNo, ownerId, pet_id, service_id, slot_id, store_id, appointment_date, start_time, end_time, pickup_address, delivery_address, need_pickup ? 1 : 0, need_delivery ? 1 : 0, special_requirements, validation.vaccineCheck.valid ? 1 : 0, validation.vaccineCheck.valid ? 1 : 0, validation.sizeCheck.valid ? 1 : 0, validation.aggressionCheck.valid ? 1 : 0, validation.capacityCheck.valid ? 1 : 0);
    
    const appointmentId = info.lastInsertRowid;
    
    if (slot_id) {
      db.prepare('UPDATE service_slots SET current_booked = current_booked + 1 WHERE id = ?').run(slot_id);
    }
    
    if (need_pickup) {
      const taskNo = generateOrderNo('TT');
      db.prepare(`
        INSERT INTO transport_tasks (task_no, appointment_id, task_type, pet_id, owner_id, from_address, to_address, scheduled_time, status)
        VALUES (?, ?, 'pickup', ?, ?, ?, ?, ?, 'pending')
      `).run(taskNo, appointmentId, pet_id, ownerId, pickup_address, service.store_id ? '' : '', appointment_date + ' ' + (start_time || '09:00'));
    }
    
    if (need_delivery) {
      const taskNo = generateOrderNo('TT');
      db.prepare(`
        INSERT INTO transport_tasks (task_no, appointment_id, task_type, pet_id, owner_id, from_address, to_address, scheduled_time, status)
        VALUES (?, ?, 'delivery', ?, ?, ?, ?, ?, 'pending')
      `).run(taskNo, appointmentId, pet_id, ownerId, service.store_id ? '' : '', delivery_address, appointment_date + ' ' + (end_time || '18:00'));
    }
    
    if (service.category === 'boarding' && check_in_date && check_out_date && room_id) {
      const room = db.prepare('SELECT * FROM boarding_rooms WHERE id = ?').get(room_id);
      const feeCalc = calculateBoardingFee(room.daily_rate, check_in_date, check_out_date);
      
      db.prepare(`
        INSERT INTO boarding_stays (appointment_id, room_id, check_in_date, check_out_date, feeding_requirements, medication_requirements, daily_rate, total_days, total_amount, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      `).run(appointmentId, room_id, check_in_date, check_out_date, feeding_requirements, medication_requirements, room.daily_rate, feeCalc.totalDays, feeCalc.totalAmount);
      
      db.prepare("UPDATE boarding_rooms SET status = 'occupied' WHERE id = ?").run(room_id);
      
      const feeNo = generateOrderNo('FEE');
      const transportFee = (need_pickup ? 30 : 0) + (need_delivery ? 30 : 0);
      const totalAmount = feeCalc.totalAmount + transportFee;
      
      db.prepare(`
        INSERT INTO fee_orders (order_no, appointment_id, owner_id, store_id, service_fee, transport_fee, total_amount, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'unpaid')
      `).run(feeNo, appointmentId, ownerId, store_id, feeCalc.totalAmount, transportFee, totalAmount);
    } else {
      const feeNo = generateOrderNo('FEE');
      const transportFee = (need_pickup ? 30 : 0) + (need_delivery ? 30 : 0);
      const totalAmount = service.base_price + transportFee;
      
      db.prepare(`
        INSERT INTO fee_orders (order_no, appointment_id, owner_id, store_id, service_fee, transport_fee, total_amount, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'unpaid')
      `).run(feeNo, appointmentId, ownerId, store_id, service.base_price, transportFee, totalAmount);
    }
    
    return appointmentId;
  });
  
  try {
    const appointmentId = tx();
    const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(appointmentId);
    res.status(201).json({ success: true, data: { appointment, validation } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '创建预约失败: ' + err.message });
  }
});

router.put('/:id/confirm', authenticateToken, requireRole('store', 'admin', 'staff'), (req, res) => {
  const apt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!apt) {
    return res.status(404).json({ error: '预约不存在' });
  }
  
  if (apt.status !== 'pending') {
    return res.status(400).json({ error: '只能确认待处理的预约' });
  }
  
  const { staff_id } = req.body;
  
  db.prepare(`
    UPDATE appointments SET status = 'confirmed', staff_id = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(staff_id || apt.staff_id, req.params.id);
  
  const service = db.prepare('SELECT category FROM services WHERE id = ?').get(apt.service_id);
  if (service.category === 'boarding') {
    db.prepare("UPDATE boarding_stays SET status = 'confirmed' WHERE appointment_id = ?").run(req.params.id);
  }
  
  const updated = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
});

router.put('/:id/cancel', authenticateToken, (req, res) => {
  const apt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!apt) {
    return res.status(404).json({ error: '预约不存在' });
  }
  
  if (req.user.role === 'owner' && apt.owner_id !== req.user.id) {
    return res.status(403).json({ error: '无权限取消此预约' });
  }
  
  if (apt.status === 'completed' || apt.status === 'cancelled') {
    return res.status(400).json({ error: '此预约无法取消' });
  }
  
  const { cancel_reason } = req.body;
  
  const tx = db.transaction(() => {
    if (apt.slot_id) {
      db.prepare('UPDATE service_slots SET current_booked = current_booked - 1 WHERE id = ?').run(apt.slot_id);
    }
    
    db.prepare(`
      UPDATE appointments SET status = 'cancelled', cancel_reason = ?, cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(cancel_reason || '用户取消', req.params.id);
    
    db.prepare("UPDATE boarding_stays SET status = 'cancelled' WHERE appointment_id = ?").run(req.params.id);
    
    const stay = db.prepare('SELECT room_id FROM boarding_stays WHERE appointment_id = ?').get(req.params.id);
    if (stay) {
      db.prepare("UPDATE boarding_rooms SET status = 'available' WHERE id = ?").run(stay.room_id);
    }
    
    db.prepare("UPDATE transport_tasks SET status = 'cancelled' WHERE appointment_id = ?").run(req.params.id);
  });
  
  try {
    tx();
    const updated = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
    res.json({ appointment: updated });
  } catch (err) {
    res.status(500).json({ error: '取消预约失败: ' + err.message });
  }
});

router.put('/:id/checkin', authenticateToken, requireRole('store', 'staff', 'admin'), (req, res) => {
  const apt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!apt) {
    return res.status(404).json({ error: '预约不存在' });
  }
  
  db.prepare(`
    UPDATE appointments SET status = 'in_service', check_in_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(req.params.id);
  
  db.prepare(`
    INSERT INTO service_records (appointment_id, staff_id, service_start_time, status)
    VALUES (?, ?, CURRENT_TIMESTAMP, 'in_progress')
  `).run(req.params.id, apt.staff_id || req.user.id);
  
  const updated = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
});

router.put('/:id/checkout', authenticateToken, requireRole('store', 'staff', 'admin'), (req, res) => {
  const apt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!apt) {
    return res.status(404).json({ error: '预约不存在' });
  }
  
  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE appointments SET status = 'completed', check_out_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);
    
    db.prepare(`
      UPDATE service_records SET service_end_time = CURRENT_TIMESTAMP, status = 'completed',
      actual_duration = CAST((julianday(CURRENT_TIMESTAMP) - julianday(service_start_time)) * 24 * 60 AS INTEGER)
      WHERE appointment_id = ? AND status = 'in_progress'
    `).run(req.params.id);
    
    const service = db.prepare('SELECT category FROM services WHERE id = ?').get(apt.service_id);
    if (service.category === 'boarding') {
      db.prepare(`
        UPDATE boarding_stays SET actual_check_out = DATE(CURRENT_TIMESTAMP), status = 'completed'
        WHERE appointment_id = ?
      `).run(req.params.id);
      
      const stay = db.prepare('SELECT * FROM boarding_stays WHERE appointment_id = ?').get(req.params.id);
      if (stay) {
        db.prepare("UPDATE boarding_rooms SET status = 'available' WHERE id = ?").run(stay.room_id);
        
        const checkIn = new Date(stay.check_in_date);
        const actualCheckOut = new Date();
        const originalCheckOut = new Date(stay.check_out_date);
        const extendedDays = Math.max(0, Math.ceil((actualCheckOut - originalCheckOut) / (1000 * 60 * 60 * 24)));
        
        if (extendedDays > 0) {
          const extraFee = extendedDays * stay.daily_rate;
          db.prepare(`
            UPDATE fee_orders SET extra_fee = extra_fee + ?, total_amount = total_amount + ?, extra_fee_reason = '寄养延住' || extendedDays || '天'
            WHERE appointment_id = ?
          `).run(extraFee, extraFee, req.params.id);
          
          db.prepare(`
            UPDATE boarding_stays SET extended_days = ?, total_days = total_days + ?, total_amount = total_amount + ?
            WHERE appointment_id = ?
          `).run(extendedDays, extendedDays, extraFee, req.params.id);
        }
      }
    }
  });
  
  try {
    tx();
    const updated = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
    res.json({ appointment: updated });
  } catch (err) {
    res.status(500).json({ error: '完成服务失败: ' + err.message });
  }
});

module.exports = router;

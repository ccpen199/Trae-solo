const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

const TIME_SLOTS = [
  '09:00-09:30', '09:30-10:00', '10:00-10:30', '10:30-11:00', '11:00-11:30',
  '14:00-14:30', '14:30-15:00', '15:00-15:30', '15:30-16:00', '16:00-16:30'
];

const MAX_PER_SLOT = 5;

router.get('/branches', (req, res) => {
  const { district } = req.query;
  
  let where = ['status = ?'];
  let params = ['active'];
  
  if (district) {
    where.push('district = ?');
    params.push(district);
  }
  
  const branches = db.prepare(`
    SELECT * FROM service_branches 
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY name
  `).all(...params);
  
  res.json(branches);
});

router.get('/branches/:id', (req, res) => {
  const branch = db.prepare('SELECT * FROM service_branches WHERE id = ?').get(req.params.id);
  
  if (!branch) {
    return res.status(404).json({ error: '网点不存在' });
  }
  
  res.json(branch);
});

router.get('/availability/:branchId', (req, res) => {
  const { branchId } = req.params;
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({ error: '请选择日期' });
  }
  
  const branch = db.prepare('SELECT * FROM service_branches WHERE id = ?').get(branchId);
  if (!branch) {
    return res.status(404).json({ error: '网点不存在' });
  }
  
  const reservations = db.prepare(`
    SELECT time_slot, COUNT(*) as count
    FROM reservations
    WHERE branch_id = ? AND reservation_date = ? AND status IN ('reserved', 'checked_in')
    GROUP BY time_slot
  `).all(branchId, date);
  
  const slotMap = {};
  reservations.forEach(r => {
    slotMap[r.time_slot] = r.count;
  });
  
  const availability = TIME_SLOTS.map(slot => {
    const booked = slotMap[slot] || 0;
    const remaining = Math.max(0, MAX_PER_SLOT - booked);
    return {
      timeSlot: slot,
      booked,
      remaining,
      available: remaining > 0,
      percentage: (booked / MAX_PER_SLOT * 100).toFixed(0)
    };
  });
  
  const seatMatrix = generateSeatMatrix(branch.total_windows || 5, reservations);
  
  res.json({
    date,
    branch,
    slots: availability,
    seatMatrix,
    maxPerSlot: MAX_PER_SLOT,
    totalWindows: branch.total_windows || 5
  });
});

function generateSeatMatrix(totalWindows, reservations) {
  const matrix = {};
  TIME_SLOTS.forEach(slot => {
    matrix[slot] = [];
    for (let w = 1; w <= totalWindows; w++) {
      const windowReservations = reservations.filter(
        r => r.time_slot === slot && r.window_no === w
      );
      matrix[slot].push({
        window: w,
        occupied: windowReservations.length >= 1,
        reservationId: windowReservations[0]?.id || null
      });
    }
  });
  return matrix;
}

router.post('/', auth, (req, res) => {
  const { branchId, serviceItemId, date, timeSlot } = req.body;
  
  if (!branchId || !date || !timeSlot) {
    return res.status(400).json({ error: '参数不完整' });
  }
  
  const branch = db.prepare('SELECT * FROM service_branches WHERE id = ?').get(branchId);
  if (!branch) {
    return res.status(404).json({ error: '网点不存在' });
  }
  
  if (!TIME_SLOTS.includes(timeSlot)) {
    return res.status(400).json({ error: '无效的时段' });
  }
  
  const existing = db.prepare(`
    SELECT id FROM reservations 
    WHERE user_id = ? AND reservation_date = ? AND status IN ('reserved', 'checked_in')
  `).get(req.userId, date);
  
  if (existing) {
    return res.status(400).json({ error: '该日期已有预约' });
  }
  
  const slotCount = db.prepare(`
    SELECT COUNT(*) as count FROM reservations
    WHERE branch_id = ? AND reservation_date = ? AND time_slot = ? AND status IN ('reserved', 'checked_in')
  `).get(branchId, date, timeSlot).count;
  
  if (slotCount >= MAX_PER_SLOT) {
    return res.status(400).json({ error: '该时段已满，请选择其他时段' });
  }
  
  const windowReservations = db.prepare(`
    SELECT window_no FROM reservations
    WHERE branch_id = ? AND reservation_date = ? AND time_slot = ? AND status IN ('reserved', 'checked_in')
  `).all(branchId, date, timeSlot);
  
  const occupiedWindows = windowReservations.map(r => r.window_no);
  let windowNo = 1;
  for (let w = 1; w <= (branch.total_windows || 5); w++) {
    if (!occupiedWindows.includes(w)) {
      windowNo = w;
      break;
    }
  }
  
  const reservationNo = 'R' + Date.now();
  const queueNumber = String.fromCharCode(65 + Math.floor(Math.random() * 3)) + String(Math.floor(Math.random() * 900 + 100));
  
  try {
    const result = db.prepare(`
      INSERT INTO reservations (reservation_no, user_id, service_item_id, branch_id, reservation_date, time_slot, window_no, queue_number, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(reservationNo, req.userId, serviceItemId || null, branchId, date, timeSlot, windowNo, queueNumber, 'reserved');
    
    res.json({
      id: result.lastInsertRowid,
      reservationNo,
      queueNumber,
      windowNo,
      message: '预约成功'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '预约失败' });
  }
});

router.get('/my', auth, (req, res) => {
  const { status } = req.query;
  
  let where = ['user_id = ?'];
  let params = [req.userId];
  
  if (status) {
    where.push('status = ?');
    params.push(status);
  }
  
  const reservations = db.prepare(`
    SELECT r.*, b.name as branch_name, b.address as branch_address,
           si.name as service_name, si.item_code as service_code
    FROM reservations r
    JOIN service_branches b ON r.branch_id = b.id
    LEFT JOIN service_items si ON r.service_item_id = si.id
    WHERE ${where.join(' AND ')}
    ORDER BY r.reservation_date DESC, r.time_slot ASC
  `).all(...params);
  
  res.json(reservations);
});

router.get('/:id', auth, (req, res) => {
  const reservation = db.prepare(`
    SELECT r.*, b.name as branch_name, b.address as branch_address, b.phone as branch_phone,
           si.name as service_name, si.item_code as service_code, si.handling_time
    FROM reservations r
    JOIN service_branches b ON r.branch_id = b.id
    LEFT JOIN service_items si ON r.service_item_id = si.id
    WHERE r.id = ? AND r.user_id = ?
  `).get(req.params.id, req.userId);
  
  if (!reservation) {
    return res.status(404).json({ error: '预约不存在' });
  }
  
  res.json(reservation);
});

router.put('/:id/cancel', auth, (req, res) => {
  const result = db.prepare(`
    UPDATE reservations 
    SET status = 'cancelled'
    WHERE id = ? AND user_id = ? AND status = 'reserved'
  `).run(req.params.id, req.userId);
  
  if (result.changes === 0) {
    return res.status(400).json({ error: '无法取消该预约' });
  }
  
  res.json({ message: '预约已取消' });
});

router.put('/:id/checkin', auth, (req, res) => {
  const result = db.prepare(`
    UPDATE reservations 
    SET status = 'checked_in', checkin_time = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ? AND status = 'reserved'
  `).run(req.params.id, req.userId);
  
  if (result.changes === 0) {
    return res.status(400).json({ error: '无法签到' });
  }
  
  res.json({ message: '签到成功' });
});

router.get('/queue/:branchId', (req, res) => {
  const { branchId } = req.params;
  
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  const waiting = db.prepare(`
    SELECT COUNT(*) as count FROM reservations
    WHERE branch_id = ? AND reservation_date = ? AND status = 'checked_in'
  `).get(branchId, today).count;
  
  const current = db.prepare(`
    SELECT * FROM reservations
    WHERE branch_id = ? AND reservation_date = ? AND status = 'processing'
    ORDER BY checkin_time ASC
    LIMIT 1
  `).get(branchId, today);
  
  const avgWaitTime = waiting * 15;
  
  res.json({
    branchId,
    waitingCount: waiting,
    currentNumber: current?.queue_number || '--',
    avgWaitTime,
    lastUpdated: new Date().toISOString()
  });
});

module.exports = router;

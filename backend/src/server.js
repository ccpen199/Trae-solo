require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { db, initDatabase } = require('./database');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

initDatabase();

const app = express();
const PORT = process.env.BACKEND_PORT || 58861;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48861}`,
  credentials: true
}));

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/enterprises', (req, res) => {
  const enterprises = db.prepare('SELECT * FROM enterprises ORDER BY name').all();
  res.json(enterprises);
});

app.get('/api/parking-lots', (req, res) => {
  const lots = db.prepare('SELECT * FROM parking_lots').all();
  res.json(lots);
});

app.get('/api/operators', (req, res) => {
  const operators = db.prepare('SELECT id, username, name, role, created_at FROM operators').all();
  res.json(operators);
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const operator = db.prepare('SELECT id, username, name, role FROM operators WHERE username = ? AND password = ?').get(username, password);
  if (operator) {
    res.json({ success: true, operator });
  } else {
    res.status(401).json({ success: false, message: '用户名或密码错误' });
  }
});

app.post('/api/appointments', (req, res) => {
  const {
    visitorName, visitorPhone, visitorIdCard, licensePlate,
    enterpriseId, enterpriseName, contactPerson, contactPhone,
    visitReason, scheduledArrival, scheduledDeparture
  } = req.body;

  const appointmentNo = 'APT' + Date.now().toString().slice(-8);
  const qrCode = 'QR' + Date.now() + Math.random().toString(36).slice(-6);

  let visitor = db.prepare('SELECT * FROM visitors WHERE id_card = ?').get(visitorIdCard);
  
  if (!visitor) {
    const insertVisitor = db.prepare('INSERT INTO visitors (id_card, name, phone) VALUES (?, ?, ?)');
    const result = insertVisitor.run(visitorIdCard, visitorName, visitorPhone);
    visitor = { id: result.lastInsertRowid };
  }

  const isBlacklisted = visitor && visitor.is_blacklisted === 1;
  const isHighRisk = visitor && visitor.risk_level === 'high';
  const needsReview = isBlacklisted || isHighRisk;

  const insertAppointment = db.prepare(`
    INSERT INTO appointments (
      appointment_no, visitor_id, visitor_name, visitor_phone, visitor_id_card,
      license_plate, enterprise_id, enterprise_name, contact_person, contact_phone,
      visit_reason, scheduled_arrival, scheduled_departure, status, review_status, qr_code
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insertAppointment.run(
    appointmentNo, visitor.id, visitorName, visitorPhone, visitorIdCard,
    licensePlate, enterpriseId, enterpriseName, contactPerson, contactPhone,
    visitReason, scheduledArrival, scheduledDeparture,
    'pending',
    needsReview ? 'pending_review' : 'auto_passed',
    qrCode
  );

  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(result.lastInsertRowid);
  
  db.prepare('INSERT INTO access_logs (appointment_id, action, details) VALUES (?, ?, ?)')
    .run(appointment.id, 'create_appointment', JSON.stringify(req.body));

  res.json({ success: true, appointment, needsReview });
});

app.get('/api/appointments', (req, res) => {
  const { status, reviewStatus, date, search } = req.query;
  let sql = 'SELECT * FROM appointments WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (reviewStatus) {
    sql += ' AND review_status = ?';
    params.push(reviewStatus);
  }
  if (date) {
    sql += ' AND DATE(scheduled_arrival) = ?';
    params.push(date);
  }
  if (search) {
    sql += ' AND (visitor_name LIKE ? OR license_plate LIKE ? OR appointment_no LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  sql += ' ORDER BY created_at DESC LIMIT 100';
  
  const appointments = db.prepare(sql).all(...params);
  res.json(appointments);
});

app.get('/api/appointments/:id', (req, res) => {
  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (appointment) {
    res.json(appointment);
  } else {
    res.status(404).json({ error: '预约不存在' });
  }
});

app.get('/api/appointments/qr/:qrCode', (req, res) => {
  const appointment = db.prepare('SELECT * FROM appointments WHERE qr_code = ?').get(req.params.qrCode);
  if (appointment) {
    res.json(appointment);
  } else {
    res.status(404).json({ error: '二维码无效' });
  }
});

app.post('/api/appointments/:id/cancel', (req, res) => {
  const appointmentId = req.params.id;
  const { reason, operatorId } = req.body;
  
  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(appointmentId);
  if (!appointment) {
    return res.status(404).json({ success: false, error: '预约不存在' });
  }
  
  if (appointment.status === 'checked_in' || appointment.status === 'checked_out') {
    return res.status(400).json({ success: false, error: '已入园的预约无法取消' });
  }

  db.prepare(`
    UPDATE appointments 
    SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(appointmentId);

  db.prepare('INSERT INTO access_logs (appointment_id, action, details) VALUES (?, ?, ?)')
    .run(appointmentId, 'cancel', reason || '');

  res.json({ success: true, appointment: db.prepare('SELECT * FROM appointments WHERE id = ?').get(appointmentId) });
});

app.post('/api/appointments/:id/review', (req, res) => {
  const { status, comment, reviewerId } = req.body;
  const appointmentId = req.params.id;

  db.prepare(`
    UPDATE appointments 
    SET review_status = ?, review_comment = ?, reviewer_id = ?, review_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, comment, reviewerId, appointmentId);

  db.prepare('INSERT INTO access_logs (appointment_id, action, details) VALUES (?, ?, ?)')
    .run(appointmentId, 'review', JSON.stringify(req.body));

  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(appointmentId);
  res.json({ success: true, appointment });
});

app.post('/api/checkin', (req, res) => {
  const { appointmentId, method, gateNo, operatorId, idCard, qrCode, licensePlate } = req.body;

  let appointment;
  if (appointmentId) {
    appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(appointmentId);
  } else if (qrCode) {
    appointment = db.prepare('SELECT * FROM appointments WHERE qr_code = ?').get(qrCode);
  } else if (idCard) {
    appointment = db.prepare('SELECT * FROM appointments WHERE visitor_id_card = ? AND status IN (?, ?) ORDER BY scheduled_arrival DESC LIMIT 1')
      .get(idCard, 'pending', 'approved');
  } else if (licensePlate) {
    appointment = db.prepare('SELECT * FROM appointments WHERE license_plate = ? AND status IN (?, ?) ORDER BY scheduled_arrival DESC LIMIT 1')
      .get(licensePlate, 'pending', 'approved');
  }

  if (!appointment) {
    return res.status(404).json({ success: false, error: '未找到有效预约', errorCode: 'NO_APPOINTMENT' });
  }

  const now = new Date();
  const scheduledArrival = new Date(appointment.scheduled_arrival);
  const hoursDiff = (now - scheduledArrival) / (1000 * 60 * 60);

  if (hoursDiff > 24) {
    return res.status(400).json({ success: false, error: '预约已过期', errorCode: 'EXPIRED', appointment });
  }

  if (appointment.review_status === 'pending_review') {
    return res.status(400).json({ success: false, error: '预约待审核', errorCode: 'PENDING_REVIEW', appointment });
  }

  if (appointment.review_status === 'rejected') {
    return res.status(400).json({ success: false, error: '预约已被拒绝', errorCode: 'REJECTED', appointment });
  }

  if (idCard && appointment.visitor_id_card !== idCard) {
    return res.status(400).json({ success: false, error: '证件信息不匹配', errorCode: 'ID_MISMATCH', appointment });
  }

  if (licensePlate && appointment.license_plate !== licensePlate) {
    return res.status(400).json({ success: false, error: '车牌信息不匹配', errorCode: 'PLATE_MISMATCH', appointment });
  }

  if (appointment.status === 'checked_in') {
    return res.status(400).json({ success: false, error: '已入园', errorCode: 'ALREADY_CHECKED_IN', appointment });
  }

  db.prepare(`
    UPDATE appointments 
    SET status = 'checked_in', updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(appointment.id);

  db.prepare(`
    INSERT INTO checkins (appointment_id, checkin_method, gate_no, operator_id)
    VALUES (?, ?, ?, ?)
  `).run(appointment.id, method, gateNo, operatorId);

  db.prepare('INSERT INTO access_logs (appointment_id, action, details) VALUES (?, ?, ?)')
    .run(appointment.id, 'checkin', `method:${method}, gate:${gateNo}`);

  res.json({ success: true, appointment: db.prepare('SELECT * FROM appointments WHERE id = ?').get(appointment.id) });
});

app.post('/api/parking/entry', (req, res) => {
  const { licensePlate, parkingLotId, spaceNo, appointmentId } = req.body;

  let foundAppointmentId = appointmentId;
  if (!foundAppointmentId && licensePlate) {
    const apt = db.prepare(`
      SELECT id FROM appointments 
      WHERE license_plate = ? AND status = 'checked_in'
      ORDER BY scheduled_arrival DESC LIMIT 1
    `).get(licensePlate);
    if (apt) foundAppointmentId = apt.id;
  }

  const existingRecord = db.prepare(`
    SELECT * FROM parking_records 
    WHERE license_plate = ? AND exit_time IS NULL
  `).get(licensePlate);

  if (existingRecord) {
    return res.status(400).json({ success: false, error: '车辆已在场内', record: existingRecord });
  }

  const result = db.prepare(`
    INSERT INTO parking_records (appointment_id, license_plate, parking_lot_id, space_no, entry_time)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(foundAppointmentId, licensePlate, parkingLotId, spaceNo);

  if (parkingLotId) {
    db.prepare('UPDATE parking_lots SET available_spaces = available_spaces - 1 WHERE id = ?').run(parkingLotId);
  }

  const record = db.prepare('SELECT * FROM parking_records WHERE id = ?').get(result.lastInsertRowid);
  res.json({ success: true, record });
});

app.post('/api/parking/exit', (req, res) => {
  const { licensePlate, discountAmount, discountReason, discountApproverId } = req.body;

  const record = db.prepare(`
    SELECT * FROM parking_records 
    WHERE license_plate = ? AND exit_time IS NULL
  `).get(licensePlate);

  if (!record) {
    return res.status(404).json({ success: false, error: '未找到停车记录' });
  }

  const entryTime = new Date(record.entry_time);
  const exitTime = new Date();
  const durationMinutes = Math.ceil((exitTime - entryTime) / (1000 * 60));
  const durationHours = Math.ceil(durationMinutes / 60);

  const lot = record.parking_lot_id 
    ? db.prepare('SELECT * FROM parking_lots WHERE id = ?').get(record.parking_lot_id)
    : { hourly_rate: 5.0, daily_max: 50.0 };

  let parkingFee = Math.min(durationHours * lot.hourly_rate, lot.daily_max);
  const finalDiscount = discountAmount || 0;
  const finalFee = Math.max(0, parkingFee - finalDiscount);

  db.prepare(`
    UPDATE parking_records 
    SET exit_time = CURRENT_TIMESTAMP,
        parking_duration = ?,
        parking_fee = ?,
        discount_amount = ?,
        discount_reason = ?,
        discount_status = ?,
        discount_approver_id = ?,
        payment_status = ?
    WHERE id = ?
  `).run(
    durationMinutes,
    parkingFee,
    finalDiscount,
    discountReason,
    discountAmount > 0 ? 'approved' : 'none',
    discountApproverId,
    'paid',
    record.id
  );

  if (record.parking_lot_id) {
    db.prepare('UPDATE parking_lots SET available_spaces = available_spaces + 1 WHERE id = ?').run(record.parking_lot_id);
  }

  db.prepare('INSERT INTO access_logs (appointment_id, action, details) VALUES (?, ?, ?)')
    .run(record.appointment_id, 'parking_exit', `plate:${licensePlate}, fee:${finalFee}`);

  const updatedRecord = db.prepare('SELECT * FROM parking_records WHERE id = ?').get(record.id);
  res.json({ success: true, record: updatedRecord, finalFee });
});

app.get('/api/parking/records', (req, res) => {
  const { licensePlate, active } = req.query;
  let sql = 'SELECT * FROM parking_records WHERE 1=1';
  const params = [];

  if (licensePlate) {
    sql += ' AND license_plate LIKE ?';
    params.push(`%${licensePlate}%`);
  }
  if (active === 'true') {
    sql += ' AND exit_time IS NULL';
  }

  sql += ' ORDER BY entry_time DESC LIMIT 100';
  
  const records = db.prepare(sql).all(...params);
  res.json(records);
});

app.post('/api/checkout', (req, res) => {
  const { appointmentId, visitorConfirmation, contactConfirmation, anomalies, remarks, operatorId } = req.body;

  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(appointmentId);
  if (!appointment) {
    return res.status(404).json({ success: false, error: '预约不存在' });
  }

  if (appointment.status === 'checked_out') {
    return res.status(400).json({ success: false, error: '已离园' });
  }

  const checkin = db.prepare('SELECT * FROM checkins WHERE appointment_id = ? ORDER BY checkin_time LIMIT 1').get(appointmentId);
  const checkinTime = checkin ? new Date(checkin.checkin_time) : new Date(appointment.scheduled_arrival);
  const checkoutTime = new Date();
  const stayDuration = Math.ceil((checkoutTime - checkinTime) / (1000 * 60));

  db.prepare(`
    UPDATE appointments 
    SET status = 'checked_out', updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(appointmentId);

  db.prepare(`
    INSERT INTO checkouts (
      appointment_id, stay_duration, visitor_confirmation, 
      contact_confirmation, anomalies, remarks, operator_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    appointmentId, stayDuration,
    visitorConfirmation ? 1 : 0,
    contactConfirmation ? 1 : 0,
    anomalies, remarks, operatorId
  );

  db.prepare('INSERT INTO access_logs (appointment_id, action, details) VALUES (?, ?, ?)')
    .run(appointmentId, 'checkout', `duration:${stayDuration}min`);

  res.json({ 
    success: true, 
    checkout: db.prepare('SELECT * FROM checkouts WHERE id = last_insert_rowid()').get(),
    appointment: db.prepare('SELECT * FROM appointments WHERE id = ?').get(appointmentId)
  });
});

app.get('/api/dashboard/stats', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  const stats = {
    todayAppointments: db.prepare('SELECT COUNT(*) as count FROM appointments WHERE DATE(scheduled_arrival) = ?').get(today).count,
    pendingReview: db.prepare("SELECT COUNT(*) as count FROM appointments WHERE review_status = 'pending_review'").get().count,
    currentlyInPark: db.prepare('SELECT COUNT(*) as count FROM parking_records WHERE exit_time IS NULL').get().count,
    checkedInToday: db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'checked_in' AND DATE(updated_at) = ?").get(today).count,
    checkedOutToday: db.prepare("SELECT COUNT(*) as count FROM appointments WHERE status = 'checked_out' AND DATE(updated_at) = ?").get(today).count,
    blacklistedVisitors: db.prepare('SELECT COUNT(*) as count FROM visitors WHERE is_blacklisted = 1').get().count
  };

  res.json(stats);
});

app.get('/api/visitors', (req, res) => {
  const { search, blacklisted } = req.query;
  let sql = 'SELECT * FROM visitors WHERE 1=1';
  const params = [];

  if (search) {
    sql += ' AND (name LIKE ? OR id_card LIKE ? OR phone LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }
  if (blacklisted === 'true') {
    sql += ' AND is_blacklisted = 1';
  }

  sql += ' ORDER BY updated_at DESC LIMIT 100';
  
  const visitors = db.prepare(sql).all(...params);
  res.json(visitors);
});

app.post('/api/visitors/:id/blacklist', (req, res) => {
  const { blacklisted, reason } = req.body;
  if (blacklisted) {
    db.prepare(`
      UPDATE visitors 
      SET is_blacklisted = 1, blacklist_reason = ?, risk_level = 'high', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(reason, req.params.id);
  } else {
    db.prepare(`
      UPDATE visitors 
      SET is_blacklisted = 0, blacklist_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(reason, req.params.id);
  }
  
  const visitor = db.prepare('SELECT * FROM visitors WHERE id = ?').get(req.params.id);
  res.json({ success: true, visitor });
});

app.post('/api/visitors/:id/risk', (req, res) => {
  const { riskLevel, reason } = req.body;
  db.prepare(`
    UPDATE visitors 
    SET risk_level = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(riskLevel, req.params.id);
  
  const visitor = db.prepare('SELECT * FROM visitors WHERE id = ?').get(req.params.id);
  res.json({ success: true, visitor });
});

app.get('/api/access-logs', (req, res) => {
  const logs = db.prepare(`
    SELECT al.*, a.visitor_name, a.appointment_no
    FROM access_logs al
    LEFT JOIN appointments a ON al.appointment_id = a.id
    ORDER BY al.action_time DESC LIMIT 200
  `).all();
  res.json(logs);
});

app.get('/api/alerts', (req, res) => {
  const alerts = [];
  
  const overdueVisitors = db.prepare(`
    SELECT a.*, c.checkin_time
    FROM appointments a
    JOIN checkins c ON a.id = c.appointment_id
    WHERE a.status = 'checked_in'
    AND a.scheduled_departure < CURRENT_TIMESTAMP
    AND c.checkin_time < DATETIME(CURRENT_TIMESTAMP, '-12 hours')
  `).all();

  overdueVisitors.forEach(apt => {
    alerts.push({
      type: 'overdue',
      level: 'warning',
      message: `访客 ${apt.visitor_name} (${apt.appointment_no}) 超时未离场`,
      appointmentId: apt.id,
      createdAt: apt.scheduled_departure
    });
  });

  res.json(alerts);
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务运行在 http://127.0.0.1:${PORT}`);
});

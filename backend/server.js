require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database/db');

const app = express();
const PORT = process.env.BACKEND_PORT || 58799;

app.use(cors({
  origin: `http://127.0.0.1:48799`,
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '抵押物管理系统后端运行正常' });
});

app.get('/api/vehicles', (req, res) => {
  const vehicles = db.prepare('SELECT * FROM vehicles ORDER BY created_at DESC').all();
  res.json({ success: true, data: vehicles });
});

app.get('/api/vehicles/:id', (req, res) => {
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  if (!vehicle) {
    return res.status(404).json({ success: false, message: '车辆不存在' });
  }
  const valuations = db.prepare('SELECT * FROM valuations WHERE vehicle_id = ? ORDER BY created_at DESC').all(req.params.id);
  const loans = db.prepare('SELECT * FROM loans WHERE vehicle_id = ? ORDER BY created_at DESC').all(req.params.id);
  const mortgage = db.prepare('SELECT * FROM mortgage_registrations WHERE vehicle_id = ? ORDER BY created_at DESC LIMIT 1').get(req.params.id);
  const gps = db.prepare('SELECT * FROM gps_devices WHERE vehicle_id = ? ORDER BY created_at DESC LIMIT 1').get(req.params.id);
  res.json({ success: true, data: { vehicle, valuations, loans, mortgage, gps } });
});

app.post('/api/vehicles', (req, res) => {
  const { vin, plate_number, brand, model, year, color, mileage } = req.body;
  if (!vin) {
    return res.status(400).json({ success: false, message: 'VIN码不能为空' });
  }
  try {
    const result = db.prepare(`
      INSERT INTO vehicles (vin, plate_number, brand, model, year, color, mileage)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(vin, plate_number, brand, model, year, color, mileage);
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ success: false, message: 'VIN码已存在' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/vehicles/:id/docs', (req, res) => {
  const { photos, ownership_docs, insurance_docs, mortgage_docs } = req.body;
  db.prepare(`
    UPDATE vehicles 
    SET photos = ?, ownership_docs = ?, insurance_docs = ?, mortgage_docs = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(photos, ownership_docs, insurance_docs, mortgage_docs, req.params.id);
  res.json({ success: true, message: '资料更新成功' });
});

app.get('/api/valuations', (req, res) => {
  const { status, vehicle_id } = req.query;
  let sql = 'SELECT v.*, veh.vin, veh.plate_number FROM valuations v LEFT JOIN vehicles veh ON v.vehicle_id = veh.id';
  const params = [];
  if (status) {
    sql += ' WHERE v.status = ?';
    params.push(status);
  }
  if (vehicle_id) {
    sql += status ? ' AND' : ' WHERE';
    sql += ' v.vehicle_id = ?';
    params.push(vehicle_id);
  }
  sql += ' ORDER BY v.created_at DESC';
  const valuations = db.prepare(sql).all(...params);
  res.json({ success: true, data: valuations });
});

app.post('/api/valuations', (req, res) => {
  const { vehicle_id, valuator_name, valuation_value, notes } = req.body;
  const result = db.prepare(`
    INSERT INTO valuations (vehicle_id, valuator_name, valuation_value, notes)
    VALUES (?, ?, ?, ?)
  `).run(vehicle_id, valuator_name, valuation_value, notes);
  
  const avgValuation = db.prepare('SELECT AVG(valuation_value) as avg FROM valuations WHERE vehicle_id = ?').get(vehicle_id);
  let is_anomaly = 0;
  if (avgValuation.avg) {
    const diff = Math.abs(valuation_value - avgValuation.avg) / avgValuation.avg;
    if (diff > 0.3) {
      is_anomaly = 1;
      const description = '估值异常: 当前' + valuation_value + ', 历史平均' + avgValuation.avg.toFixed(2) + ', 差异' + (diff*100).toFixed(2) + '%';
      db.prepare('INSERT INTO risk_alerts (type, vehicle_id, level, description) VALUES (?, ?, ?, ?)')
        .run('valuation_anomaly', vehicle_id, 'high', description);
    }
  }
  db.prepare('UPDATE valuations SET is_anomaly = ? WHERE id = ?').run(is_anomaly, result.lastInsertRowid);
  db.prepare('UPDATE vehicles SET current_valuation = ?, status = ? WHERE id = ?').run(valuation_value, 'valuated', vehicle_id);
  res.json({ success: true, data: { id: result.lastInsertRowid, is_anomaly } });
});

app.put('/api/valuations/:id/review', (req, res) => {
  const { reviewer_name, review_notes, status, difference_explanation } = req.body;
  db.prepare(`
    UPDATE valuations 
    SET reviewer_name = ?, review_notes = ?, status = ?, difference_explanation = ?, review_date = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(reviewer_name, review_notes, status, difference_explanation, req.params.id);
  res.json({ success: true, message: '复核完成' });
});

app.get('/api/loans', (req, res) => {
  const loans = db.prepare(`
    SELECT l.*, v.vin, v.plate_number, v.current_valuation 
    FROM loans l 
    LEFT JOIN vehicles v ON l.vehicle_id = v.id 
    ORDER BY l.created_at DESC
  `).all();
  res.json({ success: true, data: loans });
});

app.post('/api/loans', (req, res) => {
  const { vehicle_id, contract_number, borrower_name, borrower_id_card, borrower_phone, loan_amount, loan_term, interest_rate } = req.body;
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
  
  const missingDocs = [];
  if (!vehicle.photos) missingDocs.push('车况照片');
  if (!vehicle.ownership_docs) missingDocs.push('权属资料');
  if (!vehicle.insurance_docs) missingDocs.push('保险资料');
  if (!vehicle.mortgage_docs) missingDocs.push('抵押登记材料');
  
  if (missingDocs.length > 0) {
    return res.status(400).json({ success: false, message: '资料不完整，缺少: ' + missingDocs.join(', ') });
  }
  
  try {
    const result = db.prepare(`
      INSERT INTO loans (vehicle_id, loan_contract_no, borrower_name, borrower_id_card, borrower_phone, loan_amount, loan_term, interest_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(vehicle_id, contract_number, borrower_name, borrower_id_card, borrower_phone, loan_amount, loan_term, interest_rate);
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ success: false, message: '合同编号已存在' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/loans/:id/disburse', (req, res) => {
  const mortgage = db.prepare('SELECT * FROM mortgage_registrations WHERE loan_id = ? AND status = ?').get(req.params.id, 'completed');
  if (!mortgage) {
    return res.status(400).json({ success: false, message: '抵押登记未完成，不能放款' });
  }
  db.prepare('UPDATE loans SET status = ?, disbursement_date = CURRENT_TIMESTAMP WHERE id = ?').run('disbursed', req.params.id);
  db.prepare('UPDATE vehicles SET status = ? WHERE id = (SELECT vehicle_id FROM loans WHERE id = ?)').run('mortgaged', req.params.id);
  res.json({ success: true, message: '放款成功' });
});

app.get('/api/mortgages', (req, res) => {
  const mortgages = db.prepare(`
    SELECT m.*, l.loan_contract_no as contract_number, v.vin, v.plate_number 
    FROM mortgage_registrations m 
    LEFT JOIN loans l ON m.loan_id = l.id 
    LEFT JOIN vehicles v ON m.vehicle_id = v.id 
    ORDER BY m.created_at DESC
  `).all();
  res.json({ success: true, data: mortgages });
});

app.post('/api/mortgages', (req, res) => {
  const { loan_id, vehicle_id, registration_number, handler_name, attachments } = req.body;
  
  const existing = db.prepare('SELECT * FROM mortgage_registrations WHERE loan_id = ? AND status != ?').get(loan_id, 'released');
  if (existing) {
    return res.status(400).json({ success: false, message: '该贷款已有有效抵押登记' });
  }
  
  const result = db.prepare(`
    INSERT INTO mortgage_registrations (loan_id, vehicle_id, registration_number, handler_name, handle_date, status, attachments)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 'completed', ?)
  `).run(loan_id, vehicle_id, registration_number, handler_name, attachments);
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

app.put('/api/mortgages/:id/release', (req, res) => {
  const { release_handler } = req.body;
  const mortgage = db.prepare('SELECT * FROM mortgage_registrations WHERE id = ?').get(req.params.id);
  if (!mortgage || mortgage.status === 'released') {
    return res.status(400).json({ success: false, message: '抵押登记不存在或已解押' });
  }
  db.prepare(`
    UPDATE mortgage_registrations 
    SET status = ?, release_date = CURRENT_TIMESTAMP, release_handler = ?
    WHERE id = ?
  `).run('released', release_handler, req.params.id);
  db.prepare('UPDATE vehicles SET status = ? WHERE id = ?').run('released', mortgage.vehicle_id);
  res.json({ success: true, message: '解押成功' });
});

app.get('/api/gps/devices', (req, res) => {
  const devices = db.prepare(`
    SELECT g.*, v.vin, v.plate_number, l.borrower_name, l.status as loan_status
    FROM gps_devices g 
    LEFT JOIN vehicles v ON g.vehicle_id = v.id 
    LEFT JOIN loans l ON g.vehicle_id = l.vehicle_id 
    ORDER BY g.created_at DESC
  `).all();
  res.json({ success: true, data: devices });
});

app.post('/api/gps/devices', (req, res) => {
  const { vehicle_id, device_number, install_location } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO gps_devices (vehicle_id, device_number, install_date, install_location, status)
      VALUES (?, ?, CURRENT_TIMESTAMP, ?, 'installed')
    `).run(vehicle_id, device_number, install_location);
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ success: false, message: '设备编号已存在' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/gps/events', (req, res) => {
  const events = db.prepare(`
    SELECT e.*, d.device_number, v.vin, v.plate_number, l.borrower_name
    FROM gps_events e 
    LEFT JOIN gps_devices d ON e.device_id = d.id 
    LEFT JOIN vehicles v ON d.vehicle_id = v.id 
    LEFT JOIN loans l ON v.id = l.vehicle_id 
    ORDER BY e.created_at DESC
  `).all();
  res.json({ success: true, data: events });
});

app.post('/api/gps/events', (req, res) => {
  const { device_id, event_type, lat, lng, description, is_alert } = req.body;
  const result = db.prepare(`
    INSERT INTO gps_events (device_id, event_type, lat, lng, description, is_alert)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(device_id, event_type, lat, lng, description, is_alert);
  
  if (is_alert) {
    const device = db.prepare('SELECT * FROM gps_devices WHERE id = ?').get(device_id);
    if (device) {
      db.prepare('INSERT INTO risk_alerts (type, vehicle_id, gps_event_id, level, description) VALUES (?, ?, ?, ?, ?)')
        .run('gps_alert', device.vehicle_id, result.lastInsertRowid, 'high', 'GPS告警: ' + description);
    }
  }
  
  if (['offline', 'dismantle', 'cross_border'].includes(event_type)) {
    db.prepare('UPDATE gps_devices SET status = ? WHERE id = ?').run(event_type, device_id);
  }
  
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

app.get('/api/repayments', (req, res) => {
  const repayments = db.prepare(`
    SELECT r.*, l.loan_contract_no as contract_number, v.vin, v.plate_number, l.borrower_name
    FROM repayment_records r 
    LEFT JOIN loans l ON r.loan_id = l.id 
    LEFT JOIN vehicles v ON l.vehicle_id = v.id 
    ORDER BY r.due_date DESC
  `).all();
  res.json({ success: true, data: repayments });
});

app.post('/api/repayments/:id/pay', (req, res) => {
  const { paid_amount } = req.body;
  const repayment = db.prepare('SELECT * FROM repayment_records WHERE id = ?').get(req.params.id);
  const newPaid = (repayment.paid_amount || 0) + paid_amount;
  const status = newPaid >= repayment.amount ? 'paid' : 'partial';
  db.prepare('UPDATE repayment_records SET paid_amount = ?, paid_date = CURRENT_TIMESTAMP, status = ? WHERE id = ?')
    .run(newPaid, status, req.params.id);
  res.json({ success: true, message: '还款记录已更新' });
});

app.get('/api/risks', (req, res) => {
  const risks = db.prepare(`
    SELECT r.*, v.vin, v.plate_number, l.contract_number, l.borrower_name
    FROM risk_alerts r 
    LEFT JOIN vehicles v ON r.vehicle_id = v.id 
    LEFT JOIN loans l ON r.loan_id = l.id 
    ORDER BY r.created_at DESC
  `).all();
  res.json({ success: true, data: risks });
});

app.put('/api/risks/:id/handle', (req, res) => {
  const { handler } = req.body;
  db.prepare(`
    UPDATE risk_alerts 
    SET status = ?, handler = ?, handled_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run('handled', handler, req.params.id);
  res.json({ success: true, message: '风险已处理' });
});

app.get('/api/dashboard/stats', (req, res) => {
  const totalVehicles = db.prepare('SELECT COUNT(*) as count FROM vehicles').get();
  const mortgagedVehicles = db.prepare('SELECT COUNT(*) as count FROM vehicles WHERE status = ?').get('mortgaged');
  const totalLoans = db.prepare('SELECT COUNT(*) as count FROM loans').get();
  const disbursedLoans = db.prepare('SELECT COUNT(*) as count FROM loans WHERE status = ?').get('disbursed');
  const pendingRisks = db.prepare('SELECT COUNT(*) as count FROM risk_alerts WHERE status = ?').get('pending');
  const gpsAlerts = db.prepare('SELECT COUNT(*) as count FROM gps_events WHERE is_alert = 1 AND handled = 0').get();
  
  res.json({
    success: true,
    data: {
      totalVehicles: totalVehicles.count,
      mortgagedVehicles: mortgagedVehicles.count,
      totalLoans: totalLoans.count,
      disbursedLoans: disbursedLoans.count,
      pendingRisks: pendingRisks.count,
      gpsAlerts: gpsAlerts.count
    }
  });
});

app.get('/api/disposals', (req, res) => {
  const disposals = db.prepare(`
    SELECT d.*, v.vin, v.plate_number, l.loan_contract_no as contract_number, l.borrower_name
    FROM disposal_actions d 
    LEFT JOIN vehicles v ON d.vehicle_id = v.id 
    LEFT JOIN loans l ON d.loan_id = l.id 
    ORDER BY d.created_at DESC
  `).all();
  res.json({ success: true, data: disposals });
});

app.post('/api/disposals', (req, res) => {
  const { vehicle_id, loan_id, action_type, handler, result, notes } = req.body;
  const resultAction = db.prepare(`
    INSERT INTO disposal_actions (vehicle_id, loan_id, action_type, handler, result, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(vehicle_id, loan_id, action_type, handler, result, notes);
  res.json({ success: true, data: { id: resultAction.lastInsertRowid } });
});

app.get('/api/collections', (req, res) => {
  const collections = db.prepare(`
    SELECT c.*, v.vin, v.plate_number, l.loan_contract_no as contract_number, l.borrower_name
    FROM collection_records c 
    LEFT JOIN vehicles v ON c.vehicle_id = v.id 
    LEFT JOIN loans l ON c.loan_id = l.id 
    ORDER BY c.created_at DESC
  `).all();
  res.json({ success: true, data: collections });
});

app.post('/api/collections', (req, res) => {
  const { loan_id, vehicle_id, collector, contact_result, notes } = req.body;
  const result = db.prepare(`
    INSERT INTO collection_records (loan_id, vehicle_id, collector, contact_result, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(loan_id, vehicle_id, collector, contact_result, notes);
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务器运行在 http://127.0.0.1:${PORT}`);
});

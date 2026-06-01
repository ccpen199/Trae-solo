require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const net = require('net');

const app = express();
const PORT = parseInt(process.env.SERVER_PORT || 3000);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const { getDb } = require('./database');
const db = getDb();

const logOperation = (userName, action, module, targetId, details, ip) => {
  const stmt = db.prepare(`
    INSERT INTO operation_logs (user_name, action, module, target_id, details, ip)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(userName, action, module, targetId, JSON.stringify(details), ip);
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/users', (req, res) => {
  const { role, village } = req.query;
  let sql = 'SELECT * FROM users WHERE 1=1';
  const params = [];
  if (role) {
    sql += ' AND role = ?';
    params.push(role);
  }
  if (village) {
    sql += ' AND village = ?';
    params.push(village);
  }
  const users = db.prepare(sql).all(...params);
  res.json({ success: true, data: users });
});

app.get('/api/users/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' });
  }
  res.json({ success: true, data: user });
});

app.get('/api/parcels', (req, res) => {
  const { village, is_transferable, owner_id, keyword } = req.query;
  let sql = 'SELECT p.*, u.name as owner_contact FROM parcels p LEFT JOIN users u ON p.owner_id = u.id WHERE 1=1';
  const params = [];
  
  if (village) {
    sql += ' AND p.village = ?';
    params.push(village);
  }
  if (is_transferable !== undefined) {
    sql += ' AND p.is_transferable = ?';
    params.push(is_transferable);
  }
  if (owner_id) {
    sql += ' AND p.owner_id = ?';
    params.push(owner_id);
  }
  if (keyword) {
    sql += ' AND (p.parcel_no LIKE ? OR p.location LIKE ? OR p.owner_name LIKE ?)';
    const kw = `%${keyword}%`;
    params.push(kw, kw, kw);
  }
  
  sql += ' ORDER BY p.created_at DESC';
  const parcels = db.prepare(sql).all(...params);
  res.json({ success: true, data: parcels });
});

app.get('/api/parcels/:id', (req, res) => {
  const parcel = db.prepare('SELECT * FROM parcels WHERE id = ?').get(req.params.id);
  if (!parcel) {
    return res.status(404).json({ success: false, message: '地块不存在' });
  }
  res.json({ success: true, data: parcel });
});

app.post('/api/parcels', (req, res) => {
  const { parcel_no, owner_id, owner_name, area, location, village, soil_grade, crop_adapt, ownership_proof, is_transferable } = req.body;
  
  try {
    const stmt = db.prepare(`
      INSERT INTO parcels (parcel_no, owner_id, owner_name, area, location, village, soil_grade, crop_adapt, ownership_proof, is_transferable)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(parcel_no, owner_id, owner_name, area, location, village, soil_grade, crop_adapt, ownership_proof, is_transferable ? 1 : 0);
    
    logOperation('system', 'create', 'parcel', result.lastInsertRowid, req.body, req.ip);
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/api/parcels/:id', (req, res) => {
  const { parcel_no, owner_name, area, location, village, soil_grade, crop_adapt, ownership_proof, is_transferable, status } = req.body;
  
  try {
    const stmt = db.prepare(`
      UPDATE parcels 
      SET parcel_no=?, owner_name=?, area=?, location=?, village=?, soil_grade=?, crop_adapt=?, ownership_proof=?, is_transferable=?, status=?
      WHERE id=?
    `);
    stmt.run(parcel_no, owner_name, area, location, village, soil_grade, crop_adapt, ownership_proof, is_transferable ? 1 : 0, status, req.params.id);
    
    logOperation('system', 'update', 'parcel', parseInt(req.params.id), req.body, req.ip);
    res.json({ success: true, message: '更新成功' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/transfer-demands', (req, res) => {
  const { status, type, village } = req.query;
  let sql = `
    SELECT td.*, p.area, p.location, p.village, p.owner_name, u.name as publisher_name
    FROM transfer_demands td
    LEFT JOIN parcels p ON td.parcel_id = p.id
    LEFT JOIN users u ON td.publisher_id = u.id
    WHERE 1=1
  `;
  const params = [];
  
  if (status) {
    sql += ' AND td.status = ?';
    params.push(status);
  }
  if (type) {
    sql += ' AND td.type = ?';
    params.push(type);
  }
  if (village) {
    sql += ' AND p.village = ?';
    params.push(village);
  }
  
  sql += ' ORDER BY td.created_at DESC';
  const demands = db.prepare(sql).all(...params);
  res.json({ success: true, data: demands });
});

app.get('/api/transfer-demands/:id', (req, res) => {
  const demand = db.prepare(`
    SELECT td.*, p.area, p.location, p.village, p.owner_name, p.soil_grade, p.crop_adapt
    FROM transfer_demands td
    LEFT JOIN parcels p ON td.parcel_id = p.id
    WHERE td.id = ?
  `).get(req.params.id);
  
  if (!demand) {
    return res.status(404).json({ success: false, message: '流转需求不存在' });
  }
  res.json({ success: true, data: demand });
});

app.post('/api/transfer-demands', (req, res) => {
  const { parcel_id, type, price, term, usage_restriction, description, publisher_id } = req.body;
  
  try {
    const stmt = db.prepare(`
      INSERT INTO transfer_demands (parcel_id, type, price, term, usage_restriction, description, publisher_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `);
    const result = stmt.run(parcel_id, type, price, term, usage_restriction, description, publisher_id);
    
    logOperation('system', 'create', 'demand', result.lastInsertRowid, req.body, req.ip);
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/api/transfer-demands/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE transfer_demands SET status = ? WHERE id = ?').run(status, req.params.id);
  logOperation('system', 'update_status', 'demand', parseInt(req.params.id), { status }, req.ip);
  res.json({ success: true, message: '状态更新成功' });
});

app.get('/api/bids', (req, res) => {
  const { demand_id, status } = req.query;
  let sql = `
    SELECT b.*, td.type as demand_type, td.price as demand_price, p.location as parcel_location
    FROM bids b
    LEFT JOIN transfer_demands td ON b.demand_id = td.id
    LEFT JOIN parcels p ON td.parcel_id = p.id
    WHERE 1=1
  `;
  const params = [];
  
  if (demand_id) {
    sql += ' AND b.demand_id = ?';
    params.push(demand_id);
  }
  if (status) {
    sql += ' AND b.status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY b.created_at DESC';
  const bids = db.prepare(sql).all(...params);
  res.json({ success: true, data: bids });
});

app.post('/api/bids', (req, res) => {
  const { demand_id, bidder_id, bidder_name, bid_price, bid_term, intention } = req.body;
  
  try {
    const stmt = db.prepare(`
      INSERT INTO bids (demand_id, bidder_id, bidder_name, bid_price, bid_term, intention, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `);
    const result = stmt.run(demand_id, bidder_id, bidder_name, bid_price, bid_term, intention);
    
    logOperation(bidder_name, 'create', 'bid', result.lastInsertRowid, req.body, req.ip);
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/api/bids/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE bids SET status = ? WHERE id = ?').run(status, req.params.id);
  logOperation('system', 'update_status', 'bid', parseInt(req.params.id), { status }, req.ip);
  res.json({ success: true, message: '状态更新成功' });
});

app.get('/api/contracts', (req, res) => {
  const { status, village, lessor_id, lessee_id } = req.query;
  let sql = 'SELECT * FROM contracts WHERE 1=1';
  const params = [];
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (lessor_id) {
    sql += ' AND lessor_id = ?';
    params.push(lessor_id);
  }
  if (lessee_id) {
    sql += ' AND lessee_id = ?';
    params.push(lessee_id);
  }
  
  sql += ' ORDER BY created_at DESC';
  const contracts = db.prepare(sql).all(...params);
  res.json({ success: true, data: contracts });
});

app.get('/api/contracts/:id', (req, res) => {
  const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id);
  if (!contract) {
    return res.status(404).json({ success: false, message: '合同不存在' });
  }
  res.json({ success: true, data: contract });
});

app.post('/api/contracts', (req, res) => {
  const { contract_no, demand_id, parcel_id, lessor_id, lessor_name, lessee_id, lessee_name, type, area, price, total_amount, term, start_date, end_date, usage, attachments } = req.body;
  
  try {
    const stmt = db.prepare(`
      INSERT INTO contracts (contract_no, demand_id, parcel_id, lessor_id, lessor_name, lessee_id, lessee_name, type, area, price, total_amount, term, start_date, end_date, usage, status, attachments)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?)
    `);
    const result = stmt.run(contract_no, demand_id, parcel_id, lessor_id, lessor_name, lessee_id, lessee_name, type, area, price, total_amount, term, start_date, end_date, usage, attachments);
    
    logOperation('system', 'create', 'contract', result.lastInsertRowid, req.body, req.ip);
    res.json({ success: true, data: { id: result.lastInsertRowid } });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/api/contracts/:id/approve-village', (req, res) => {
  const now = new Date().toISOString().split('T')[0];
  db.prepare('UPDATE contracts SET village_approval = 1, village_approval_date = ?, status = \'village_approved\' WHERE id = ?').run(now, req.params.id);
  logOperation('village', 'approve', 'contract', parseInt(req.params.id), {}, req.ip);
  res.json({ success: true, message: '村集体备案成功' });
});

app.put('/api/contracts/:id/sign', (req, res) => {
  const now = new Date().toISOString().split('T')[0];
  db.prepare('UPDATE contracts SET sign_date = ?, status = \'active\' WHERE id = ?').run(now, req.params.id);
  logOperation('system', 'sign', 'contract', parseInt(req.params.id), {}, req.ip);
  res.json({ success: true, message: '合同签署成功' });
});

app.put('/api/contracts/:id/terminate', (req, res) => {
  db.prepare('UPDATE contracts SET status = \'terminated\' WHERE id = ?').run(req.params.id);
  logOperation('system', 'terminate', 'contract', parseInt(req.params.id), req.body, req.ip);
  res.json({ success: true, message: '合同已终止' });
});

app.get('/api/contracts/:id/rent-plans', (req, res) => {
  const plans = db.prepare('SELECT * FROM rent_plans WHERE contract_id = ? ORDER BY period_no').all(req.params.id);
  res.json({ success: true, data: plans });
});

app.post('/api/contracts/:id/rent-plans', (req, res) => {
  const { period_no, due_date, amount } = req.body;
  const stmt = db.prepare(`
    INSERT INTO rent_plans (contract_id, period_no, due_date, amount, status)
    VALUES (?, ?, ?, ?, 'pending')
  `);
  const result = stmt.run(req.params.id, period_no, due_date, amount);
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

app.put('/api/rent-plans/:id/pay', (req, res) => {
  const { paid_amount } = req.body;
  const now = new Date().toISOString().split('T')[0];
  db.prepare('UPDATE rent_plans SET paid_amount = ?, paid_date = ?, status = \'paid\' WHERE id = ?').run(paid_amount, now, req.params.id);
  logOperation('system', 'pay_rent', 'rent_plan', parseInt(req.params.id), { paid_amount }, req.ip);
  res.json({ success: true, message: '支付成功' });
});

app.get('/api/performance', (req, res) => {
  const { contract_id, type } = req.query;
  let sql = 'SELECT * FROM performance WHERE 1=1';
  const params = [];
  
  if (contract_id) {
    sql += ' AND contract_id = ?';
    params.push(contract_id);
  }
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  
  sql += ' ORDER BY record_date DESC';
  const records = db.prepare(sql).all(...params);
  res.json({ success: true, data: records });
});

app.post('/api/performance', (req, res) => {
  const { contract_id, type, record_date, description, status } = req.body;
  const stmt = db.prepare(`
    INSERT INTO performance (contract_id, type, record_date, description, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(contract_id, type, record_date, description, status || 'normal');
  logOperation('system', 'create', 'performance', result.lastInsertRowid, req.body, req.ip);
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

app.get('/api/disputes', (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM disputes WHERE 1=1';
  const params = [];
  
  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  
  sql += ' ORDER BY created_at DESC';
  const disputes = db.prepare(sql).all(...params);
  res.json({ success: true, data: disputes });
});

app.post('/api/disputes', (req, res) => {
  const { contract_id, complainant_id, complainant_name, respondent_name, type, description } = req.body;
  const stmt = db.prepare(`
    INSERT INTO disputes (contract_id, complainant_id, complainant_name, respondent_name, type, description, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
  `);
  const result = stmt.run(contract_id, complainant_id, complainant_name, respondent_name, type, description);
  logOperation(complainant_name, 'submit', 'dispute', result.lastInsertRowid, req.body, req.ip);
  res.json({ success: true, data: { id: result.lastInsertRowid } });
});

app.put('/api/disputes/:id/handle', (req, res) => {
  const { handler_id, handle_result } = req.body;
  const now = new Date().toISOString().split('T')[0];
  db.prepare('UPDATE disputes SET handler_id = ?, handle_result = ?, handle_date = ?, status = \'resolved\' WHERE id = ?').run(handler_id, handle_result, now, req.params.id);
  logOperation('supervisor', 'handle', 'dispute', parseInt(req.params.id), req.body, req.ip);
  res.json({ success: true, message: '纠纷处理完成' });
});

app.get('/api/reports/overview', (req, res) => {
  const totalParcels = db.prepare('SELECT COUNT(*) as count, SUM(area) as area FROM parcels').get();
  const transferableParcels = db.prepare('SELECT COUNT(*) as count, SUM(area) as area FROM parcels WHERE is_transferable = 1').get();
  const activeContracts = db.prepare('SELECT COUNT(*) as count, SUM(area) as area FROM contracts WHERE status = \'active\'').get();
  const totalAmount = db.prepare('SELECT SUM(total_amount) as amount FROM contracts WHERE status = \'active\'').get();
  const avgPrice = db.prepare('SELECT AVG(price) as price FROM contracts WHERE status = \'active\'').get();
  
  res.json({
    success: true,
    data: {
      totalParcels: totalParcels.count || 0,
      totalParcelArea: totalParcels.area || 0,
      transferableParcels: transferableParcels.count || 0,
      transferableArea: transferableParcels.area || 0,
      activeContracts: activeContracts.count || 0,
      contractedArea: activeContracts.area || 0,
      totalContractAmount: totalAmount.amount || 0,
      avgPrice: avgPrice.price || 0
    }
  });
});

app.get('/api/reports/by-village', (req, res) => {
  const data = db.prepare(`
    SELECT 
      p.village,
      COUNT(*) as parcel_count,
      SUM(p.area) as total_area,
      SUM(CASE WHEN p.is_transferable = 1 THEN p.area ELSE 0 END) as transferable_area,
      COUNT(DISTINCT c.id) as contract_count,
      SUM(CASE WHEN c.status = 'active' THEN c.area ELSE 0 END) as contracted_area
    FROM parcels p
    LEFT JOIN contracts c ON p.id = c.parcel_id
    GROUP BY p.village
  `).all();
  
  res.json({ success: true, data });
});

app.get('/api/reports/expiring-contracts', (req, res) => {
  const { days } = req.query;
  const thresholdDays = parseInt(days || 90);
  const today = new Date();
  const thresholdDate = new Date(today.getTime() + thresholdDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const data = db.prepare(`
    SELECT * FROM contracts 
    WHERE status = 'active' AND end_date <= ?
    ORDER BY end_date ASC
  `).all(thresholdDate);
  
  res.json({ success: true, data });
});

app.get('/api/reports/overdue-rent', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const data = db.prepare(`
    SELECT rp.*, c.contract_no, c.lessor_name, c.lessee_name
    FROM rent_plans rp
    LEFT JOIN contracts c ON rp.contract_id = c.id
    WHERE rp.status = 'pending' AND rp.due_date < ?
    ORDER BY rp.due_date ASC
  `).all(today);
  
  res.json({ success: true, data });
});

app.get('/api/logs', (req, res) => {
  const { module, limit } = req.query;
  let sql = 'SELECT * FROM operation_logs WHERE 1=1';
  const params = [];
  
  if (module) {
    sql += ' AND module = ?';
    params.push(module);
  }
  
  sql += ' ORDER BY created_at DESC';
  if (limit) {
    sql += ' LIMIT ?';
    params.push(parseInt(limit));
  }
  
  const logs = db.prepare(sql).all(...params);
  res.json({ success: true, data: logs });
});

const checkPort = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
};

const startServer = async () => {
  const portAvailable = await checkPort(PORT);
  if (!portAvailable) {
    console.error(`端口 ${PORT} 已被占用，请检查或修改 .env 中的 SERVER_PORT`);
    process.exit(1);
  }
  
  app.listen(PORT, () => {
    console.log(`农村土地流转平台后端服务已启动`);
    console.log(`服务地址: http://localhost:${PORT}`);
    console.log(`API 前缀: /api`);
  });
};

startServer();

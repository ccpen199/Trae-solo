require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = process.env.BACKEND_PORT || 58850;

app.use(cors({ origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48850}` }));
app.use(bodyParser.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  res.json(user || null);
});

app.post('/api/users', (req, res) => {
  const { name, role, phone } = req.body;
  const result = db.prepare('INSERT INTO users (name, role, phone) VALUES (?, ?, ?)').run(name, role, phone);
  res.json({ id: result.lastInsertRowid, name, role, phone });
});

app.get('/api/channels', (req, res) => {
  const channels = db.prepare('SELECT * FROM channels ORDER BY created_at DESC').all();
  res.json(channels);
});

app.post('/api/channels', (req, res) => {
  const { name, type, contact_name, contact_phone } = req.body;
  const result = db.prepare('INSERT INTO channels (name, type, contact_name, contact_phone) VALUES (?, ?, ?, ?)').run(name, type, contact_name, contact_phone);
  res.json({ id: result.lastInsertRowid });
});

app.get('/api/properties', (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM properties';
  let params = [];
  if (status) {
    sql += ' WHERE status = ?';
    params.push(status);
  }
  sql += ' ORDER BY building_no, unit_no, floor_no, room_no';
  const properties = db.prepare(sql).all(...params);
  res.json(properties);
});

app.get('/api/properties/:id', (req, res) => {
  const property = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id);
  if (!property) {
    return res.status(404).json({ error: 'Property not found' });
  }
  
  const intentions = db.prepare(`
    SELECT i.*, c.name as customer_name, c.phone as customer_phone
    FROM intentions i
    LEFT JOIN customers c ON i.customer_id = c.id
    WHERE i.property_id = ?
    ORDER BY i.created_at DESC
  `).all(req.params.id);
  
  res.json({ property, intentions });
});

app.put('/api/properties/:id', (req, res) => {
  const { building_no, unit_no, floor_no, room_no, area, layout_type, price, status } = req.body;
  const id = req.params.id;
  
  try {
    db.prepare(`
      UPDATE properties SET
        building_no = ?, unit_no = ?, floor_no = ?, room_no = ?,
        area = ?, layout_type = ?, price = ?, status = ?
      WHERE id = ?
    `).run(building_no, unit_no, floor_no, room_no, area, layout_type, price, status, id);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/properties/:id/status', (req, res) => {
  const { status } = req.body;
  const id = req.params.id;
  
  try {
    db.prepare('UPDATE properties SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customers', (req, res) => {
  const { stage, agent_id, keyword } = req.query;
  let sql = `
    SELECT c.*, 
           ch.name as channel_name,
           u.name as agent_name
    FROM customers c
    LEFT JOIN channels ch ON c.channel_id = ch.id
    LEFT JOIN users u ON c.agent_id = u.id
  `;
  let params = [];
  let conditions = [];
  
  if (stage) {
    conditions.push('c.stage = ?');
    params.push(stage);
  }
  if (agent_id) {
    conditions.push('c.agent_id = ?');
    params.push(agent_id);
  }
  if (keyword) {
    conditions.push('(c.name LIKE ? OR c.phone LIKE ?)');
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY c.created_at DESC';
  
  const customers = db.prepare(sql).all(...params);
  res.json(customers);
});

app.get('/api/customers/:id', (req, res) => {
  const customer = db.prepare(`
    SELECT c.*, 
           ch.name as channel_name,
           u.name as agent_name
    FROM customers c
    LEFT JOIN channels ch ON c.channel_id = ch.id
    LEFT JOIN users u ON c.agent_id = u.id
    WHERE c.id = ?
  `).get(req.params.id);
  
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  const visits = db.prepare(`
    SELECT v.*, u.name as receiver_name
    FROM visits v
    LEFT JOIN users u ON v.receiver_id = u.id
    WHERE v.customer_id = ?
    ORDER BY v.visit_date DESC
  `).all(req.params.id);
  
  const followUps = db.prepare(`
    SELECT f.*, u.name as agent_name
    FROM follow_ups f
    LEFT JOIN users u ON f.agent_id = u.id
    WHERE f.customer_id = ?
    ORDER BY f.follow_date DESC
  `).all(req.params.id);
  
  const intentions = db.prepare(`
    SELECT i.*, 
           p.building_no, p.unit_no, p.room_no, p.area, p.layout_type, p.price,
           u.name as approver_name
    FROM intentions i
    LEFT JOIN properties p ON i.property_id = p.id
    LEFT JOIN users u ON i.approver_id = u.id
    WHERE i.customer_id = ?
    ORDER BY i.created_at DESC
  `).all(req.params.id);
  
  const churns = db.prepare('SELECT * FROM churns WHERE customer_id = ? ORDER BY churn_date DESC').all(req.params.id);
  const revisits = db.prepare('SELECT * FROM revisits WHERE customer_id = ? ORDER BY revisit_date DESC').all(req.params.id);
  
  res.json({
    customer,
    visits,
    followUps,
    intentions,
    churns,
    revisits
  });
});

app.post('/api/customers', (req, res) => {
  const {
    name, phone, id_card, channel_id, channel_referrer_id,
    first_visit_date, intended_layout, budget_min, budget_max,
    family_structure, agent_id, remarks
  } = req.body;
  
  const existing = db.prepare('SELECT id, name, phone FROM customers WHERE phone = ?').get(phone);
  if (existing) {
    return res.status(409).json({
      error: '撞客提示',
      message: `该手机号已存在客户：${existing.name}`,
      existingCustomer: existing
    });
  }
  
  try {
    const result = db.prepare(`
      INSERT INTO customers 
      (name, phone, id_card, channel_id, channel_referrer_id, first_visit_date, latest_visit_date, 
       intended_layout, budget_min, budget_max, family_structure, agent_id, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, phone, id_card, channel_id, channel_referrer_id,
      first_visit_date || new Date().toISOString(),
      first_visit_date || new Date().toISOString(),
      intended_layout, budget_min, budget_max, family_structure, agent_id, remarks
    );
    
    res.json({ id: result.lastInsertRowid, name, phone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id', (req, res) => {
  const {
    name, phone, id_card, channel_id, channel_referrer_id,
    first_visit_date, intended_layout, budget_min, budget_max,
    family_structure, agent_id, remarks, stage
  } = req.body;
  
  try {
    db.prepare(`
      UPDATE customers SET
        name = ?, phone = ?, id_card = ?, channel_id = ?, channel_referrer_id = ?,
        first_visit_date = ?, intended_layout = ?, budget_min = ?, budget_max = ?,
        family_structure = ?, agent_id = ?, remarks = ?, stage = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name, phone, id_card, channel_id, channel_referrer_id,
      first_visit_date, intended_layout, budget_min, budget_max,
      family_structure, agent_id, remarks, stage, req.params.id
    );
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers/:id/transfer', (req, res) => {
  const { to_agent_id, reason, operator_id } = req.body;
  const customerId = req.params.id;
  
  const customer = db.prepare('SELECT agent_id FROM customers WHERE id = ?').get(customerId);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  try {
    db.prepare('BEGIN TRANSACTION').run();
    
    db.prepare('INSERT INTO agent_transfers (customer_id, from_agent_id, to_agent_id, reason, operator_id) VALUES (?, ?, ?, ?, ?)')
      .run(customerId, customer.agent_id, to_agent_id, reason, operator_id);
    
    db.prepare('UPDATE customers SET agent_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(to_agent_id, customerId);
    
    db.prepare('COMMIT').run();
    res.json({ success: true });
  } catch (err) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/visits', (req, res) => {
  const {
    customer_id, visit_type, visit_date, receiver_id,
    route, showrooms, feedback, next_follow_date, next_follow_content
  } = req.body;
  
  try {
    db.prepare('BEGIN TRANSACTION').run();
    
    const result = db.prepare(`
      INSERT INTO visits 
      (customer_id, visit_type, visit_date, receiver_id, route, showrooms, feedback, next_follow_date, next_follow_content)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      customer_id, visit_type, visit_date || new Date().toISOString(),
      receiver_id, route, showrooms, feedback, next_follow_date, next_follow_content
    );
    
    db.prepare('UPDATE customers SET latest_visit_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(visit_date || new Date().toISOString(), customer_id);
    
    db.prepare('COMMIT').run();
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/follow-ups', (req, res) => {
  const { customer_id, agent_id, follow_date, method, content, result, next_follow_date } = req.body;
  
  const resultObj = db.prepare(`
    INSERT INTO follow_ups (customer_id, agent_id, follow_date, method, content, result, next_follow_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    customer_id, agent_id, follow_date || new Date().toISOString(),
    method, content, result, next_follow_date
  );
  
  res.json({ id: resultObj.lastInsertRowid });
});

app.post('/api/intentions', (req, res) => {
  const {
    customer_id, type, property_id, deposit_amount,
    discount_amount, payment_method, remarks
  } = req.body;
  
  try {
    db.prepare('BEGIN TRANSACTION').run();
    
    const result = db.prepare(`
      INSERT INTO intentions 
      (customer_id, type, property_id, deposit_amount, discount_amount, payment_method, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      customer_id, type, property_id, deposit_amount,
      discount_amount, payment_method, remarks
    );
    
    const stageMap = {
      'deposit': 'deposit',
      'subscription': 'subscription',
      'signing': 'signed'
    };
    if (stageMap[type]) {
      db.prepare('UPDATE customers SET stage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(stageMap[type], customer_id);
    }
    
    if (property_id && type === 'signing') {
      db.prepare('UPDATE properties SET status = ? WHERE id = ?')
        .run('sold', property_id);
    }
    
    db.prepare('COMMIT').run();
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/intentions/:id/approve', (req, res) => {
  const { approver_id, status } = req.body;
  
  const intention = db.prepare('SELECT * FROM intentions WHERE id = ?').get(req.params.id);
  if (!intention) {
    return res.status(404).json({ error: 'Intention not found' });
  }
  
  try {
    db.prepare(`
      UPDATE intentions 
      SET approval_status = ?, approver_id = ?, approval_date = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status || 'approved', approver_id, req.params.id);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/intentions/:id/refund', (req, res) => {
  const { reason, operator_id } = req.body;
  
  const intention = db.prepare('SELECT * FROM intentions WHERE id = ?').get(req.params.id);
  if (!intention) {
    return res.status(404).json({ error: 'Intention not found' });
  }
  
  try {
    db.prepare('BEGIN TRANSACTION').run();
    
    db.prepare(`
      UPDATE intentions 
      SET approval_status = 'refunded', approver_id = ?, approval_date = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(operator_id, req.params.id);
    
    if (intention.property_id) {
      db.prepare('UPDATE properties SET status = ? WHERE id = ?').run('available', intention.property_id);
    }
    
    db.prepare('UPDATE customers SET stage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('lead', intention.customer_id);
    
    db.prepare('COMMIT').run();
    res.json({ success: true });
  } catch (err) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/churns', (req, res) => {
  const {
    customer_id, churn_date, reason, competitor,
    price_sensitivity, recontact_plan, recontact_date, remarks
  } = req.body;
  
  try {
    db.prepare('BEGIN TRANSACTION').run();
    
    const result = db.prepare(`
      INSERT INTO churns 
      (customer_id, churn_date, reason, competitor, price_sensitivity, recontact_plan, recontact_date, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      customer_id, churn_date || new Date().toISOString(),
      reason, competitor, price_sensitivity, recontact_plan, recontact_date, remarks
    );
    
    db.prepare('UPDATE customers SET stage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('churned', customer_id);
    
    db.prepare('COMMIT').run();
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/revisits', (req, res) => {
  const { customer_id, revisit_date, receiver_id, purpose, feedback, next_follow_date } = req.body;
  
  try {
    db.prepare('BEGIN TRANSACTION').run();
    
    const result = db.prepare(`
      INSERT INTO revisits (customer_id, revisit_date, receiver_id, purpose, feedback, next_follow_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      customer_id, revisit_date || new Date().toISOString(),
      receiver_id, purpose, feedback, next_follow_date
    );
    
    db.prepare('UPDATE customers SET stage = ?, latest_visit_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('lead', revisit_date || new Date().toISOString(), customer_id);
    
    db.prepare('COMMIT').run();
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    db.prepare('ROLLBACK').run();
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/summary', (req, res) => {
  const totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
  const stageStats = db.prepare(`
    SELECT stage, COUNT(*) as count 
    FROM customers 
    GROUP BY stage
  `).all();
  
  const channelStats = db.prepare(`
    SELECT ch.name as channel, COUNT(*) as count
    FROM customers c
    LEFT JOIN channels ch ON c.channel_id = ch.id
    GROUP BY c.channel_id
  `).all();
  
  const agentStats = db.prepare(`
    SELECT u.name as agent, COUNT(*) as count
    FROM customers c
    LEFT JOIN users u ON c.agent_id = u.id
    WHERE c.agent_id IS NOT NULL
    GROUP BY c.agent_id
  `).all();
  
  res.json({
    totalCustomers,
    stageStats,
    channelStats,
    agentStats
  });
});

app.get('/api/reports/churn-reasons', (req, res) => {
  const reasons = db.prepare(`
    SELECT reason, COUNT(*) as count
    FROM churns
    GROUP BY reason
    ORDER BY count DESC
  `).all();
  
  const competitors = db.prepare(`
    SELECT competitor, COUNT(*) as count
    FROM churns
    WHERE competitor IS NOT NULL AND competitor != ''
    GROUP BY competitor
    ORDER BY count DESC
  `).all();
  
  res.json({ reasons, competitors });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});

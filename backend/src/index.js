require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.BACKEND_PORT || 58958;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48958}`,
  credentials: true
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/factories', (req, res) => {
  const { region, category, scale, verified } = req.query;
  let sql = 'SELECT * FROM factories WHERE 1=1';
  const params = [];

  if (region) {
    sql += ' AND region LIKE ?';
    params.push(`%${region}%`);
  }
  if (category) {
    sql += ' AND category LIKE ?';
    params.push(`%${category}%`);
  }
  if (scale) {
    sql += ' AND scale = ?';
    params.push(scale);
  }
  if (verified !== undefined) {
    sql += ' AND is_verified = ?';
    params.push(verified ? 1 : 0);
  }

  sql += ' ORDER BY created_at DESC';
  const factories = db.prepare(sql).all(...params);
  res.json(factories);
});

app.get('/api/factories/:id', (req, res) => {
  const factory = db.prepare('SELECT * FROM factories WHERE id = ?').get(req.params.id);
  if (!factory) {
    return res.status(404).json({ error: 'Factory not found' });
  }

  const certifications = db.prepare('SELECT * FROM certifications WHERE factory_id = ?').all(req.params.id);
  const capacity = db.prepare('SELECT * FROM production_capacity WHERE factory_id = ?').get(req.params.id);
  const samples = db.prepare('SELECT * FROM samples WHERE factory_id = ?').all(req.params.id);
  const quotations = db.prepare('SELECT * FROM quotations WHERE factory_id = ? ORDER BY created_at DESC').all(req.params.id);
  const photos = db.prepare('SELECT * FROM factory_photos WHERE factory_id = ?').all(req.params.id);
  const inspections = db.prepare('SELECT * FROM factory_inspections WHERE factory_id = ? ORDER BY inspection_date DESC').all(req.params.id);
  const complaints = db.prepare('SELECT * FROM complaints WHERE factory_id = ? ORDER BY created_at DESC').all(req.params.id);
  const cooperation = db.prepare('SELECT * FROM cooperation_records WHERE factory_id = ? ORDER BY created_at DESC').all(req.params.id);
  const auditLogs = db.prepare('SELECT * FROM audit_logs WHERE factory_id = ? ORDER BY created_at DESC').all(req.params.id);

  res.json({
    ...factory,
    certifications,
    capacity,
    samples,
    quotations,
    photos,
    inspections,
    complaints,
    cooperation,
    auditLogs
  });
});

app.post('/api/factories', (req, res) => {
  const { name, region, category, scale, equipment, contact_name, contact_phone, main_customers } = req.body;
  const result = db.prepare(`
    INSERT INTO factories (name, region, category, scale, equipment, contact_name, contact_phone, main_customers)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, region, category, scale, equipment, contact_name, contact_phone, main_customers);

  res.status(201).json({ id: result.lastInsertRowid, ...req.body });
});

app.put('/api/factories/:id', (req, res) => {
  const { name, region, category, scale, equipment, contact_name, contact_phone, main_customers, cooperation_status } = req.body;
  db.prepare(`
    UPDATE factories 
    SET name = ?, region = ?, category = ?, scale = ?, equipment = ?, contact_name = ?, contact_phone = ?, main_customers = ?, cooperation_status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, region, category, scale, equipment, contact_name, contact_phone, main_customers, cooperation_status, req.params.id);

  res.json({ id: req.params.id, ...req.body });
});

app.get('/api/factories/:id/certifications', (req, res) => {
  const certifications = db.prepare('SELECT * FROM certifications WHERE factory_id = ?').all(req.params.id);
  res.json(certifications);
});

app.post('/api/factories/:id/certifications', (req, res) => {
  const { name, issue_date, expiry_date, file_url } = req.body;
  const result = db.prepare(`
    INSERT INTO certifications (factory_id, name, issue_date, expiry_date, file_url)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, name, issue_date, expiry_date, file_url);

  res.status(201).json({ id: result.lastInsertRowid, ...req.body });
});

app.get('/api/factories/:id/capacity', (req, res) => {
  const capacity = db.prepare('SELECT * FROM production_capacity WHERE factory_id = ?').get(req.params.id);
  res.json(capacity || {});
});

app.put('/api/factories/:id/capacity', (req, res) => {
  const { monthly_capacity, moq, delivery_time, peak_season_restriction, outsourcing_capability } = req.body;
  const existing = db.prepare('SELECT id FROM production_capacity WHERE factory_id = ?').get(req.params.id);

  if (existing) {
    db.prepare(`
      UPDATE production_capacity 
      SET monthly_capacity = ?, moq = ?, delivery_time = ?, peak_season_restriction = ?, outsourcing_capability = ?, updated_at = CURRENT_TIMESTAMP
      WHERE factory_id = ?
    `).run(monthly_capacity, moq, delivery_time, peak_season_restriction, outsourcing_capability, req.params.id);
  } else {
    db.prepare(`
      INSERT INTO production_capacity (factory_id, monthly_capacity, moq, delivery_time, peak_season_restriction, outsourcing_capability)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.params.id, monthly_capacity, moq, delivery_time, peak_season_restriction, outsourcing_capability);
  }

  res.json({ ...req.body });
});

app.get('/api/factories/:id/samples', (req, res) => {
  const samples = db.prepare('SELECT * FROM samples WHERE factory_id = ?').all(req.params.id);
  res.json(samples);
});

app.post('/api/factories/:id/samples', (req, res) => {
  const { product_name, process, material, price, sample_cycle, customer_feedback } = req.body;
  const result = db.prepare(`
    INSERT INTO samples (factory_id, product_name, process, material, price, sample_cycle, customer_feedback)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, product_name, process, material, price, sample_cycle, customer_feedback);

  res.status(201).json({ id: result.lastInsertRowid, ...req.body });
});

app.get('/api/factories/:id/quotations', (req, res) => {
  const quotations = db.prepare('SELECT * FROM quotations WHERE factory_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(quotations);
});

app.post('/api/factories/:id/quotations', (req, res) => {
  const { sample_id, product_name, process, material, price, quantity, delivery_time, customer_feedback } = req.body;
  
  const maxVersion = db.prepare('SELECT MAX(version) as max FROM quotations WHERE factory_id = ? AND product_name = ?').get(req.params.id, product_name);
  const version = (maxVersion?.max || 0) + 1;

  const result = db.prepare(`
    INSERT INTO quotations (factory_id, sample_id, product_name, process, material, price, quantity, delivery_time, customer_feedback, version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, sample_id, product_name, process, material, price, quantity, delivery_time, customer_feedback, version);

  res.status(201).json({ id: result.lastInsertRowid, version, ...req.body });
});

app.post('/api/factories/:id/audit', (req, res) => {
  const { action, notes, auditor } = req.body;

  db.prepare(`
    INSERT INTO audit_logs (factory_id, auditor, action, notes)
    VALUES (?, ?, ?, ?)
  `).run(req.params.id, auditor || 'system', action, notes);

  if (action === 'verify') {
    db.prepare('UPDATE factories SET is_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  } else {
    db.prepare('UPDATE factories SET is_verified = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  }

  res.json({ success: true });
});

app.post('/api/factories/:id/photos', (req, res) => {
  const { photo_url, description } = req.body;
  const result = db.prepare(`
    INSERT INTO factory_photos (factory_id, photo_url, description)
    VALUES (?, ?, ?)
  `).run(req.params.id, photo_url, description);

  res.status(201).json({ id: result.lastInsertRowid, ...req.body });
});

app.post('/api/factories/:id/inspections', (req, res) => {
  const { inspector, inspection_date, result, notes } = req.body;
  const insertResult = db.prepare(`
    INSERT INTO factory_inspections (factory_id, inspector, inspection_date, result, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, inspector, inspection_date, result, notes);

  res.status(201).json({ id: insertResult.lastInsertRowid, ...req.body });
});

app.post('/api/factories/:id/cooperation', (req, res) => {
  const { customer_name, project_name, start_date, end_date, status, amount, notes } = req.body;
  const result = db.prepare(`
    INSERT INTO cooperation_records (factory_id, customer_name, project_name, start_date, end_date, status, amount, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.params.id, customer_name, project_name, start_date, end_date, status, amount, notes);

  res.status(201).json({ id: result.lastInsertRowid, ...req.body });
});

app.get('/api/dashboard/stats', (req, res) => {
  const totalFactories = db.prepare('SELECT COUNT(*) as count FROM factories').get().count;
  const verifiedFactories = db.prepare('SELECT COUNT(*) as count FROM factories WHERE is_verified = 1').get().count;
  const pendingAudit = db.prepare('SELECT COUNT(*) as count FROM factories WHERE is_verified = 0').get().count;
  const expiringCerts = db.prepare('SELECT COUNT(*) as count FROM certifications WHERE expiry_date <= DATE(\'now\', \'+30 days\')').get().count;

  res.json({
    totalFactories,
    verifiedFactories,
    pendingAudit,
    expiringCerts
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});

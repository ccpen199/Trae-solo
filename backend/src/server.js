require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const db = require('./database');

const app = express();
const PORT = process.env.BACKEND_PORT || 58903;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48903}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/material-types', (req, res) => {
  const types = db.prepare('SELECT * FROM material_types ORDER BY name').all();
  res.json(types);
});

app.get('/api/service-items', (req, res) => {
  const items = db.prepare('SELECT * FROM service_items ORDER BY name').all();
  res.json(items);
});

app.get('/api/service-items/:id', (req, res) => {
  const item = db.prepare('SELECT * FROM service_items WHERE id = ?').get(req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Service item not found' });
  }
  const materials = db.prepare(`
    SELECT sim.*, mt.code, mt.name, mt.validity_days, mt.is_sensitive
    FROM service_item_materials sim
    JOIN material_types mt ON sim.material_type_id = mt.id
    WHERE sim.service_item_id = ?
  `).all(req.params.id);
  item.required_materials = materials;
  res.json(item);
});

app.get('/api/applicants', (req, res) => {
  const { id_card } = req.query;
  let query = 'SELECT * FROM applicants';
  let params = [];
  if (id_card) {
    query += ' WHERE id_card = ?';
    params.push(id_card);
  }
  query += ' ORDER BY created_at DESC';
  const applicants = db.prepare(query).all(...params);
  res.json(applicants);
});

app.post('/api/applicants', (req, res) => {
  const { id_card, name, phone, address } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO applicants (id_card, name, phone, address)
      VALUES (?, ?, ?, ?)
    `).run(id_card, name, phone, address);
    res.json({ id: result.lastInsertRowid, ...req.body });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      const existing = db.prepare('SELECT * FROM applicants WHERE id_card = ?').get(id_card);
      res.json(existing);
    } else {
      res.status(400).json({ error: err.message });
    }
  }
});

app.get('/api/applicants/:id/materials', (req, res) => {
  const materials = db.prepare(`
    SELECT m.*, mt.code as type_code, mt.name as type_name, mt.validity_days,
           si.name as source_service_name
    FROM materials m
    JOIN material_types mt ON m.material_type_id = mt.id
    LEFT JOIN service_items si ON m.source_service_item_id = si.id
    WHERE m.applicant_id = ?
    ORDER BY m.created_at DESC
  `).all(req.params.id);
  res.json(materials);
});

const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, uniqueSuffix + '-' + encodeURIComponent(originalName));
  }
});
const upload = multer({ storage });

app.post('/api/materials/upload', upload.single('file'), (req, res) => {
  const { applicant_id, material_type_id, source_service_item_id, effective_date, expiry_date, source } = req.body;
  
  const materialType = db.prepare('SELECT * FROM material_types WHERE id = ?').get(material_type_id);
  
  const fileName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
  
  const result = db.prepare(`
    INSERT INTO materials (applicant_id, material_type_id, source_service_item_id, 
                           file_name, file_path, file_size, effective_date, expiry_date, 
                           source, is_sensitive, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'valid')
  `).run(
    applicant_id, material_type_id, source_service_item_id || null,
    fileName, req.file.path, req.file.size,
    effective_date || new Date().toISOString().split('T')[0],
    expiry_date || null,
    source || 'upload',
    materialType?.is_sensitive || 0
  );
  
  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(result.lastInsertRowid);
  res.json(material);
});

app.post('/api/applications/check-reusable', (req, res) => {
  const { applicant_id, service_item_id } = req.body;
  
  const requiredMaterials = db.prepare(`
    SELECT sim.*, mt.code, mt.name, mt.validity_days, mt.is_sensitive, mt.id as material_type_id
    FROM service_item_materials sim
    JOIN material_types mt ON sim.material_type_id = mt.id
    WHERE sim.service_item_id = ?
  `).all(service_item_id);
  
  const existingMaterials = db.prepare(`
    SELECT m.*, mt.code as type_code
    FROM materials m
    JOIN material_types mt ON m.material_type_id = mt.id
    WHERE m.applicant_id = ? AND m.status = 'valid'
  `).all(applicant_id);
  
  const result = requiredMaterials.map(reqMat => {
    const existing = existingMaterials.filter(m => m.material_type_id === reqMat.material_type_id);
    
    const today = new Date().toISOString().split('T')[0];
    const valid = existing.find(m => {
      if (!m.expiry_date) return true;
      return m.expiry_date >= today;
    });
    
    const hasActiveAuth = true;
    
    if (valid && hasActiveAuth && !reqMat.need_resign) {
      return {
        ...reqMat,
        material_id: valid.id,
        material_file_name: valid.file_name,
        usage_type: 'reuse',
        reuse_reason: `材料在有效期内（来源: ${valid.source || '历史提交'}），可跨事项复用`,
        can_reuse: true,
        need_update: false
      };
    } else if (valid && reqMat.need_resign) {
      return {
        ...reqMat,
        material_id: valid.id,
        usage_type: 'resign',
        reuse_reason: '该材料需要重新签署',
        can_reuse: false,
        need_update: true
      };
    } else if (existing.length > 0 && !valid) {
      return {
        ...reqMat,
        material_id: existing[0].id,
        material_file_name: existing[0].file_name,
        usage_type: 'renew',
        reuse_reason: '材料已过期，需要更新',
        can_reuse: false,
        need_update: true
      };
    }
    
    return {
      ...reqMat,
      usage_type: 'new',
      can_reuse: false,
      need_update: false
    };
  });
  
  res.json(result);
});

app.post('/api/applications', (req, res) => {
  const { applicant_id, service_item_id, materials, created_by } = req.body;
  
  const application_no = 'SL' + Date.now();
  
  const result = db.prepare(`
    INSERT INTO service_applications (applicant_id, service_item_id, application_no, status, created_by)
    VALUES (?, ?, ?, 'pending', ?)
  `).run(applicant_id, service_item_id, application_no, created_by || null);
  
  const applicationId = result.lastInsertRowid;
  
  const insertMat = db.prepare(`
    INSERT INTO application_materials (application_id, material_id, material_type_id, usage_type, reuse_reason, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `);
  
  materials.forEach(mat => {
    insertMat.run(applicationId, mat.material_id || null, mat.material_type_id, mat.usage_type, mat.reuse_reason || null);
  });
  
  const application = db.prepare('SELECT * FROM service_applications WHERE id = ?').get(applicationId);
  res.json(application);
});

app.get('/api/applications', (req, res) => {
  const { applicant_id, status } = req.query;
  let query = `
    SELECT sa.*, a.name as applicant_name, a.id_card, si.name as service_name
    FROM service_applications sa
    JOIN applicants a ON sa.applicant_id = a.id
    JOIN service_items si ON sa.service_item_id = si.id
    WHERE 1=1
  `;
  let params = [];
  
  if (applicant_id) {
    query += ' AND sa.applicant_id = ?';
    params.push(applicant_id);
  }
  if (status) {
    query += ' AND sa.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY sa.created_at DESC';
  
  const applications = db.prepare(query).all(...params);
  res.json(applications);
});

app.get('/api/applications/:id', (req, res) => {
  const application = db.prepare(`
    SELECT sa.*, a.name as applicant_name, a.id_card, a.phone,
           si.name as service_name, si.department
    FROM service_applications sa
    JOIN applicants a ON sa.applicant_id = a.id
    JOIN service_items si ON sa.service_item_id = si.id
    WHERE sa.id = ?
  `).get(req.params.id);
  
  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }
  
  const materials = db.prepare(`
    SELECT am.*, m.file_name, m.file_path, mt.name as material_name, mt.code,
           a.status as auth_status
    FROM application_materials am
    JOIN material_types mt ON am.material_type_id = mt.id
    LEFT JOIN materials m ON am.material_id = m.id
    LEFT JOIN authorizations a ON a.material_id = m.id AND a.status = 'active'
    WHERE am.application_id = ?
  `).all(req.params.id);
  
  application.materials = materials;
  res.json(application);
});

app.put('/api/applications/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare(`
    UPDATE service_applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(status, req.params.id);
  
  res.json({ id: req.params.id, status });
});

app.post('/api/authorizations', (req, res) => {
  const { material_id, applicant_id, department, purpose, start_date, end_date, consented_by } = req.body;
  
  const result = db.prepare(`
    INSERT INTO authorizations (material_id, applicant_id, department, purpose, start_date, end_date, status, consented_at, consented_by)
    VALUES (?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, ?)
  `).run(material_id, applicant_id, department, purpose, start_date, end_date, consented_by || null);
  
  const auth = db.prepare('SELECT * FROM authorizations WHERE id = ?').get(result.lastInsertRowid);
  res.json(auth);
});

app.put('/api/authorizations/:id/withdraw', (req, res) => {
  const { reason, withdrawn_by } = req.body;
  db.prepare(`
    UPDATE authorizations 
    SET status = 'withdrawn', withdrawn_at = CURRENT_TIMESTAMP, withdraw_reason = ?, withdrawn_by = ?
    WHERE id = ?
  `).run(reason, withdrawn_by || null, req.params.id);
  
  const auth = db.prepare('SELECT * FROM authorizations WHERE id = ?').get(req.params.id);
  res.json(auth);
});

app.get('/api/authorizations', (req, res) => {
  const { applicant_id, material_id, status } = req.query;
  let query = `
    SELECT a.*, m.file_name, mt.name as material_name, mt.code
    FROM authorizations a
    JOIN materials m ON a.material_id = m.id
    JOIN material_types mt ON m.material_type_id = mt.id
    WHERE 1=1
  `;
  let params = [];
  
  if (applicant_id) {
    query += ' AND a.applicant_id = ?';
    params.push(applicant_id);
  }
  if (material_id) {
    query += ' AND a.material_id = ?';
    params.push(material_id);
  }
  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY a.created_at DESC';
  
  const auths = db.prepare(query).all(...params);
  res.json(auths);
});

app.post('/api/corrections', (req, res) => {
  const { application_material_id, application_id, reason, corrector_id } = req.body;
  
  const result = db.prepare(`
    INSERT INTO corrections (application_material_id, application_id, reason, corrector_id, status)
    VALUES (?, ?, ?, ?, 'pending')
  `).run(application_material_id, application_id, reason, corrector_id || null);
  
  db.prepare(`
    UPDATE application_materials SET status = 'correction_needed' WHERE id = ?
  `).run(application_material_id);
  
  db.prepare(`
    UPDATE service_applications SET status = 'correction', updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(application_id);
  
  const correction = db.prepare('SELECT * FROM corrections WHERE id = ?').get(result.lastInsertRowid);
  res.json(correction);
});

app.put('/api/corrections/:id/resolve', (req, res) => {
  const { application_material_id, application_id } = req.body;
  
  db.prepare(`
    UPDATE corrections SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP WHERE id = ?
  `).run(req.params.id);
  
  db.prepare(`
    UPDATE application_materials SET status = 'corrected' WHERE id = ?
  `).run(application_material_id);
  
  const pendingCorrections = db.prepare(`
    SELECT COUNT(*) as count FROM corrections 
    WHERE application_id = ? AND status = 'pending'
  `).get(application_id);
  
  if (pendingCorrections.count === 0) {
    db.prepare(`
      UPDATE service_applications SET status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(application_id);
  }
  
  res.json({ id: req.params.id, status: 'resolved' });
});

app.get('/api/corrections', (req, res) => {
  const { application_id, status } = req.query;
  let query = `
    SELECT c.*, am.material_type_id, mt.name as material_name,
           sa.application_no, a.name as applicant_name
    FROM corrections c
    JOIN application_materials am ON c.application_material_id = am.id
    JOIN material_types mt ON am.material_type_id = mt.id
    JOIN service_applications sa ON c.application_id = sa.id
    JOIN applicants a ON sa.applicant_id = a.id
    WHERE 1=1
  `;
  let params = [];
  
  if (application_id) {
    query += ' AND c.application_id = ?';
    params.push(application_id);
  }
  if (status) {
    query += ' AND c.status = ?';
    params.push(status);
  }
  
  query += ' ORDER BY c.created_at DESC';
  
  const corrections = db.prepare(query).all(...params);
  res.json(corrections);
});

app.get('/api/materials/:id/download', (req, res) => {
  const material = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  if (!material) {
    return res.status(404).json({ error: 'Material not found' });
  }
  
  if (material.is_sensitive) {
    // In production, should check permissions here
  }
  
  if (fs.existsSync(material.file_path)) {
    res.download(material.file_path, material.file_name);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const bcrypt = require('bcrypt');
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  if (bcrypt.compareSync(password, user.password)) {
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});

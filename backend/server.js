require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = process.env.BACKEND_PORT || 58814;
const JWT_SECRET = 'your-secret-key-change-in-production';

app.use(cors({
  origin: [
    `http://127.0.0.1:${process.env.FRONTEND_PORT || 48814}`,
    `http://localhost:${process.env.FRONTEND_PORT || 48814}`
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '未授权访问' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token 无效' });
    }
    req.user = user;
    next();
  });
};

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email
    }
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/clients', authenticateToken, (req, res) => {
  const clients = db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all();
  res.json(clients);
});

app.post('/api/clients', authenticateToken, (req, res) => {
  const { name, industry, contact_person, contact_email, contact_phone, address, notes } = req.body;
  
  const result = db.prepare(`
    INSERT INTO clients (name, industry, contact_person, contact_email, contact_phone, address, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(name, industry, contact_person, contact_email, contact_phone, address, notes);

  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.put('/api/clients/:id', authenticateToken, (req, res) => {
  const { name, industry, contact_person, contact_email, contact_phone, address, notes } = req.body;
  const { id } = req.params;

  db.prepare(`
    UPDATE clients 
    SET name = ?, industry = ?, contact_person = ?, contact_email = ?, contact_phone = ?, address = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, industry, contact_person, contact_email, contact_phone, address, notes, id);

  res.json({ id: parseInt(id), ...req.body });
});

app.get('/api/positions', authenticateToken, (req, res) => {
  const positions = db.prepare(`
    SELECT p.*, c.name as client_name, u.name as consultant_name
    FROM positions p
    LEFT JOIN clients c ON p.client_id = c.id
    LEFT JOIN users u ON p.consultant_id = u.id
    ORDER BY p.created_at DESC
  `).all();
  res.json(positions);
});

app.get('/api/positions/:id', authenticateToken, (req, res) => {
  const position = db.prepare(`
    SELECT p.*, c.name as client_name, u.name as consultant_name
    FROM positions p
    LEFT JOIN clients c ON p.client_id = c.id
    LEFT JOIN users u ON p.consultant_id = u.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!position) {
    return res.status(404).json({ error: '职位不存在' });
  }

  const versions = db.prepare(`
    SELECT pv.*, u.name as changed_by_name
    FROM position_versions pv
    LEFT JOIN users u ON pv.changed_by = u.id
    WHERE pv.position_id = ?
    ORDER BY pv.version DESC
  `).all(req.params.id);

  res.json({ ...position, versions });
});

app.post('/api/positions', authenticateToken, (req, res) => {
  const { client_id, title, description, requirements, salary_min, salary_max, priority, consultant_id, service_rate, is_confidential } = req.body;
  
  const result = db.prepare(`
    INSERT INTO positions (client_id, title, description, requirements, salary_min, salary_max, priority, consultant_id, service_rate, is_confidential)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(client_id, title, description, requirements, salary_min, salary_max, priority, consultant_id, service_rate, is_confidential ? 1 : 0);

  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.put('/api/positions/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, description, requirements, salary_min, salary_max, priority, consultant_id, service_rate, is_confidential, status, change_reason } = req.body;

  const oldPosition = db.prepare('SELECT * FROM positions WHERE id = ?').get(id);
  
  if (!oldPosition) {
    return res.status(404).json({ error: '职位不存在' });
  }

  const newVersion = oldPosition.version + 1;

  db.prepare(`
    INSERT INTO position_versions (position_id, version, title, description, requirements, salary_min, salary_max, priority, consultant_id, service_rate, is_confidential, changed_by, change_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, oldPosition.version, oldPosition.title, oldPosition.description, oldPosition.requirements, 
          oldPosition.salary_min, oldPosition.salary_max, oldPosition.priority, oldPosition.consultant_id, 
          oldPosition.service_rate, oldPosition.is_confidential, req.user.id, change_reason);

  db.prepare(`
    UPDATE positions 
    SET title = ?, description = ?, requirements = ?, salary_min = ?, salary_max = ?, 
        priority = ?, consultant_id = ?, service_rate = ?, is_confidential = ?, status = ?, version = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title, description, requirements, salary_min, salary_max, priority, consultant_id, service_rate, is_confidential ? 1 : 0, status, newVersion, id);

  res.json({ id: parseInt(id), ...req.body, version: newVersion });
});

app.get('/api/candidates', authenticateToken, (req, res) => {
  const candidates = db.prepare(`
    SELECT c.*, u.name as created_by_name
    FROM candidates c
    LEFT JOIN users u ON c.created_by = u.id
    ORDER BY c.created_at DESC
  `).all();
  res.json(candidates);
});

app.get('/api/candidates/:id', authenticateToken, (req, res) => {
  const candidate = db.prepare(`
    SELECT c.*, u.name as created_by_name
    FROM candidates c
    LEFT JOIN users u ON c.created_by = u.id
    WHERE c.id = ?
  `).get(req.params.id);

  if (!candidate) {
    return res.status(404).json({ error: '候选人不存在' });
  }

  const communications = db.prepare(`
    SELECT cc.*, u.name as created_by_name
    FROM candidate_communications cc
    LEFT JOIN users u ON cc.created_by = u.id
    WHERE cc.candidate_id = ?
    ORDER BY cc.created_at DESC
  `).all(req.params.id);

  const recommendations = db.prepare(`
    SELECT r.*, p.title as position_title, c.name as client_name
    FROM recommendations r
    LEFT JOIN positions p ON r.position_id = p.id
    LEFT JOIN clients c ON r.client_id = c.id
    WHERE r.candidate_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.id);

  res.json({ ...candidate, communications, recommendations });
});

app.post('/api/candidates', authenticateToken, (req, res) => {
  const { name, gender, age, phone, email, source, resume, current_company, current_position, 
          current_salary, expected_salary_min, expected_salary_max, intention_level, 
          has_nonce_competition, nonce_competition_notes, notes } = req.body;
  
  const result = db.prepare(`
    INSERT INTO candidates (name, gender, age, phone, email, source, resume, current_company, current_position, 
                            current_salary, expected_salary_min, expected_salary_max, intention_level, 
                            has_nonce_competition, nonce_competition_notes, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, gender, age, phone, email, source, resume, current_company, current_position,
         current_salary, expected_salary_min, expected_salary_max, intention_level,
         has_nonce_competition ? 1 : 0, nonce_competition_notes, notes, req.user.id);

  res.json({ id: result.lastInsertRowid, ...req.body });
});

app.put('/api/candidates/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, gender, age, phone, email, source, resume, current_company, current_position, 
          current_salary, expected_salary_min, expected_salary_max, intention_level, 
          has_nonce_competition, nonce_competition_notes, notes } = req.body;

  db.prepare(`
    UPDATE candidates 
    SET name = ?, gender = ?, age = ?, phone = ?, email = ?, source = ?, resume = ?, 
        current_company = ?, current_position = ?, current_salary = ?, expected_salary_min = ?, 
        expected_salary_max = ?, intention_level = ?, has_nonce_competition = ?, 
        nonce_competition_notes = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, gender, age, phone, email, source, resume, current_company, current_position,
         current_salary, expected_salary_min, expected_salary_max, intention_level,
         has_nonce_competition ? 1 : 0, nonce_competition_notes, notes, id);

  res.json({ id: parseInt(id), ...req.body });
});

app.post('/api/candidates/:id/communications', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { content, communication_type } = req.body;

  const result = db.prepare(`
    INSERT INTO candidate_communications (candidate_id, content, communication_type, created_by)
    VALUES (?, ?, ?, ?)
  `).run(id, content, communication_type, req.user.id);

  res.json({ id: result.lastInsertRowid, candidate_id: parseInt(id), content, communication_type });
});

app.get('/api/recommendations/check', authenticateToken, (req, res) => {
  const { candidate_id, client_id, position_id } = req.query;
  
  const existingRecommendations = db.prepare(`
    SELECT r.*, p.title as position_title, c.name as client_name
    FROM recommendations r
    LEFT JOIN positions p ON r.position_id = p.id
    LEFT JOIN clients c ON r.client_id = c.id
    WHERE r.candidate_id = ? AND (r.client_id = ? OR r.position_id = ?)
  `).all(candidate_id, client_id, position_id);

  const conflictClientPositions = db.prepare(`
    SELECT p.*, c.name as client_name
    FROM positions p
    LEFT JOIN clients c ON p.client_id = c.id
    WHERE p.client_id = ? AND p.status = 'active'
  `).all(client_id);

  res.json({
    hasConflict: existingRecommendations.length > 0,
    existingRecommendations,
    conflictClientPositions
  });
});

app.get('/api/recommendations', authenticateToken, (req, res) => {
  const recommendations = db.prepare(`
    SELECT r.*, 
           c.name as candidate_name,
           p.title as position_title,
           cl.name as client_name,
           u.name as consultant_name
    FROM recommendations r
    LEFT JOIN candidates c ON r.candidate_id = c.id
    LEFT JOIN positions p ON r.position_id = p.id
    LEFT JOIN clients cl ON r.client_id = cl.id
    LEFT JOIN users u ON r.consultant_id = u.id
    ORDER BY r.created_at DESC
  `).all();
  res.json(recommendations);
});

app.get('/api/recommendations/:id', authenticateToken, (req, res) => {
  const recommendation = db.prepare(`
    SELECT r.*, 
           c.name as candidate_name, c.phone as candidate_phone, c.email as candidate_email,
           p.title as position_title, p.salary_min, p.salary_max,
           cl.name as client_name,
           u.name as consultant_name
    FROM recommendations r
    LEFT JOIN candidates c ON r.candidate_id = c.id
    LEFT JOIN positions p ON r.position_id = p.id
    LEFT JOIN clients cl ON r.client_id = cl.id
    LEFT JOIN users u ON r.consultant_id = u.id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!recommendation) {
    return res.status(404).json({ error: '推荐不存在' });
  }

  const interviews = db.prepare(`
    SELECT * FROM interviews WHERE recommendation_id = ? ORDER BY created_at DESC
  `).all(req.params.id);

  const offers = db.prepare(`
    SELECT * FROM offers WHERE recommendation_id = ? ORDER BY created_at DESC
  `).all(req.params.id);

  const timeline = db.prepare(`
    SELECT te.*, u.name as created_by_name
    FROM timeline_events te
    LEFT JOIN users u ON te.created_by = u.id
    WHERE te.recommendation_id = ?
    ORDER BY te.event_time DESC
  `).all(req.params.id);

  res.json({ ...recommendation, interviews, offers, timeline });
});

app.post('/api/recommendations', authenticateToken, (req, res) => {
  const { candidate_id, position_id, recommendation_notes } = req.body;

  const position = db.prepare('SELECT * FROM positions WHERE id = ?').get(position_id);
  if (!position) {
    return res.status(404).json({ error: '职位不存在' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO recommendations (candidate_id, position_id, client_id, consultant_id, recommendation_notes, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(candidate_id, position_id, position.client_id, req.user.id, recommendation_notes);

    db.prepare(`
      INSERT INTO timeline_events (recommendation_id, event_type, event_title, event_description, created_by)
      VALUES (?, 'recommendation', '创建推荐', ?, ?)
    `).run(result.lastInsertRowid, `推荐候选人到职位: ${position.title}`, req.user.id);

    res.json({ id: result.lastInsertRowid, ...req.body, client_id: position.client_id });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: '该候选人已被推荐到此职位' });
    }
    throw err;
  }
});

app.put('/api/recommendations/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status, client_feedback, candidate_response } = req.body;

  const rec = db.prepare('SELECT * FROM recommendations WHERE id = ?').get(id);
  if (!rec) {
    return res.status(404).json({ error: '推荐不存在' });
  }

  const updates = [];
  const params = [];

  if (status) {
    updates.push('status = ?');
    params.push(status);
  }
  if (client_feedback !== undefined) {
    updates.push('client_feedback = ?');
    params.push(client_feedback);
    updates.push('client_feedback_at = CURRENT_TIMESTAMP');
  }
  if (candidate_response !== undefined) {
    updates.push('candidate_response = ?');
    params.push(candidate_response);
    updates.push('candidate_response_at = CURRENT_TIMESTAMP');
  }

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    
    db.prepare(`UPDATE recommendations SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    if (status) {
      db.prepare(`
        INSERT INTO timeline_events (recommendation_id, event_type, event_title, event_description, created_by)
        VALUES (?, 'status_change', '状态变更', ?, ?)
      `).run(id, `推荐状态变更为: ${status}`, req.user.id);
    }
  }

  res.json({ id: parseInt(id), ...req.body });
});

app.post('/api/recommendations/:id/interviews', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { interview_type, interview_time, interview_location, interviewer } = req.body;

  const result = db.prepare(`
    INSERT INTO interviews (recommendation_id, interview_type, interview_time, interview_location, interviewer, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, interview_type, interview_time, interview_location, interviewer, req.user.id);

  db.prepare(`
    INSERT INTO timeline_events (recommendation_id, event_type, event_title, event_description, created_by)
    VALUES (?, 'interview', '安排面试', ?, ?)
  `).run(id, `${interview_type === 'first' ? '初试' : interview_type === 'second' ? '复试' : '终试'} - ${interview_time}`, req.user.id);

  res.json({ id: result.lastInsertRowid, recommendation_id: parseInt(id), ...req.body });
});

app.put('/api/interviews/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status, candidate_feedback, client_feedback, result, result_notes } = req.body;

  db.prepare(`
    UPDATE interviews 
    SET status = ?, candidate_feedback = ?, client_feedback = ?, result = ?, result_notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, candidate_feedback, client_feedback, result, result_notes, id);

  res.json({ id: parseInt(id), ...req.body });
});

app.post('/api/recommendations/:id/offers', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { salary, benefits, entry_time, guarantee_period } = req.body;

  const result = db.prepare(`
    INSERT INTO offers (recommendation_id, salary, benefits, entry_time, guarantee_period, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, salary, benefits, entry_time, guarantee_period || 90, req.user.id);

  db.prepare(`
    INSERT INTO timeline_events (recommendation_id, event_type, event_title, event_description, created_by)
    VALUES (?, 'offer', '发送 Offer', ?, ?)
  `).run(id, `薪资: ${salary}, 入职时间: ${entry_time}`, req.user.id);

  res.json({ id: result.lastInsertRowid, recommendation_id: parseInt(id), ...req.body });
});

app.put('/api/offers/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status, candidate_response, candidate_response_notes } = req.body;

  db.prepare(`
    UPDATE offers 
    SET status = ?, candidate_response = ?, candidate_response_notes = ?, candidate_response_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, candidate_response, candidate_response_notes, id);

  res.json({ id: parseInt(id), ...req.body });
});

app.post('/api/offers/:id/entries', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { actual_entry_time, notes } = req.body;

  const offer = db.prepare('SELECT * FROM offers WHERE id = ?').get(id);
  
  const result = db.prepare(`
    INSERT INTO entries (offer_id, actual_entry_time, status, notes)
    VALUES (?, ?, 'normal', ?)
  `).run(id, actual_entry_time, notes);

  db.prepare(`
    INSERT INTO timeline_events (recommendation_id, event_type, event_title, event_description, created_by)
    VALUES (?, 'entry', '候选人入职', ?, ?)
  `).run(offer.recommendation_id, `实际入职时间: ${actual_entry_time}`, req.user.id);

  res.json({ id: result.lastInsertRowid, offer_id: parseInt(id), actual_entry_time, notes });
});

app.put('/api/entries/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status, failure_reason, notes } = req.body;

  db.prepare(`
    UPDATE entries 
    SET status = ?, failure_reason = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, failure_reason, notes, id);

  res.json({ id: parseInt(id), ...req.body });
});

app.get('/api/commissions', authenticateToken, (req, res) => {
  const commissions = db.prepare(`
    SELECT c.*,
           r.candidate_id, r.position_id,
           ca.name as candidate_name,
           p.title as position_title,
           cl.name as client_name
    FROM commissions c
    LEFT JOIN recommendations r ON c.recommendation_id = r.id
    LEFT JOIN candidates ca ON r.candidate_id = ca.id
    LEFT JOIN positions p ON r.position_id = p.id
    LEFT JOIN clients cl ON r.client_id = cl.id
    ORDER BY c.created_at DESC
  `).all();
  res.json(commissions);
});

app.post('/api/recommendations/:id/commissions', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { total_amount, entry_id, guarantee_end_at } = req.body;

  const result = db.prepare(`
    INSERT INTO commissions (recommendation_id, total_amount, entry_id, unpaid_amount, guarantee_end_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, total_amount, entry_id, total_amount, guarantee_end_at);

  res.json({ id: result.lastInsertRowid, recommendation_id: parseInt(id), total_amount, entry_id });
});

app.put('/api/commissions/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status, stage, paid_amount } = req.body;

  const commission = db.prepare('SELECT * FROM commissions WHERE id = ?').get(id);
  const newUnpaid = commission.total_amount - (paid_amount || commission.paid_amount);

  db.prepare(`
    UPDATE commissions 
    SET status = ?, stage = ?, paid_amount = ?, unpaid_amount = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, stage, paid_amount || commission.paid_amount, newUnpaid, id);

  res.json({ id: parseInt(id), ...req.body, unpaid_amount: newUnpaid });
});

app.get('/api/users', authenticateToken, (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, email, phone, created_at FROM users ORDER BY created_at DESC').all();
  res.json(users);
});

app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const positionCount = db.prepare('SELECT COUNT(*) as count FROM positions').get();
  const candidateCount = db.prepare('SELECT COUNT(*) as count FROM candidates').get();
  const recommendationCount = db.prepare('SELECT COUNT(*) as count FROM recommendations').get();
  const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients').get();

  const consultantStats = db.prepare(`
    SELECT u.id, u.name, COUNT(r.id) as recommendation_count
    FROM users u
    LEFT JOIN recommendations r ON u.id = r.consultant_id
    WHERE u.role = 'consultant'
    GROUP BY u.id
    ORDER BY recommendation_count DESC
  `).all();

  res.json({
    positions: positionCount.count,
    candidates: candidateCount.count,
    recommendations: recommendationCount.count,
    clients: clientCount.count,
    consultantStats
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});

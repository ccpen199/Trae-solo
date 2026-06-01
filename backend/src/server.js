const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const PROJECT_DIR = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(PROJECT_DIR, '.env') });

const HOST = process.env.HOST || '127.0.0.1';
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 43454);
const BACKEND_PORT = Number(process.env.BACKEND_PORT || 53454);
const DB_PATH = path.resolve(PROJECT_DIR, process.env.DB_PATH || './backend/data/app.sqlite');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS family_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_name TEXT NOT NULL,
    child_age INTEGER NOT NULL,
    child_grade TEXT NOT NULL,
    main_problems TEXT NOT NULL,
    parent_demands TEXT NOT NULL,
    previous_consultation TEXT,
    confidentiality_authorized INTEGER NOT NULL DEFAULT 0,
    parent_id INTEGER REFERENCES users(id),
    consultant_id INTEGER REFERENCES users(id),
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL REFERENCES family_profiles(id),
    consultant_id INTEGER NOT NULL REFERENCES users(id),
    questionnaire_results TEXT,
    interview_notes TEXT,
    behavior_records TEXT,
    risk_level TEXT NOT NULL DEFAULT 'low',
    consultation_goals TEXT,
    report_content TEXT,
    reviewed_by INTEGER REFERENCES users(id),
    review_status TEXT NOT NULL DEFAULT 'pending',
    review_notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS consultation_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL REFERENCES family_profiles(id),
    assessment_id INTEGER REFERENCES assessments(id),
    consultant_id INTEGER NOT NULL REFERENCES users(id),
    supervisor_id INTEGER REFERENCES users(id),
    cycle_weeks INTEGER NOT NULL DEFAULT 8,
    service_package TEXT NOT NULL,
    phase_goals TEXT,
    homework TEXT,
    supervisor_review_status TEXT NOT NULL DEFAULT 'pending',
    supervisor_notes TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS follow_up_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL REFERENCES family_profiles(id),
    plan_id INTEGER NOT NULL REFERENCES consultation_plans(id),
    consultant_id INTEGER NOT NULL REFERENCES users(id),
    session_date TEXT NOT NULL,
    session_content TEXT NOT NULL,
    parent_feedback TEXT,
    homework_completion TEXT,
    risk_change TEXT,
    next_steps TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS satisfaction_surveys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL REFERENCES family_profiles(id),
    follow_up_id INTEGER REFERENCES follow_up_records(id),
    score INTEGER NOT NULL,
    feedback TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS renewals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL REFERENCES family_profiles(id),
    plan_id INTEGER NOT NULL REFERENCES consultation_plans(id),
    renewal_date TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

function seedDefaultUsers() {
  const existing = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (existing > 0) return;

  const insertUser = db.prepare(
    'INSERT INTO users (username, password, name, role, phone, email) VALUES (?, ?, ?, ?, ?, ?)'
  );

  const hashPassword = (pwd) => bcrypt.hashSync(pwd, 10);

  db.transaction(() => {
    insertUser.run(
      'admin',
      hashPassword('admin123'),
      '系统管理员',
      'operator',
      '13800000001',
      'admin@family-edu.com'
    );
    insertUser.run(
      'consultant1',
      hashPassword('123456'),
      '张咨询师',
      'consultant',
      '13800000002',
      'consultant1@family-edu.com'
    );
    insertUser.run(
      'supervisor1',
      hashPassword('123456'),
      '李督导',
      'supervisor',
      '13800000003',
      'supervisor1@family-edu.com'
    );
    insertUser.run(
      'parent1',
      hashPassword('123456'),
      '王家长',
      'parent',
      '13800000004',
      'parent1@family-edu.com'
    );
  })();
}

seedDefaultUsers();

const app = express();

app.use(cors({
  origin: `http://127.0.0.1:${FRONTEND_PORT}`,
  credentials: true
}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', `http://127.0.0.1:${FRONTEND_PORT}`);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '家庭教育咨询管理系统后端运行正常'
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }

  const isValid = bcrypt.compareSync(password, user.password);

  if (!isValid) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }

  const { password: _, ...userWithoutPassword } = user;
  const token = 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2);
  res.json({ data: { user: userWithoutPassword, token } });
});

app.get('/api/users', (req, res) => {
  const users = db.prepare('SELECT id, username, name, role, phone, email, created_at, updated_at FROM users ORDER BY id').all();
  res.json({ data: users });
});

app.get('/api/family-profiles', (req, res) => {
  const profiles = db.prepare(`
    SELECT fp.*,
      p.name AS parent_name,
      c.name AS consultant_name
    FROM family_profiles fp
    LEFT JOIN users p ON p.id = fp.parent_id
    LEFT JOIN users c ON c.id = fp.consultant_id
    ORDER BY fp.created_at DESC
  `).all();
  res.json({ data: profiles });
});

app.post('/api/family-profiles', (req, res) => {
  const {
    child_name, child_age, child_grade, main_problems,
    parent_demands, previous_consultation, confidentiality_authorized,
    parent_id, consultant_id, status
  } = req.body;

  if (!child_name || !child_age || !child_grade || !main_problems || !parent_demands) {
    return res.status(400).json({ error: '必填字段不能为空' });
  }

  const stmt = db.prepare(`
    INSERT INTO family_profiles (
      child_name, child_age, child_grade, main_problems,
      parent_demands, previous_consultation, confidentiality_authorized,
      parent_id, consultant_id, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    child_name, child_age, child_grade, main_problems,
    parent_demands, previous_consultation || null,
    confidentiality_authorized ? 1 : 0,
    parent_id || null, consultant_id || null,
    status || 'pending'
  );

  const profile = db.prepare('SELECT * FROM family_profiles WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ data: profile });
});

app.get('/api/family-profiles/:id', (req, res) => {
  const profile = db.prepare(`
    SELECT fp.*,
      p.name AS parent_name,
      c.name AS consultant_name
    FROM family_profiles fp
    LEFT JOIN users p ON p.id = fp.parent_id
    LEFT JOIN users c ON c.id = fp.consultant_id
    WHERE fp.id = ?
  `).get(req.params.id);

  if (!profile) {
    return res.status(404).json({ error: '家庭档案不存在' });
  }

  res.json({ data: profile });
});

app.put('/api/family-profiles/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM family_profiles WHERE id = ?').get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: '家庭档案不存在' });
  }

  const {
    child_name, child_age, child_grade, main_problems,
    parent_demands, previous_consultation, confidentiality_authorized,
    parent_id, consultant_id, status
  } = req.body;

  const stmt = db.prepare(`
    UPDATE family_profiles SET
      child_name = ?, child_age = ?, child_grade = ?, main_problems = ?,
      parent_demands = ?, previous_consultation = ?, confidentiality_authorized = ?,
      parent_id = ?, consultant_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    child_name || existing.child_name,
    child_age || existing.child_age,
    child_grade || existing.child_grade,
    main_problems || existing.main_problems,
    parent_demands || existing.parent_demands,
    previous_consultation !== undefined ? previous_consultation : existing.previous_consultation,
    confidentiality_authorized !== undefined ? (confidentiality_authorized ? 1 : 0) : existing.confidentiality_authorized,
    parent_id !== undefined ? parent_id : existing.parent_id,
    consultant_id !== undefined ? consultant_id : existing.consultant_id,
    status || existing.status,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM family_profiles WHERE id = ?').get(req.params.id);
  res.json({ data: updated });
});

app.delete('/api/family-profiles/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM family_profiles WHERE id = ?').get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: '家庭档案不存在' });
  }

  db.prepare('DELETE FROM satisfaction_surveys WHERE family_id = ?').run(req.params.id);
  db.prepare('DELETE FROM renewals WHERE family_id = ?').run(req.params.id);
  db.prepare('DELETE FROM follow_up_records WHERE family_id = ?').run(req.params.id);
  db.prepare('DELETE FROM consultation_plans WHERE family_id = ?').run(req.params.id);
  db.prepare('DELETE FROM assessments WHERE family_id = ?').run(req.params.id);
  db.prepare('DELETE FROM family_profiles WHERE id = ?').run(req.params.id);

  res.json({ message: '家庭档案已删除' });
});

app.get('/api/assessments', (req, res) => {
  const assessments = db.prepare(`
    SELECT a.*,
      fp.child_name,
      c.name AS consultant_name,
      r.name AS reviewer_name
    FROM assessments a
    JOIN family_profiles fp ON fp.id = a.family_id
    JOIN users c ON c.id = a.consultant_id
    LEFT JOIN users r ON r.id = a.reviewed_by
    ORDER BY a.created_at DESC
  `).all();
  res.json({ data: assessments });
});

app.post('/api/assessments', (req, res) => {
  const {
    family_id, consultant_id, questionnaire_results, interview_notes,
    behavior_records, risk_level, consultation_goals, report_content
  } = req.body;

  if (!family_id || !consultant_id) {
    return res.status(400).json({ error: '必填字段不能为空' });
  }

  const family = db.prepare('SELECT * FROM family_profiles WHERE id = ?').get(family_id);
  if (!family) {
    return res.status(404).json({ error: '家庭档案不存在' });
  }

  const stmt = db.prepare(`
    INSERT INTO assessments (
      family_id, consultant_id, questionnaire_results, interview_notes,
      behavior_records, risk_level, consultation_goals, report_content
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    family_id, consultant_id,
    questionnaire_results || null,
    interview_notes || null,
    behavior_records || null,
    risk_level || 'low',
    consultation_goals || null,
    report_content || null
  );

  const assessment = db.prepare('SELECT * FROM assessments WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ data: assessment });
});

app.put('/api/assessments/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM assessments WHERE id = ?').get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: '评估记录不存在' });
  }

  const {
    questionnaire_results, interview_notes, behavior_records,
    risk_level, consultation_goals, report_content,
    reviewed_by, review_status, review_notes
  } = req.body;

  const stmt = db.prepare(`
    UPDATE assessments SET
      questionnaire_results = ?, interview_notes = ?, behavior_records = ?,
      risk_level = ?, consultation_goals = ?, report_content = ?,
      reviewed_by = ?, review_status = ?, review_notes = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    questionnaire_results !== undefined ? questionnaire_results : existing.questionnaire_results,
    interview_notes !== undefined ? interview_notes : existing.interview_notes,
    behavior_records !== undefined ? behavior_records : existing.behavior_records,
    risk_level || existing.risk_level,
    consultation_goals !== undefined ? consultation_goals : existing.consultation_goals,
    report_content !== undefined ? report_content : existing.report_content,
    reviewed_by !== undefined ? reviewed_by : existing.reviewed_by,
    review_status || existing.review_status,
    review_notes !== undefined ? review_notes : existing.review_notes,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM assessments WHERE id = ?').get(req.params.id);
  res.json({ data: updated });
});

app.get('/api/consultation-plans', (req, res) => {
  const plans = db.prepare(`
    SELECT cp.*,
      fp.child_name,
      c.name AS consultant_name,
      s.name AS supervisor_name
    FROM consultation_plans cp
    JOIN family_profiles fp ON fp.id = cp.family_id
    JOIN users c ON c.id = cp.consultant_id
    LEFT JOIN users s ON s.id = cp.supervisor_id
    ORDER BY cp.created_at DESC
  `).all();
  res.json({ data: plans });
});

app.post('/api/consultation-plans', (req, res) => {
  const {
    family_id, assessment_id, consultant_id, supervisor_id,
    cycle_weeks, service_package, phase_goals, homework, status
  } = req.body;

  if (!family_id || !consultant_id || !service_package) {
    return res.status(400).json({ error: '必填字段不能为空' });
  }

  const family = db.prepare('SELECT * FROM family_profiles WHERE id = ?').get(family_id);
  if (!family) {
    return res.status(404).json({ error: '家庭档案不存在' });
  }

  const stmt = db.prepare(`
    INSERT INTO consultation_plans (
      family_id, assessment_id, consultant_id, supervisor_id,
      cycle_weeks, service_package, phase_goals, homework, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    family_id, assessment_id || null, consultant_id, supervisor_id || null,
    cycle_weeks || 8, service_package,
    phase_goals || null, homework || null,
    status || 'active'
  );

  const plan = db.prepare('SELECT * FROM consultation_plans WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ data: plan });
});

app.put('/api/consultation-plans/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM consultation_plans WHERE id = ?').get(req.params.id);

  if (!existing) {
    return res.status(404).json({ error: '咨询方案不存在' });
  }

  const {
    assessment_id, supervisor_id, cycle_weeks, service_package,
    phase_goals, homework, supervisor_review_status, supervisor_notes, status
  } = req.body;

  const stmt = db.prepare(`
    UPDATE consultation_plans SET
      assessment_id = ?, supervisor_id = ?, cycle_weeks = ?, service_package = ?,
      phase_goals = ?, homework = ?, supervisor_review_status = ?, supervisor_notes = ?,
      status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  stmt.run(
    assessment_id !== undefined ? assessment_id : existing.assessment_id,
    supervisor_id !== undefined ? supervisor_id : existing.supervisor_id,
    cycle_weeks || existing.cycle_weeks,
    service_package || existing.service_package,
    phase_goals !== undefined ? phase_goals : existing.phase_goals,
    homework !== undefined ? homework : existing.homework,
    supervisor_review_status || existing.supervisor_review_status,
    supervisor_notes !== undefined ? supervisor_notes : existing.supervisor_notes,
    status || existing.status,
    req.params.id
  );

  const updated = db.prepare('SELECT * FROM consultation_plans WHERE id = ?').get(req.params.id);
  res.json({ data: updated });
});

app.get('/api/follow-up-records', (req, res) => {
  const records = db.prepare(`
    SELECT f.*,
      fp.child_name,
      c.name AS consultant_name
    FROM follow_up_records f
    JOIN family_profiles fp ON fp.id = f.family_id
    JOIN users c ON c.id = f.consultant_id
    ORDER BY f.session_date DESC, f.created_at DESC
  `).all();
  res.json({ data: records });
});

app.post('/api/follow-up-records', (req, res) => {
  const {
    family_id, plan_id, consultant_id, session_date, session_content,
    parent_feedback, homework_completion, risk_change, next_steps
  } = req.body;

  if (!family_id || !plan_id || !consultant_id || !session_date || !session_content) {
    return res.status(400).json({ error: '必填字段不能为空' });
  }

  const family = db.prepare('SELECT * FROM family_profiles WHERE id = ?').get(family_id);
  if (!family) {
    return res.status(404).json({ error: '家庭档案不存在' });
  }

  const plan = db.prepare('SELECT * FROM consultation_plans WHERE id = ?').get(plan_id);
  if (!plan) {
    return res.status(404).json({ error: '咨询方案不存在' });
  }

  const stmt = db.prepare(`
    INSERT INTO follow_up_records (
      family_id, plan_id, consultant_id, session_date, session_content,
      parent_feedback, homework_completion, risk_change, next_steps
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    family_id, plan_id, consultant_id, session_date, session_content,
    parent_feedback || null, homework_completion || null,
    risk_change || null, next_steps || null
  );

  const record = db.prepare('SELECT * FROM follow_up_records WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ data: record });
});

app.get('/api/reports/summary', (req, res) => {
  const totalFamilies = db.prepare('SELECT COUNT(*) AS count FROM family_profiles').get().count;
  const totalAssessments = db.prepare('SELECT COUNT(*) AS count FROM assessments').get().count;
  const totalPlans = db.prepare('SELECT COUNT(*) AS count FROM consultation_plans').get().count;
  const totalFollowUps = db.prepare('SELECT COUNT(*) AS count FROM follow_up_records').get().count;
  const highRiskCases = db.prepare("SELECT COUNT(*) AS count FROM assessments WHERE risk_level IN ('high', 'very_high')").get().count;

  res.json({
    data: {
      totalFamilies,
      totalAssessments,
      totalPlans,
      totalFollowUps,
      highRiskCases
    }
  });
});

app.get('/api/reports/workload', (req, res) => {
  const workload = db.prepare(`
    SELECT
      u.id,
      u.name,
      u.role,
      COUNT(DISTINCT fp.id) AS family_count,
      COUNT(DISTINCT a.id) AS assessment_count,
      COUNT(DISTINCT cp.id) AS plan_count,
      COUNT(DISTINCT f.id) AS follow_up_count
    FROM users u
    LEFT JOIN family_profiles fp ON fp.consultant_id = u.id
    LEFT JOIN assessments a ON a.consultant_id = u.id
    LEFT JOIN consultation_plans cp ON cp.consultant_id = u.id
    LEFT JOIN follow_up_records f ON f.consultant_id = u.id
    WHERE u.role = 'consultant'
    GROUP BY u.id, u.name, u.role
    ORDER BY family_count DESC
  `).all();

  res.json({ data: workload });
});

app.get('/api/reports/renewals', (req, res) => {
  const renewals = db.prepare(`
    SELECT
      r.id,
      r.renewal_date,
      r.amount,
      r.status,
      fp.child_name,
      fp.id AS family_id
    FROM renewals r
    JOIN family_profiles fp ON fp.id = r.family_id
    ORDER BY r.renewal_date DESC
  `).all();

  const totalAmount = db.prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM renewals WHERE status = ?').get('completed')?.total || 0;
  const totalCount = db.prepare('SELECT COUNT(*) AS count FROM renewals').get().count;
  const completedCount = db.prepare("SELECT COUNT(*) AS count FROM renewals WHERE status = 'completed'").get().count;

  res.json({
    data: {
      list: renewals,
      totalAmount,
      totalCount,
      completedCount
    }
  });
});

app.get('/api/reports/satisfaction', (req, res) => {
  const surveys = db.prepare(`
    SELECT
      s.id,
      s.score,
      s.feedback,
      s.created_at,
      fp.child_name,
      fp.id AS family_id
    FROM satisfaction_surveys s
    JOIN family_profiles fp ON fp.id = s.family_id
    ORDER BY s.created_at DESC
  `).all();

  const avgScore = db.prepare('SELECT COALESCE(AVG(score), 0) AS avg FROM satisfaction_surveys').get().avg || 0;
  const totalSurveys = db.prepare('SELECT COUNT(*) AS count FROM satisfaction_surveys').get().count;
  const scoreDistribution = db.prepare(`
    SELECT score, COUNT(*) AS count
    FROM satisfaction_surveys
    GROUP BY score
    ORDER BY score DESC
  `).all();

  res.json({
    data: {
      list: surveys,
      avgScore: Number(avgScore.toFixed(2)),
      totalSurveys,
      scoreDistribution
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'not_found', message: '接口不存在' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'internal_error', message: err.message || '服务器内部错误' });
});

const server = app.listen(BACKEND_PORT, HOST, () => {
  console.log(`服务器运行在 http://${HOST}:${BACKEND_PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

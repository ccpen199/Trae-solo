import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initDatabase = () => {
  console.log('Initializing database...');

  // 先删除旧表，确保结构一致
  db.exec(`
    DROP TABLE IF EXISTS audit_logs;
    DROP TABLE IF EXISTS rule_hits;
    DROP TABLE IF EXISTS underwriting_decisions;
    DROP TABLE IF EXISTS supplement_requests;
    DROP TABLE IF EXISTS supplementary_docs;
    DROP TABLE IF EXISTS underwriting_rules;
    DROP TABLE IF EXISTS medical_histories;
    DROP TABLE IF EXISTS health_declarations;
    DROP TABLE IF EXISTS applications;
    DROP TABLE IF EXISTS users;
  `);

  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('underwriter', 'sales_support', 'medical_reviewer', 'policy_ops', 'admin')),
      email TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_no TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_id_card TEXT NOT NULL,
      customer_gender TEXT CHECK(customer_gender IN ('male', 'female')),
      customer_birth_date DATE,
      customer_phone TEXT,
      customer_email TEXT,
      customer_address TEXT,
      occupation TEXT,
      occupation_code TEXT,
      occupation_risk_level INTEGER DEFAULT 1,
      product_name TEXT NOT NULL,
      product_code TEXT NOT NULL,
      coverage_amount DECIMAL(15,2) NOT NULL,
      premium DECIMAL(15,2),
      policy_term INTEGER,
      payment_term INTEGER,
      beneficiary_name TEXT,
      beneficiary_relationship TEXT,
      beneficiary_id_card TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'underwriting', 'supplementary', 'approved', 'rated', 'excluded', 'postponed', 'rejected')),
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      assigned_to INTEGER,
      assigned_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );

    CREATE TABLE health_declarations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      question_code TEXT NOT NULL,
      question_text TEXT NOT NULL,
      answer TEXT,
      answer_details TEXT,
      has_condition INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    CREATE TABLE medical_histories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      condition_type TEXT NOT NULL,
      condition_name TEXT NOT NULL,
      diagnosis_date DATE,
      hospital_name TEXT,
      treatment_details TEXT,
      is_recovered INTEGER DEFAULT 0,
      recovery_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    CREATE TABLE underwriting_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_code TEXT UNIQUE NOT NULL,
      rule_name TEXT NOT NULL,
      rule_version TEXT NOT NULL DEFAULT '1.0',
      rule_type TEXT NOT NULL CHECK(rule_type IN ('auto_approve', 'rate', 'exclude', 'postpone', 'reject', 'manual_review')),
      risk_level INTEGER NOT NULL DEFAULT 1 CHECK(risk_level BETWEEN 1 AND 5),
      conditions JSON NOT NULL,
      actions JSON NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE rule_hits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      rule_id INTEGER NOT NULL,
      hit_reason TEXT NOT NULL,
      hit_details JSON,
      risk_level INTEGER NOT NULL,
      rule_version TEXT NOT NULL,
      hit_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
      FOREIGN KEY (rule_id) REFERENCES underwriting_rules(id)
    );

    CREATE TABLE supplementary_docs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      doc_type TEXT NOT NULL CHECK(doc_type IN ('physical_exam', 'medical_record', 'questionnaire', 'image', 'other')),
      doc_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      uploaded_by INTEGER,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      review_notes TEXT,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    );

    CREATE TABLE supplement_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      requested_by INTEGER NOT NULL,
      request_notes TEXT NOT NULL,
      required_docs JSON NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'submitted', 'completed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      responded_at DATETIME,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
      FOREIGN KEY (requested_by) REFERENCES users(id)
    );

    CREATE TABLE underwriting_decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL UNIQUE,
      decision_type TEXT NOT NULL CHECK(decision_type IN ('approve', 'rate', 'exclude', 'postpone', 'reject', 'manual_review')),
      decision_notes TEXT NOT NULL,
      rated_amount DECIMAL(15,2),
      rate_percentage DECIMAL(5,2),
      excluded_conditions TEXT,
      postponed_months INTEGER,
      decision_made_by INTEGER NOT NULL,
      decision_made_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_locked INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
      FOREIGN KEY (decision_made_by) REFERENCES users(id)
    );

    CREATE TABLE audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER,
      user_id INTEGER,
      action TEXT NOT NULL,
      action_details JSON,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX idx_applications_status ON applications(status);
    CREATE INDEX idx_applications_assigned_to ON applications(assigned_to);
    CREATE INDEX idx_applications_submitted_at ON applications(submitted_at);
    CREATE INDEX idx_health_declarations_app ON health_declarations(application_id);
    CREATE INDEX idx_rule_hits_app ON rule_hits(application_id);
    CREATE INDEX idx_supplementary_docs_app ON supplementary_docs(application_id);
    CREATE INDEX idx_supplement_requests_app ON supplement_requests(application_id);
    CREATE INDEX idx_underwriting_decisions_app ON underwriting_decisions(application_id);
    CREATE INDEX idx_audit_logs_app ON audit_logs(application_id);
    CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
  `);

  console.log('Database tables created successfully');

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  if (userCount.count === 0) {
    console.log('Seeding initial data...');
    
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, name, role, email, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertUser.run('underwriter1', 'admin123', '张核保', 'underwriter', 'zhang@insurance.com', '13800138001');
    insertUser.run('sales1', 'admin123', '李销售', 'sales_support', 'li@insurance.com', '13800138002');
    insertUser.run('doctor1', 'admin123', '王医生', 'medical_reviewer', 'wang@insurance.com', '13800138003');
    insertUser.run('ops1', 'admin123', '赵运营', 'policy_ops', 'zhao@insurance.com', '13800138004');
    insertUser.run('admin', 'admin123', '系统管理员', 'admin', 'admin@insurance.com', '13800138000');

    const insertRule = db.prepare(`
      INSERT INTO underwriting_rules (rule_code, rule_name, rule_version, rule_type, risk_level, conditions, actions, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertRule.run(
      'R001',
      '健康告知全否自动通过',
      '1.0',
      'auto_approve',
      1,
      JSON.stringify([{ type: 'all_health_no' }]),
      JSON.stringify({ action: 'approve', description: '自动通过核保' }),
      '客户健康告知全部选否，无异常记录时直接自动通过'
    );

    insertRule.run(
      'R002',
      'BMI超标加费规则',
      '1.0',
      'rate',
      2,
      JSON.stringify([{ type: 'bmi_range', value: { min: 28, max: 32 } }]),
      JSON.stringify({ action: 'rate', ratePercent: 15, description: '加费15%承保' }),
      'BMI在28-32之间，加费15%承保'
    );

    insertRule.run(
      'R003',
      '甲状腺结节除外责任',
      '1.0',
      'exclude',
      3,
      JSON.stringify([{ type: 'medical_history_contains', value: { keywords: ['甲状腺', '结节'] } }]),
      JSON.stringify({ action: 'exclude', conditions: ['甲状腺及其并发症'], description: '除外甲状腺责任后承保' }),
      '有甲状腺结节病史，除外甲状腺责任后承保'
    );

    insertRule.run(
      'R004',
      '高血压延期承保',
      '1.0',
      'postpone',
      4,
      JSON.stringify([{ type: 'medical_history_contains', value: { keywords: ['高血压', '血压'] } }]),
      JSON.stringify({ action: 'postpone', months: 6, description: '延期6个月后重新评估' }),
      '高血压病史，延期6个月后重新评估'
    );

    insertRule.run(
      'R005',
      '严重心脏病拒保',
      '1.0',
      'reject',
      5,
      JSON.stringify([{ type: 'medical_history_contains', value: { keywords: ['心脏', '心梗', '心衰', '冠心病'] } }]),
      JSON.stringify({ action: 'reject', description: '直接拒保' }),
      '严重心脏病直接拒保'
    );

    insertRule.run(
      'R006',
      '职业高风险人工复核',
      '1.0',
      'manual_review',
      3,
      JSON.stringify([{ type: 'occupation_risk', value: { min: 4 } }]),
      JSON.stringify({ action: 'manual_review', description: '转人工复核评估' }),
      '4类及以上高风险职业需要人工复核评估'
    );

    // 添加示例投保单数据
    const insertApplication = db.prepare(`
      INSERT INTO applications (
        application_no, customer_name, customer_id_card, customer_gender,
        customer_birth_date, customer_phone, customer_email, customer_address,
        occupation, occupation_code, occupation_risk_level,
        product_name, product_code, coverage_amount, premium,
        policy_term, payment_term, beneficiary_name, beneficiary_relationship,
        status, assigned_to, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertHealthDeclare = db.prepare(`
      INSERT INTO health_declarations (
        application_id, question_code, question_text, answer, has_condition
      ) VALUES (?, ?, ?, ?, ?)
    `);

    const insertMedicalHistory = db.prepare(`
      INSERT INTO medical_histories (
        application_id, condition_type, condition_name, diagnosis_date,
        hospital_name, treatment_details, is_recovered
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    // 示例1：待处理投保单
    const app1 = insertApplication.run(
      'APP202605001',
      '张三',
      '110101199001011234',
      'male',
      '1990-01-01',
      '13900001234',
      'zhangsan@example.com',
      '北京市朝阳区xxx街道',
      '软件工程师',
      'IT001',
      1,
      '重大疾病保险（尊享版）',
      'CI-001',
      500000,
      8500,
      30,
      20,
      '李四',
      '配偶',
      'pending',
      1,
      '2026-05-18 10:30:00'
    );

    // 为投保单1添加健康告知（全部选否）
    const healthQuestions = [
      { code: 'H001', text: '过去2年内是否住院或手术治疗？' },
      { code: 'H002', text: '过去1年内是否有持续服药超过1个月？' },
      { code: 'H003', text: '是否患有高血压、心脏病等心血管疾病？' },
      { code: 'H004', text: '是否患有糖尿病、甲状腺疾病等内分泌疾病？' },
      { code: 'H005', text: '是否有肿瘤、结节或肿物病史？' },
    ];

    healthQuestions.forEach(q => {
      insertHealthDeclare.run(app1.lastInsertRowid, q.code, q.text, '否', 0);
    });

    // 示例2：核保中投保单 - 有甲状腺结节
    const app2 = insertApplication.run(
      'APP202605002',
      '王五',
      '310101198505055678',
      'female',
      '1985-05-05',
      '13800005678',
      'wangwu@example.com',
      '上海市浦东新区xxx路',
      '会计师',
      'FIN001',
      1,
      '终身寿险（分红型）',
      'WL-002',
      1000000,
      12000,
      99,
      30,
      '王小明',
      '子女',
      'underwriting',
      1,
      '2026-05-17 14:20:00'
    );

    healthQuestions.forEach(q => {
      insertHealthDeclare.run(app2.lastInsertRowid, q.code, q.text, q.code === 'H004' ? '是' : '否', q.code === 'H004' ? 1 : 0);
    });

    insertMedicalHistory.run(
      app2.lastInsertRowid,
      '甲状腺结节',
      '甲状腺左侧结节',
      '2025-03-15',
      '上海市第一人民医院',
      '定期复查，无手术治疗',
      0
    );

    // 示例3：已通过投保单
    insertApplication.run(
      'APP202605003',
      '赵六',
      '440101198808089012',
      'male',
      '1988-08-08',
      '13700009012',
      'zhaoliu@example.com',
      '广州市天河区xxx路',
      '教师',
      'EDU001',
      1,
      '百万医疗保险',
      'MI-003',
      4000000,
      365,
      1,
      1,
      '无',
      '无',
      'approved',
      1,
      '2026-05-15 09:00:00'
    );

    // 示例4：待补充资料投保单
    insertApplication.run(
      'APP202605004',
      '陈七',
      '510101197512123456',
      'male',
      '1975-12-12',
      '13600003456',
      'chenqi@example.com',
      '成都市武侯区xxx路',
      '建筑工人',
      'CON001',
      4,
      '意外伤害保险',
      'AI-004',
      1000000,
      500,
      1,
      1,
      '陈八',
      '子女',
      'supplementary',
      1,
      '2026-05-16 11:30:00'
    );

    // 示例5：已拒保投保单
    insertApplication.run(
      'APP202605005',
      '刘九',
      '330101196506067890',
      'male',
      '1965-06-06',
      '13500007890',
      'liujiu@example.com',
      '杭州市西湖区xxx路',
      '退休',
      'RET001',
      2,
      '重大疾病保险（标准版）',
      'CI-005',
      300000,
      15000,
      20,
      10,
      '刘十',
      '配偶',
      'rejected',
      1,
      '2026-05-10 15:00:00'
    );

    console.log('Initial data seeded successfully');
  }

  console.log('Database initialization completed');
};

export { db, initDatabase };

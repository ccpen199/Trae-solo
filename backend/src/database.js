import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      industry TEXT,
      region TEXT,
      product_category TEXT,
      contract_amount REAL,
      risk_level TEXT DEFAULT 'medium',
      is_key_supplier INTEGER DEFAULT 0,
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questionnaires (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      questionnaire_id INTEGER,
      category TEXT NOT NULL,
      question_text TEXT NOT NULL,
      weight REAL DEFAULT 1,
      applicable_industries TEXT,
      scoring_rule TEXT,
      max_score REAL DEFAULT 10,
      requires_evidence INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (questionnaire_id) REFERENCES questionnaires(id)
    );

    CREATE TABLE IF NOT EXISTS assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL,
      questionnaire_id INTEGER NOT NULL,
      status TEXT DEFAULT 'draft',
      total_score REAL,
      risk_level TEXT,
      reviewer_id INTEGER,
      review_date TEXT,
      next_review_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (questionnaire_id) REFERENCES questionnaires(id)
    );

    CREATE TABLE IF NOT EXISTS assessment_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      answer TEXT,
      score REAL,
      has_evidence INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    );

    CREATE TABLE IF NOT EXISTS evidences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL,
      question_id INTEGER,
      type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    );

    CREATE TABLE IF NOT EXISTS rectifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL,
      question_id INTEGER,
      description TEXT NOT NULL,
      deadline TEXT,
      status TEXT DEFAULT 'pending',
      status_evidence TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    );
  `);

  const count = db.prepare('SELECT COUNT(*) as count FROM questionnaires').get();
  if (count.count === 0) {
    const insertQuestionnaire = db.prepare(`
      INSERT INTO questionnaires (name, version, description)
      VALUES (?, ?, ?)
    `);
    const result = insertQuestionnaire.run('ESG 标准问卷', 'v1.0', '覆盖环境、劳工、安全、治理、碳排和合规的标准评估问卷');
    const questionnaireId = result.lastInsertRowid;

    const insertQuestion = db.prepare(`
      INSERT INTO questions (questionnaire_id, category, question_text, weight, applicable_industries, scoring_rule, max_score, requires_evidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const questions = [
      { category: '环境', question: '是否建立了环境管理体系并通过ISO14001认证？', weight: 2, scoring: '有认证得10分，有体系无认证得5分，无体系得0分', max: 10 },
      { category: '环境', question: '是否制定了碳排放减排目标和行动计划？', weight: 2, scoring: '有量化目标和计划得10分，有计划无量化目标得5分，无计划得0分', max: 10 },
      { category: '环境', question: '近三年是否发生过重大环境污染事故？', weight: 3, scoring: '无事故得10分，一般事故得5分，重大事故得0分', max: 10 },
      { category: '劳工', question: '是否遵守最低工资标准和工作时间规定？', weight: 2, scoring: '完全合规得10分，基本合规得5分，不合规得0分', max: 10 },
      { category: '劳工', question: '是否禁止使用童工和强迫劳动？', weight: 3, scoring: '完全禁止得10分，有政策但执行不足得5分，存在问题得0分', max: 10 },
      { category: '劳工', question: '是否建立了员工申诉和反馈机制？', weight: 1, scoring: '有完善机制得10分，有基本渠道得5分，无机制得0分', max: 10 },
      { category: '安全', question: '是否建立了职业健康安全管理体系？', weight: 2, scoring: '通过认证得10分，有体系无认证得5分，无体系得0分', max: 10 },
      { category: '安全', question: '近三年是否发生过重大安全事故？', weight: 3, scoring: '无事故得10分，一般事故得5分，重大事故得0分', max: 10 },
      { category: '治理', question: '是否建立了反腐败和反贿赂政策？', weight: 2, scoring: '有完善政策和执行得10分，有基本政策得5分，无政策得0分', max: 10 },
      { category: '治理', question: '是否定期披露ESG相关信息？', weight: 1, scoring: '定期公开披露得10分，内部披露得5分，不披露得0分', max: 10 },
      { category: '碳排', question: '是否核算并披露 Scope 1 和 Scope 2 碳排放数据？', weight: 2, scoring: '完整核算披露得10分，部分核算得5分，未核算得0分', max: 10 },
      { category: '碳排', question: '是否有使用可再生能源？', weight: 1, scoring: '可再生能源占比>30%得10分，10%-30%得5分，<10%得0分', max: 10 },
      { category: '合规', question: '近三年是否存在重大违法违规行为？', weight: 3, scoring: '无违规得10分，一般违规得5分，重大违规得0分', max: 10 },
      { category: '合规', question: '是否建立了合规管理体系？', weight: 1, scoring: '有完善体系得10分，有基本制度得5分，无体系得0分', max: 10 },
    ];

    questions.forEach(q => {
      insertQuestion.run(questionnaireId, q.category, q.question, q.weight, null, q.scoring, q.max, 1);
    });

    const insertSupplier = db.prepare(`
      INSERT INTO suppliers (name, industry, region, product_category, contract_amount, risk_level, is_key_supplier, contact_name, contact_email, contact_phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleSuppliers = [
      ['华为技术有限公司', '信息技术', '华南', '通信设备', 50000000, 'low', 1, '张三', 'zhangsan@huawei.com', '13800138001'],
      ['宁德时代新能源', '制造业', '华东', '新能源电池', 80000000, 'medium', 1, '李四', 'lisi@catl.com', '13800138002'],
      ['阿里巴巴集团', '互联网', '华东', '云计算服务', 30000000, 'low', 1, '王五', 'wangwu@alibaba.com', '13800138003'],
      ['比亚迪股份', '制造业', '华南', '新能源汽车', 60000000, 'medium', 0, '赵六', 'zhaoliu@byd.com', '13800138004'],
      ['海尔集团', '制造业', '华东', '家电产品', 25000000, 'low', 0, '孙七', 'sunqi@haier.com', '13800138005'],
    ];

    sampleSuppliers.forEach(s => {
      insertSupplier.run(...s);
    });
  }
}

initDatabase();

export default db;

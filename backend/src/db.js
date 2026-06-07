import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../data/app.sqlite')

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const init = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS lawyers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      license_number TEXT UNIQUE,
      license_verified INTEGER DEFAULT 0,
      ocr_result TEXT,
      practice_years INTEGER DEFAULT 0,
      win_rate REAL DEFAULT 0,
      total_cases INTEGER DEFAULT 0,
      avg_response_time INTEGER DEFAULT 0,
      sentiment_score REAL DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lawyer_specialties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lawyer_id INTEGER,
      category TEXT NOT NULL,
      weight REAL DEFAULT 1.0,
      FOREIGN KEY (lawyer_id) REFERENCES lawyers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS consultations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      case_category TEXT,
      case_code TEXT,
      urgency TEXT DEFAULT 'normal',
      evidence_hashes TEXT,
      status TEXT DEFAULT 'pending',
      matched_lawyers TEXT,
      selected_lawyer_id INTEGER,
      client_name TEXT,
      client_contact TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (selected_lawyer_id) REFERENCES lawyers(id)
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consultation_id INTEGER,
      lawyer_id INTEGER,
      client_name TEXT NOT NULL,
      hourly_rate REAL NOT NULL,
      scope TEXT NOT NULL,
      signature_chain TEXT,
      status TEXT DEFAULT 'draft',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (consultation_id) REFERENCES consultations(id),
      FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
    );

    CREATE TABLE IF NOT EXISTS document_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      version TEXT DEFAULT '1.0',
      region_tag TEXT,
      clause_references TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS generated_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER,
      consultation_id INTEGER,
      content TEXT NOT NULL,
      format_validation TEXT,
      conflict_detection TEXT,
      generated_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (template_id) REFERENCES document_templates(id),
      FOREIGN KEY (consultation_id) REFERENCES consultations(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lawyer_id INTEGER,
      consultation_id INTEGER,
      rating INTEGER NOT NULL,
      content TEXT,
      sentiment TEXT,
      sentiment_score REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lawyer_id) REFERENCES lawyers(id),
      FOREIGN KEY (consultation_id) REFERENCES consultations(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      operator TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consultation_id INTEGER,
      sender_type TEXT NOT NULL,
      sender_id INTEGER,
      content TEXT NOT NULL,
      msg_type TEXT DEFAULT 'text',
      encryption_key TEXT,
      hash TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (consultation_id) REFERENCES consultations(id)
    );

    CREATE TABLE IF NOT EXISTS knowledge_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      category TEXT,
      frequency INTEGER DEFAULT 0,
      parent_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `)

  const tmplCount = db.prepare('SELECT COUNT(*) as cnt FROM document_templates').get().cnt
  if (tmplCount === 0) {
    const insertTmpl = db.prepare('INSERT INTO document_templates (name, type, content, version, region_tag, clause_references) VALUES (?, ?, ?, ?, ?, ?)')
    insertTmpl.run('民事起诉状模板', 'complaint', `
原告：姓名、性别、年龄、民族、职业、工作单位、住所、联系方式
被告：姓名、性别、工作单位、住所等信息
诉讼请求：
1. 请求判令被告...
2. 请求判令被告承担本案诉讼费用
事实与理由：
...
证据和证据来源，证人姓名和住所：
...
此致
XX人民法院
起诉人：XXX
XXXX年XX月XX日
    `, '1.0', '通用', '《民事诉讼法》第121条')
    insertTmpl.run('答辩状模板', 'answer', `
答辩人：姓名、性别、年龄、民族、职业、工作单位、住所、联系方式
被答辩人：姓名、性别、工作单位、住所等信息
因XX一案，现提出答辩如下：
...
此致
XX人民法院
答辩人：XXX
XXXX年XX月XX日
    `, '1.0', '通用', '《民事诉讼法》第125条')
    insertTmpl.run('委托代理合同模板', 'contract', `
甲方（委托人）：
乙方（受托人）：XX律师事务所
甲方因与XX纠纷一案，委托乙方律师代理，经双方协议，订立本合同：
一、委托事项
二、委托权限
三、律师费用
四、双方权利义务
五、合同的解除
六、违约责任
七、争议解决
甲方：  乙方：
日期：  日期：
    `, '1.0', '通用', '《律师法》第25条')
  }

  const lawyerCount = db.prepare('SELECT COUNT(*) as cnt FROM lawyers').get().cnt
  if (lawyerCount === 0) {
    const insertLawyer = db.prepare('INSERT INTO lawyers (name, license_number, license_verified, practice_years, win_rate, total_cases, avg_response_time, sentiment_score, review_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const id1 = insertLawyer.run('张明律师', '11101201510123456', 1, 9, 0.78, 156, 45, 0.85, 42).lastInsertRowid
    const id2 = insertLawyer.run('李华律师', '11101201210654321', 1, 12, 0.85, 289, 30, 0.92, 87).lastInsertRowid
    const id3 = insertLawyer.run('王芳律师', '11101201810987654', 1, 6, 0.72, 98, 60, 0.78, 28).lastInsertRowid
    const id4 = insertLawyer.run('陈伟律师', '11101201010456789', 1, 14, 0.88, 412, 25, 0.94, 156).lastInsertRowid

    const insertSpec = db.prepare('INSERT INTO lawyer_specialties (lawyer_id, category, weight) VALUES (?, ?, ?)')
    insertSpec.run(id1, '合同纠纷', 0.9)
    insertSpec.run(id1, '债权债务', 0.7)
    insertSpec.run(id1, '房产纠纷', 0.5)
    insertSpec.run(id2, '婚姻家庭', 0.95)
    insertSpec.run(id2, '继承纠纷', 0.85)
    insertSpec.run(id2, '人身损害', 0.6)
    insertSpec.run(id3, '劳动争议', 0.9)
    insertSpec.run(id3, '工伤赔偿', 0.8)
    insertSpec.run(id3, '合同纠纷', 0.5)
    insertSpec.run(id4, '刑事辩护', 0.95)
    insertSpec.run(id4, '交通事故', 0.8)
    insertSpec.run(id4, '合同纠纷', 0.7)
  }
}

init()

export default db

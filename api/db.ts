import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export async function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_card TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      face_verified INTEGER DEFAULT 0,
      bank_card_verified INTEGER DEFAULT 0,
      bank_card_number TEXT,
      bank_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tax_declarations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tax_year INTEGER NOT NULL,
      total_income DECIMAL(12,2) DEFAULT 0,
      total_tax_paid DECIMAL(12,2) DEFAULT 0,
      total_deduction DECIMAL(12,2) DEFAULT 0,
      tax_refund DECIMAL(12,2) DEFAULT 0,
      tax_supplement DECIMAL(12,2) DEFAULT 0,
      status TEXT DEFAULT 'draft',
      submitted_at DATETIME,
      reviewed_at DATETIME,
      refund_status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS special_deductions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      declaration_id INTEGER NOT NULL,
      deduction_type TEXT NOT NULL,
      amount DECIMAL(12,2) DEFAULT 0,
      details TEXT,
      start_date TEXT,
      end_date TEXT,
      verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (declaration_id) REFERENCES tax_declarations(id)
    );

    CREATE TABLE IF NOT EXISTS income_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      declaration_id INTEGER,
      income_type TEXT NOT NULL,
      payer_name TEXT,
      payer_tax_id TEXT,
      income_amount DECIMAL(12,2) NOT NULL,
      tax_withheld DECIMAL(12,2) DEFAULT 0,
      income_date TEXT NOT NULL,
      tax_year INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (declaration_id) REFERENCES tax_declarations(id)
    );

    CREATE TABLE IF NOT EXISTS appeals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      income_detail_id INTEGER,
      appeal_type TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      evidence_files TEXT,
      assigned_to INTEGER,
      processed_at DATETIME,
      processor_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tax_officers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'officer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      officer_id INTEGER,
      operation TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      request_data TEXT,
      response_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS blockchain_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_type TEXT NOT NULL,
      reference_id INTEGER NOT NULL,
      data_hash TEXT NOT NULL,
      previous_hash TEXT,
      block_number INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS policy_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      effective_date TEXT,
      affected_count INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS faq_knowledge (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category TEXT,
      tags TEXT,
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS refund_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      declaration_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      status_text TEXT,
      operator TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (declaration_id) REFERENCES tax_declarations(id)
    );
  `);

  const officerCount = db.prepare('SELECT COUNT(*) as count FROM tax_officers').get() as { count: number };
  if (officerCount.count === 0) {
    const bcrypt = await import('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO tax_officers (username, name, password_hash, role) VALUES (?, ?, ?, ?)').run(
      'admin', '系统管理员', hash, 'admin'
    );
  }

  const faqCount = db.prepare('SELECT COUNT(*) as count FROM faq_knowledge').get() as { count: number };
  if (faqCount.count === 0) {
    const insertFaq = db.prepare('INSERT INTO faq_knowledge (question, answer, category) VALUES (?, ?, ?)');
    insertFaq.run('什么是年度汇算？', '年度汇算指的是年度终了后，纳税人汇总工资薪金、劳务报酬、稿酬、特许权使用费等四项综合所得的全年收入额，减去全年的费用和扣除，得出应纳税所得额并按照综合所得年度税率表，计算全年应纳个人所得税，再减去年度内已经预缴的税款，向税务机关办理年度纳税申报并结清应退或应补税款的过程。', '基础概念');
    insertFaq.run('哪些人需要办理年度汇算？', '依据个人所得税法，需要办理年度汇算的情形主要有两类：一是已预缴税额大于年度应纳税额且申请退税的；二是综合所得收入全年超过12万元且需要补税金额超过400元的。', '申报指南');
    insertFaq.run('专项附加扣除有哪些项目？', '个人所得税专项附加扣除包括子女教育、继续教育、大病医疗、住房贷款利息、住房租金、赡养老人等6项。', '扣除项目');
  }
}

export default db;

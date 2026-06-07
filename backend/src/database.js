import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS insured_persons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_card TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      gender TEXT,
      birthday TEXT,
      face_feature_vector TEXT,
      bio_hash TEXT,
      social_security_agency_code TEXT,
      region TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS certification_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      insured_person_id INTEGER NOT NULL,
      task_type TEXT NOT NULL,
      valid_until TEXT,
      retry_strategy TEXT DEFAULT '{"maxRetries":3,"interval":3600}',
      cross_province_check INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      result TEXT,
      blockchain_hash TEXT,
      location TEXT,
      device_info TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT,
      FOREIGN KEY (insured_person_id) REFERENCES insured_persons(id)
    );

    CREATE TABLE IF NOT EXISTS payment_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      insured_person_id INTEGER NOT NULL,
      order_no TEXT UNIQUE NOT NULL,
      insurance_type TEXT NOT NULL,
      year_grade TEXT,
      amount REAL NOT NULL,
      government_subsidy REAL DEFAULT 0,
      subsidy_flag INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      tax_bureau_code TEXT,
      payment_method TEXT,
      paid_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (insured_person_id) REFERENCES insured_persons(id)
    );

    CREATE TABLE IF NOT EXISTS wallet_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      insured_person_id INTEGER NOT NULL,
      account_no TEXT UNIQUE NOT NULL,
      custodian TEXT NOT NULL,
      balance REAL DEFAULT 0,
      t0_redemption_rule TEXT DEFAULT '{"dailyLimit":50000,"minAmount":100}',
      yield_carryover_logic TEXT DEFAULT '{"frequency":"daily","settlementDay":1}',
      status TEXT DEFAULT 'active',
      last_settlement_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (insured_person_id) REFERENCES insured_persons(id)
    );

    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      balance_after REAL,
      counterpart TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (wallet_id) REFERENCES wallet_accounts(id)
    );

    CREATE TABLE IF NOT EXISTS electronic_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      insured_person_id INTEGER NOT NULL,
      card_no TEXT UNIQUE NOT NULL,
      issue_date TEXT,
      valid_until TEXT,
      status TEXT DEFAULT 'active',
      qr_code TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (insured_person_id) REFERENCES insured_persons(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS offline_packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version TEXT NOT NULL,
      region_code TEXT,
      package_data BLOB,
      checksum TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      region TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS review_workflows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      task_type TEXT NOT NULL,
      current_level INTEGER DEFAULT 1,
      status TEXT DEFAULT 'pending',
      reviewer_id INTEGER,
      review_comment TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS abnormal_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_type TEXT NOT NULL,
      insured_person_id INTEGER,
      description TEXT,
      severity TEXT DEFAULT 'warning',
      status TEXT DEFAULT 'open',
      location TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS reconciliation_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_date TEXT NOT NULL,
      custodian TEXT NOT NULL,
      system_balance REAL NOT NULL,
      bank_balance REAL NOT NULL,
      difference REAL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
  if (adminCount.count === 0) {
    db.prepare(`
      INSERT INTO admin_users (username, password, role, region)
      VALUES (?, ?, ?, ?)
    `).run('admin', 'admin123', 'super', 'national');
  }

  const insuredCount = db.prepare('SELECT COUNT(*) as count FROM insured_persons').get();
  if (insuredCount.count === 0) {
    const samplePersons = [
      { id_card: '110101199001011234', name: '张三', gender: '男', birthday: '1990-01-01', region: '北京市', social_security_agency_code: 'BJ101' },
      { id_card: '310101198505155678', name: '李四', gender: '女', birthday: '1985-05-15', region: '上海市', social_security_agency_code: 'SH101' },
      { id_card: '440101197812209012', name: '王五', gender: '男', birthday: '1978-12-20', region: '广州市', social_security_agency_code: 'GZ101' },
    ];

    const insertPerson = db.prepare(`
      INSERT INTO insured_persons (id_card, name, gender, birthday, face_feature_vector, bio_hash, social_security_agency_code, region)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    samplePersons.forEach(person => {
      insertPerson.run(
        person.id_card,
        person.name,
        person.gender,
        person.birthday,
        JSON.stringify([0.1, 0.2, 0.3, 0.4, 0.5]),
        'hash_' + person.id_card,
        person.social_security_agency_code,
        person.region
      );
    });
  }
}

initDatabase();

export default db;

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS competitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      official_website TEXT,
      app_store_url TEXT,
      status TEXT DEFAULT 'active',
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS competitor_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competitor_id INTEGER NOT NULL,
      version TEXT,
      features TEXT,
      pricing_info TEXT,
      source_url TEXT,
      snapshot_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competitor_id INTEGER NOT NULL,
      plan_name TEXT NOT NULL,
      price REAL NOT NULL,
      currency TEXT DEFAULT 'CNY',
      price_unit TEXT,
      change_type TEXT,
      previous_price REAL,
      source_url TEXT,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competitor_id INTEGER NOT NULL,
      source TEXT,
      rating REAL,
      content TEXT,
      reviewer TEXT,
      review_date DATETIME,
      sentiment TEXT,
      is_noise INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS feature_comparisons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feature_name TEXT NOT NULL,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS competitor_features (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competitor_id INTEGER NOT NULL,
      feature_id INTEGER NOT NULL,
      has_feature INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE CASCADE,
      FOREIGN KEY (feature_id) REFERENCES feature_comparisons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS crawl_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      competitor_id INTEGER,
      task_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      target_url TEXT,
      result TEXT,
      error_message TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      started_at DATETIME,
      completed_at DATETIME,
      FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS task_workflow (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      operator TEXT NOT NULL,
      reason TEXT,
      previous_status TEXT,
      new_status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES crawl_tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS config_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_type TEXT NOT NULL,
      rule_name TEXT NOT NULL,
      rule_value TEXT,
      owner TEXT,
      permission TEXT,
      valid_from DATETIME,
      valid_to DATETIME,
      is_enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      display_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      related_type TEXT NOT NULL,
      related_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT,
      file_size INTEGER,
      uploaded_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS analysis_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      report_type TEXT,
      content TEXT,
      recommendations TEXT,
      generated_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const insertUser = db.prepare('INSERT INTO users (username, role, display_name) VALUES (?, ?, ?)');
    insertUser.run('admin', 'business_owner', '业务负责人');
    insertUser.run('operator', 'model_operator', '模型运营');
    insertUser.run('auditor', 'auditor', '审核人员');
    insertUser.run('user', 'frontline_user', '一线使用者');
  }

  const ruleCount = db.prepare('SELECT COUNT(*) as count FROM config_rules').get();
  if (ruleCount.count === 0) {
    const insertRule = db.prepare(`
      INSERT INTO config_rules (rule_type, rule_name, rule_value, owner, permission, is_enabled)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertRule.run('category', 'AI大模型', '大语言模型,多模态,代码生成', 'admin', 'business_owner', 1);
    insertRule.run('category', 'AI图像', '图像生成,图像编辑,风格迁移', 'admin', 'business_owner', 1);
    insertRule.run('crawl_frequency', '默认抓取频率', 'daily', 'operator', 'model_operator', 1);
  }
};

initTables();

export default db;

import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS data_catalogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    description TEXT,
    update_frequency TEXT NOT NULL,
    department_id INTEGER NOT NULL,
    share_level TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    version INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id)
  );

  CREATE TABLE IF NOT EXISTS data_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    catalog_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    desensitization_rule TEXT,
    is_required INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (catalog_id) REFERENCES data_catalogs(id)
  );

  CREATE TABLE IF NOT EXISTS catalog_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    catalog_id INTEGER NOT NULL,
    version INTEGER NOT NULL,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    description TEXT,
    update_frequency TEXT NOT NULL,
    department_id INTEGER NOT NULL,
    share_level TEXT NOT NULL,
    change_log TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (catalog_id) REFERENCES data_catalogs(id)
  );

  CREATE TABLE IF NOT EXISTS access_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    catalog_id INTEGER NOT NULL,
    applicant_department_id INTEGER NOT NULL,
    use_case TEXT NOT NULL,
    field_scope TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    approver_id INTEGER,
    approval_opinion TEXT,
    approved_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (catalog_id) REFERENCES data_catalogs(id),
    FOREIGN KEY (applicant_department_id) REFERENCES departments(id)
  );

  CREATE TABLE IF NOT EXISTS api_calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    catalog_id INTEGER NOT NULL,
    caller_department_id INTEGER NOT NULL,
    application_id INTEGER,
    call_time TEXT DEFAULT CURRENT_TIMESTAMP,
    data_count INTEGER DEFAULT 0,
    status TEXT NOT NULL,
    error_message TEXT,
    is_alert INTEGER DEFAULT 0,
    FOREIGN KEY (catalog_id) REFERENCES data_catalogs(id),
    FOREIGN KEY (caller_department_id) REFERENCES departments(id),
    FOREIGN KEY (application_id) REFERENCES access_applications(id)
  );

  CREATE TABLE IF NOT EXISTS data_quality (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    catalog_id INTEGER NOT NULL,
    missing_rate REAL DEFAULT 0,
    update_delay INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    issue_description TEXT,
    assignee_department_id INTEGER,
    status TEXT DEFAULT 'normal',
    checked_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (catalog_id) REFERENCES data_catalogs(id),
    FOREIGN KEY (assignee_department_id) REFERENCES departments(id)
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    operator TEXT,
    department_id INTEGER,
    target_type TEXT,
    target_id INTEGER,
    details TEXT,
    ip_address TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id)
  );

  CREATE TABLE IF NOT EXISTS security_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    api_call_id INTEGER,
    description TEXT NOT NULL,
    severity TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'open',
    handled_by TEXT,
    handled_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (api_call_id) REFERENCES api_calls(id)
  );
`);

const deptCount = db.prepare('SELECT COUNT(*) as count FROM departments').get() as { count: number };
if (deptCount.count === 0) {
  const insertDept = db.prepare('INSERT INTO departments (name, code, type) VALUES (?, ?, ?)');
  insertDept.run('市公安局', 'GA001', 'provider');
  insertDept.run('市人社局', 'RS001', 'provider');
  insertDept.run('市卫健委', 'WJ001', 'provider');
  insertDept.run('市教育局', 'JY001', 'consumer');
  insertDept.run('市民政局', 'MZ001', 'consumer');
  insertDept.run('平台管理部', 'ADMIN', 'admin');
}

const catalogCount = db.prepare('SELECT COUNT(*) as count FROM data_catalogs').get() as { count: number };
if (catalogCount.count === 0) {
  const insertCatalog = db.prepare(`
    INSERT INTO data_catalogs (title, topic, description, update_frequency, department_id, share_level)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertField = db.prepare(`
    INSERT INTO data_fields (catalog_id, name, type, description, desensitization_rule, is_required)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const catalogId1 = insertCatalog.run('常住人口基本信息', '人口户籍', '全市常住人口基础信息数据', 'daily', 1, 'conditional').lastInsertRowid as number;
  insertField.run(catalogId1, '姓名', 'string', '人员姓名', 'mask_name', 1);
  insertField.run(catalogId1, '身份证号', 'string', '居民身份证号码', 'mask_idcard', 1);
  insertField.run(catalogId1, '性别', 'string', '性别', null, 0);
  insertField.run(catalogId1, '户籍地址', 'string', '户籍所在地地址', 'mask_address', 0);

  const catalogId2 = insertCatalog.run('社会保险参保信息', '社会保障', '职工社会保险参保缴费信息', 'weekly', 2, 'conditional').lastInsertRowid as number;
  insertField.run(catalogId2, '个人编号', 'string', '社保个人编号', null, 1);
  insertField.run(catalogId2, '身份证号', 'string', '居民身份证号码', 'mask_idcard', 1);
  insertField.run(catalogId2, '参保状态', 'string', '当前参保状态', null, 0);
  insertField.run(catalogId2, '缴费基数', 'number', '社保缴费基数', null, 0);

  const insertQuality = db.prepare(`
    INSERT INTO data_quality (catalog_id, missing_rate, update_delay, failure_count, assignee_department_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertQuality.run(catalogId1, 0.02, 0, 0, 1);
  insertQuality.run(catalogId2, 0.05, 1, 2, 2);
}

console.log('数据库初始化完成');
db.close();

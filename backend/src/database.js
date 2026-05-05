import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../data/app.sqlite');
const dataDir = dirname(dbPath);

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

let db = null;

const initDatabase = async () => {
  const SQL = await initSqlJs();
  
  if (existsSync(dbPath)) {
    const fileBuffer = readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
    console.log('已加载现有的 SQLite 数据库');
  } else {
    db = new SQL.Database();
    console.log('已创建新的 SQLite 数据库');
    createTables();
    insertInitialData();
    saveDatabase();
  }
};

const createTables = () => {
  db.run(`
    CREATE TABLE roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      department TEXT,
      role_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    )
  `);

  db.run(`
    CREATE TABLE expense_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      code TEXT,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE expense_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_no TEXT UNIQUE NOT NULL,
      applicant_id INTEGER NOT NULL,
      project_id INTEGER,
      expense_type_id INTEGER,
      amount REAL NOT NULL DEFAULT 0,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      current_step TEXT DEFAULT 'submit',
      approver_id INTEGER,
      reviewer_id INTEGER,
      submit_at DATETIME,
      archived_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (applicant_id) REFERENCES users(id),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (expense_type_id) REFERENCES expense_types(id),
      FOREIGN KEY (approver_id) REFERENCES users(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE approval_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      approver_id INTEGER NOT NULL,
      step TEXT NOT NULL,
      action TEXT NOT NULL,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES expense_applications(id),
      FOREIGN KEY (approver_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE cc_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      is_read INTEGER DEFAULT 0,
      read_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES expense_applications(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT,
      file_size INTEGER,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES expense_applications(id)
    )
  `);

  db.run(`
    CREATE TABLE archive_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      archiver_id INTEGER NOT NULL,
      archive_no TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES expense_applications(id),
      FOREIGN KEY (archiver_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE form_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      config TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

const insertInitialData = () => {
  db.run(`INSERT INTO roles (name, description) VALUES (?, ?)`, ['employee', '普通员工']);
  db.run(`INSERT INTO roles (name, description) VALUES (?, ?)`, ['approver', '业务员审批']);
  db.run(`INSERT INTO roles (name, description) VALUES (?, ?)`, ['finance', '财务复核']);
  db.run(`INSERT INTO roles (name, description) VALUES (?, ?)`, ['admin', '管理员']);

  const salt = bcrypt.genSaltSync(10);
  const password = bcrypt.hashSync('123456', salt);

  db.run(`INSERT INTO users (username, password, name, email, department, role_id) VALUES (?, ?, ?, ?, ?, ?)`, 
    ['admin', password, '系统管理员', 'admin@example.com', '系统部', 4]);
  db.run(`INSERT INTO users (username, password, name, email, department, role_id) VALUES (?, ?, ?, ?, ?, ?)`, 
    ['employee1', password, '张三', 'zhangsan@example.com', '市场部', 1]);
  db.run(`INSERT INTO users (username, password, name, email, department, role_id) VALUES (?, ?, ?, ?, ?, ?)`, 
    ['employee2', password, '李四', 'lisi@example.com', '技术部', 1]);
  db.run(`INSERT INTO users (username, password, name, email, department, role_id) VALUES (?, ?, ?, ?, ?, ?)`, 
    ['approver1', password, '王经理', 'wangjl@example.com', '市场部', 2]);
  db.run(`INSERT INTO users (username, password, name, email, department, role_id) VALUES (?, ?, ?, ?, ?, ?)`, 
    ['finance1', password, '赵会计', 'zhaokj@example.com', '财务部', 3]);

  db.run(`INSERT INTO expense_types (name, description) VALUES (?, ?)`, ['差旅费', '出差相关费用']);
  db.run(`INSERT INTO expense_types (name, description) VALUES (?, ?)`, ['招待费', '客户招待费用']);
  db.run(`INSERT INTO expense_types (name, description) VALUES (?, ?)`, ['办公费', '办公用品采购']);
  db.run(`INSERT INTO expense_types (name, description) VALUES (?, ?)`, ['交通费', '市内交通费用']);
  db.run(`INSERT INTO expense_types (name, description) VALUES (?, ?)`, ['通讯费', '电话、网络费用']);

  db.run(`INSERT INTO projects (name, code, description) VALUES (?, ?, ?)`, ['年度市场推广', 'PRJ-2024-001', '2024年度市场推广项目']);
  db.run(`INSERT INTO projects (name, code, description) VALUES (?, ?, ?)`, ['产品研发', 'PRJ-2024-002', '新产品研发项目']);
  db.run(`INSERT INTO projects (name, code, description) VALUES (?, ?, ?)`, ['客户服务', 'PRJ-2024-003', '客户服务与支持']);

  const now = new Date().toISOString();
  
  db.run(`INSERT INTO expense_applications 
    (application_no, applicant_id, project_id, expense_type_id, amount, description, status, current_step, approver_id, submit_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    ['EXP-20240501-0001', 2, 1, 1, 1500.00, '去北京参加行业展会差旅费', 'approving', 'approver', 4, now, now]);
  
  db.run(`INSERT INTO cc_records (application_id, user_id, created_at) VALUES (?, ?, ?)`, [1, 4, now]);
  db.run(`INSERT INTO cc_records (application_id, user_id, created_at) VALUES (?, ?, ?)`, [1, 5, now]);

  db.run(`INSERT INTO expense_applications 
    (application_no, applicant_id, project_id, expense_type_id, amount, description, status, current_step, approver_id, submit_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    ['EXP-20240502-0002', 3, 2, 3, 350.50, '采购办公用品：打印纸、文件夹等', 'submitted', 'approver', 4, now, now]);
  
  db.run(`INSERT INTO cc_records (application_id, user_id, created_at) VALUES (?, ?, ?)`, [2, 4, now]);

  db.run(`INSERT INTO expense_applications 
    (application_no, applicant_id, project_id, expense_type_id, amount, description, status, current_step, approver_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    ['EXP-20240503-0003', 2, 1, 2, 800.00, '请客户吃饭招待费（草稿）', 'draft', 'submit', 4, now]);

  db.run(`INSERT INTO expense_applications 
    (application_no, applicant_id, project_id, expense_type_id, amount, description, status, current_step, approver_id, submit_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    ['EXP-20240504-0004', 2, 3, 4, 200.00, '客户现场服务交通费', 'approved', 'complete', 4, now, now]);
  
  db.run(`INSERT INTO cc_records (application_id, user_id, created_at) VALUES (?, ?, ?)`, [4, 4, now]);

  db.run(`INSERT INTO approval_records (application_id, approver_id, step, action, comment, created_at)
    VALUES (?, ?, ?, ?, ?, ?)`, [4, 4, 'approver', 'approve', '情况属实，同意报销', now]);
};

const saveDatabase = () => {
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(dbPath, buffer);
};

await initDatabase();

export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      db.run(sql, params);
      saveDatabase();
      const lastIDResult = db.exec('SELECT last_insert_rowid() as lastID');
      const lastID = lastIDResult.length > 0 ? lastIDResult[0].values[0][0] : 0;
      resolve({ lastID, changes: 1 });
    } catch (error) {
      reject(error);
    }
  });
};

export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      const result = db.exec(sql, params);
      if (result.length === 0 || result[0].values.length === 0) {
        resolve(undefined);
      } else {
        const columns = result[0].columns;
        const values = result[0].values[0];
        const row = {};
        columns.forEach((col, idx) => {
          row[col] = values[idx];
        });
        resolve(row);
      }
    } catch (error) {
      reject(error);
    }
  });
};

export const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      const result = db.exec(sql, params);
      if (result.length === 0) {
        resolve([]);
      } else {
        const columns = result[0].columns;
        const rows = result[0].values.map(values => {
          const row = {};
          columns.forEach((col, idx) => {
            row[col] = values[idx];
          });
          return row;
        });
        resolve(rows);
      }
    } catch (error) {
      reject(error);
    }
  });
};

export default db;

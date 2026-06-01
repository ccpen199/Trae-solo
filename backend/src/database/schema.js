const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const Database = require('better-sqlite3');
const { hashPassword } = require('../utils/encryption');

const DB_PATH = path.join(__dirname, '../../data/vault.db');

let db;

function initDatabase() {
  const fs = require('fs');
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      department TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      last_login_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
      description TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(team_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      username TEXT,
      encrypted_password TEXT,
      encrypted_token TEXT,
      encrypted_certificate TEXT,
      connection_string TEXT,
      hostname TEXT,
      port INTEGER,
      database_name TEXT,
      notes TEXT,
      expires_at DATETIME,
      last_rotated_at DATETIME,
      rotation_period_days INTEGER DEFAULT 90,
      created_by INTEGER REFERENCES users(id),
      is_frozen INTEGER DEFAULT 0,
      frozen_at DATETIME,
      frozen_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS credential_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      credential_id INTEGER REFERENCES credentials(id) ON DELETE CASCADE,
      filename TEXT NOT NULL,
      file_type TEXT,
      file_size INTEGER,
      file_path TEXT NOT NULL,
      uploaded_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS access_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      credential_id INTEGER REFERENCES credentials(id) ON DELETE CASCADE,
      requester_id INTEGER REFERENCES users(id),
      approver_id INTEGER REFERENCES users(id),
      reason TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT 'view',
      status TEXT NOT NULL DEFAULT 'pending',
      expires_at DATETIME NOT NULL,
      approved_at DATETIME,
      denied_at DATETIME,
      deny_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS access_grants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      credential_id INTEGER REFERENCES credentials(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      granted_by INTEGER REFERENCES users(id),
      role TEXT NOT NULL DEFAULT 'viewer',
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(credential_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id INTEGER,
      ip_address TEXT,
      user_agent TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS credential_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      credential_id INTEGER REFERENCES credentials(id) ON DELETE CASCADE,
      viewer_id INTEGER REFERENCES users(id),
      request_id INTEGER REFERENCES access_requests(id),
      view_type TEXT NOT NULL,
      copied INTEGER DEFAULT 0,
      watermark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rotation_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      credential_id INTEGER REFERENCES credentials(id) ON DELETE CASCADE,
      reminder_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      message TEXT NOT NULL,
      is_resolved INTEGER DEFAULT 0,
      resolved_at DATETIME,
      resolved_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS security_incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_type TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      reported_by INTEGER REFERENCES users(id),
      assigned_to INTEGER REFERENCES users(id),
      resolved_at DATETIME,
      resolution_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS incident_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER REFERENCES security_incidents(id) ON DELETE CASCADE,
      credential_id INTEGER REFERENCES credentials(id) ON DELETE CASCADE,
      impact_level TEXT NOT NULL,
      notes TEXT,
      UNIQUE(incident_id, credential_id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_credentials_project ON credentials(project_id);
    CREATE INDEX IF NOT EXISTS idx_credentials_type ON credentials(type);
    CREATE INDEX IF NOT EXISTS idx_access_requests_credential ON access_requests(credential_id);
    CREATE INDEX IF NOT EXISTS idx_access_requests_requester ON access_requests(requester_id);
    CREATE INDEX IF NOT EXISTS idx_access_grants_credential ON access_grants(credential_id);
    CREATE INDEX IF NOT EXISTS idx_access_grants_user ON access_grants(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_credential_views_credential ON credential_views(credential_id);
    CREATE INDEX IF NOT EXISTS idx_rotation_reminders_credential ON rotation_reminders(credential_id);
  `);

  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const adminHash = hashPassword('Admin@123');
    db.prepare(`
      INSERT INTO users (username, email, password_hash, role, department, status)
      VALUES (?, ?, ?, 'admin', '安全部', 'active')
    `).run('admin', 'admin@company.com', adminHash);

    const userHash = hashPassword('User@123');
    db.prepare(`
      INSERT INTO users (username, email, password_hash, role, department, status)
      VALUES (?, ?, ?, 'user', '研发部', 'active')
    `).run('devops', 'devops@company.com', userHash);

    db.prepare(`
      INSERT INTO users (username, email, password_hash, role, department, status)
      VALUES (?, ?, ?, 'user', '运维部', 'active')
    `).run('developer', 'developer@company.com', userHash);

    db.prepare(`
      INSERT INTO teams (name, description, created_by)
      VALUES ('技术平台部', '负责基础架构和平台服务', 1)
    `).run();

    db.prepare(`
      INSERT INTO projects (name, team_id, description, created_by)
      VALUES ('生产环境', 1, '线上生产环境凭据', 1)
    `).run();

    db.prepare(`
      INSERT INTO projects (name, team_id, description, created_by)
      VALUES ('测试环境', 1, '测试环境凭据', 1)
    `).run();

    db.prepare(`
      INSERT INTO team_members (team_id, user_id, role)
      VALUES (1, 1, 'admin'), (1, 2, 'member'), (1, 3, 'member')
    `).run();

    const { encrypt } = require('../utils/encryption');
    const masterKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

    const insertCred = db.prepare(`
      INSERT INTO credentials (title, type, project_id, username, encrypted_password, encrypted_token, encrypted_certificate, hostname, port, database_name, notes, expires_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertCred.run(
      '生产数据库主账号', 'database', 1, 'root', encrypt('ProdDB@2024!', masterKey),
      null, null, 'prod-db.company.com', 3306, 'production', 'MySQL生产环境主库管理员账号', '2026-06-30 23:59:59', 1
    );
    insertCred.run(
      '阿里云API密钥', 'api_token', 1, 'LTAI5t7nKpQ', null,
      encrypt('AKIAIOSFODNN7EXAMPLE', masterKey), null, null, null, null, '阿里云OSS和CDN访问密钥', '2026-08-15 23:59:59', 1
    );
    insertCred.run(
      'GitLab管理员Token', 'api_token', 1, 'gitlab-admin', null,
      encrypt('glpat-abcdefghijklmnopqrst', masterKey), null, null, null, null, 'GitLab CI/CD流水线访问令牌', '2026-05-20 23:59:59', 1
    );
    insertCred.run(
      '测试环境Redis密码', 'password', 2, '', encrypt('weak123', masterKey),
      null, null, 'redis-test.company.com', 6379, null, '测试环境Redis缓存密码', null, 2
    );
    insertCred.run(
      'Jenkins登录账号', 'account', 2, 'jenkins-admin', encrypt('Jenkins@2024', masterKey),
      null, null, null, null, null, 'CI/CD服务器登录账号', '2026-07-01 23:59:59', 2
    );
    insertCred.run(
      'SSL证书私钥', 'certificate', 1, '', null,
      null, encrypt('-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7...', masterKey),
      null, null, null, '*.company.com通配符证书私钥', '2026-12-31 23:59:59', 1
    );

    db.prepare(`
      INSERT INTO access_requests (credential_id, requester_id, reason, status, expires_at)
      VALUES (1, 2, '需要查询生产数据库数据', 'approved', datetime('now', '+7 days'))
    `).run();

    db.prepare(`
      INSERT INTO access_grants (credential_id, user_id, granted_by, expires_at)
      VALUES (1, 2, 1, datetime('now', '+7 days'))
    `).run();

    db.prepare(`
      INSERT INTO rotation_reminders (credential_id, reminder_type, severity, message, is_resolved)
      VALUES (3, 'expiring', 'critical', 'GitLab管理员Token即将过期', 0),
             (4, 'weak_password', 'high', 'Redis密码强度较弱', 0),
             (1, 'expiring_soon', 'medium', '生产数据库密码30天后过期', 0)
    `).run();

    db.prepare(`
      INSERT INTO security_incidents (title, incident_type, severity, status, description, reported_by)
      VALUES ('疑似代码仓库泄露', 'leak_suspected', 'high', 'open', '在公开GitHub仓库发现疑似内部密钥片段', 1),
             ('高频异常查看', 'abnormal_view', 'medium', 'investigating', '用户developer在非工作时间查看5个敏感凭据', 1)
    `).run();

    db.prepare(`
      INSERT INTO incident_credentials (incident_id, credential_id, impact_level)
      VALUES (1, 1, 'high'), (1, 2, 'high'), (1, 3, 'medium'),
             (2, 1, 'medium'), (2, 3, 'low'), (2, 5, 'medium')
    `).run();

    db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
      VALUES (1, 'login', 'user', 1, '登录系统', '192.168.1.100'),
             (1, 'create_credential', 'credential', 1, '创建生产数据库主账号', '192.168.1.100'),
             (2, 'view_credential', 'credential', 1, '查看生产数据库密码(含水印)', '192.168.1.101'),
             (3, 'copy_value', 'credential', 3, '复制GitLab Token', '192.168.1.102')
    `).run();
  }

  return db;
}

function getDb() {
  if (!db) {
    db = initDatabase();
  }
  return db;
}

module.exports = { initDatabase, getDb };

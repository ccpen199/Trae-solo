const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db = null;
let dbFilePath = null;

const initializeDatabase = async () => {
  const SQL = await initSqlJs();
  dbFilePath = path.resolve(process.env.DB_PATH || './data/app.sqlite');
  
  const dir = path.dirname(dbFilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(dbFilePath)) {
    const fileBuffer = fs.readFileSync(dbFilePath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    initializeSchema(db);
    saveDatabase();
  }
  
  return db;
};

const initializeSchema = (db) => {
  db.run(`
    CREATE TABLE organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      type TEXT DEFAULT 'department',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES organizations(id)
    )
  `);

  db.run(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT,
      phone TEXT,
      password_hash TEXT NOT NULL,
      real_name TEXT,
      status TEXT DEFAULT 'pending',
      organization_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login_at TEXT,
      mfa_enabled INTEGER DEFAULT 0,
      mfa_secret TEXT,
      FOREIGN KEY (organization_id) REFERENCES organizations(id)
    )
  `);

  db.run(`
    CREATE TABLE roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      type TEXT DEFAULT 'custom',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE permissions (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      resource_type TEXT,
      action TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE role_permissions (
      id TEXT PRIMARY KEY,
      role_id TEXT NOT NULL,
      permission_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id),
      FOREIGN KEY (permission_id) REFERENCES permissions(id),
      UNIQUE(role_id, permission_id)
    )
  `);

  db.run(`
    CREATE TABLE user_roles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      assigned_by TEXT,
      assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (role_id) REFERENCES roles(id),
      UNIQUE(user_id, role_id)
    )
  `);

  db.run(`
    CREATE TABLE abac_policies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      conditions TEXT NOT NULL,
      effect TEXT DEFAULT 'allow',
      resource_type TEXT,
      action TEXT,
      priority INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE login_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      location TEXT,
      device_fingerprint TEXT,
      risk_score INTEGER DEFAULT 0,
      mfa_verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT,
      revoked_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE login_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      username TEXT,
      ip_address TEXT,
      user_agent TEXT,
      location TEXT,
      device_fingerprint TEXT,
      login_result TEXT,
      failure_reason TEXT,
      risk_score INTEGER,
      mfa_used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      username TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      risk_level TEXT DEFAULT 'low',
      fingerprint TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE access_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      action TEXT,
      access_result TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE external_applications (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      client_id TEXT NOT NULL UNIQUE,
      client_secret_hash TEXT NOT NULL,
      redirect_uris TEXT,
      logout_url TEXT,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE application_access (
      id TEXT PRIMARY KEY,
      application_id TEXT NOT NULL,
      user_id TEXT,
      role_id TEXT,
      access_type TEXT DEFAULT 'role',
      granted_at TEXT DEFAULT CURRENT_TIMESTAMP,
      granted_by TEXT,
      FOREIGN KEY (application_id) REFERENCES external_applications(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (role_id) REFERENCES roles(id)
    )
  `);

  db.run(`
    CREATE TABLE position_changes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      old_organization_id TEXT,
      new_organization_id TEXT,
      old_roles TEXT,
      new_roles TEXT,
      changed_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (old_organization_id) REFERENCES organizations(id),
      FOREIGN KEY (new_organization_id) REFERENCES organizations(id)
    )
  `);

  db.run(`
    CREATE TABLE mfa_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      code TEXT NOT NULL,
      type TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  const { v4: uuidv4 } = require('uuid');
  const bcrypt = require('bcryptjs');

  const adminRoleId = uuidv4();
  const employeeRoleId = uuidv4();
  const auditorRoleId = uuidv4();
  const appManagerRoleId = uuidv4();

  db.run(`
    INSERT INTO roles (id, name, description, type) VALUES (?, ?, ?, 'system')
  `, [adminRoleId, 'organization_admin', '组织管理员 - 管理组织架构、用户、权限']);
  
  db.run(`
    INSERT INTO roles (id, name, description, type) VALUES (?, ?, ?, 'system')
  `, [employeeRoleId, 'employee', '普通员工 - 基础访问权限']);
  
  db.run(`
    INSERT INTO roles (id, name, description, type) VALUES (?, ?, ?, 'system')
  `, [auditorRoleId, 'security_auditor', '安全审计员 - 审计日志查看和监控']);
  
  db.run(`
    INSERT INTO roles (id, name, description, type) VALUES (?, ?, ?, 'system')
  `, [appManagerRoleId, 'external_app_manager', '外部应用管理员 - 管理外部应用接入']);

  const permissions = [
    { code: 'org:read', name: '查看组织架构', resource_type: 'organization', action: 'read' },
    { code: 'org:write', name: '管理组织架构', resource_type: 'organization', action: 'write' },
    { code: 'user:read', name: '查看用户信息', resource_type: 'user', action: 'read' },
    { code: 'user:write', name: '管理用户信息', resource_type: 'user', action: 'write' },
    { code: 'role:read', name: '查看角色配置', resource_type: 'role', action: 'read' },
    { code: 'role:write', name: '管理角色权限', resource_type: 'role', action: 'write' },
    { code: 'audit:read', name: '查看审计日志', resource_type: 'audit', action: 'read' },
    { code: 'audit:export', name: '导出审计报告', resource_type: 'audit', action: 'export' },
    { code: 'monitor:view', name: '实时监控视图', resource_type: 'monitor', action: 'view' },
    { code: 'app:read', name: '查看外部应用', resource_type: 'application', action: 'read' },
    { code: 'app:write', name: '管理外部应用', resource_type: 'application', action: 'write' },
    { code: 'resource:access', name: '访问资源', resource_type: 'resource', action: 'access' },
    { code: 'sensitive:execute', name: '执行敏感操作', resource_type: 'sensitive', action: 'execute' },
  ];

  const permIds = {};
  permissions.forEach(perm => {
    const id = uuidv4();
    permIds[perm.code] = id;
    db.run(`
      INSERT INTO permissions (id, code, name, description, resource_type, action) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, perm.code, perm.name, perm.name, perm.resource_type, perm.action]);
  });

  const adminPerms = ['org:read', 'org:write', 'user:read', 'user:write', 'role:read', 'role:write', 'audit:read', 'monitor:view', 'app:read'];
  const employeePerms = ['org:read', 'user:read', 'resource:access'];
  const auditorPerms = ['audit:read', 'audit:export', 'monitor:view', 'user:read', 'org:read'];
  const appManagerPerms = ['app:read', 'app:write', 'user:read', 'role:read'];

  adminPerms.forEach(code => {
    db.run(`
      INSERT INTO role_permissions (id, role_id, permission_id) VALUES (?, ?, ?)
    `, [uuidv4(), adminRoleId, permIds[code]]);
  });

  employeePerms.forEach(code => {
    db.run(`
      INSERT INTO role_permissions (id, role_id, permission_id) VALUES (?, ?, ?)
    `, [uuidv4(), employeeRoleId, permIds[code]]);
  });

  auditorPerms.forEach(code => {
    db.run(`
      INSERT INTO role_permissions (id, role_id, permission_id) VALUES (?, ?, ?)
    `, [uuidv4(), auditorRoleId, permIds[code]]);
  });

  appManagerPerms.forEach(code => {
    db.run(`
      INSERT INTO role_permissions (id, role_id, permission_id) VALUES (?, ?, ?)
    `, [uuidv4(), appManagerRoleId, permIds[code]]);
  });

  const rootOrgId = uuidv4();
  db.run(`
    INSERT INTO organizations (id, name, parent_id, type) VALUES (?, ?, ?, ?)
  `, [rootOrgId, '总公司', null, 'root']);

  const dept1Id = uuidv4();
  const dept2Id = uuidv4();
  db.run(`
    INSERT INTO organizations (id, name, parent_id, type) VALUES (?, ?, ?, ?)
  `, [dept1Id, '技术部', rootOrgId, 'department']);
  db.run(`
    INSERT INTO organizations (id, name, parent_id, type) VALUES (?, ?, ?, ?)
  `, [dept2Id, '人力资源部', rootOrgId, 'department']);

  const adminPasswordHash = bcrypt.hashSync('Admin@123456', 10);
  const adminUserId = uuidv4();
  
  db.run(`
    INSERT INTO users (id, username, email, password_hash, real_name, status, organization_id, mfa_enabled)
    VALUES (?, ?, ?, ?, ?, 'active', ?, 1)
  `, [adminUserId, 'admin', 'admin@company.com', adminPasswordHash, '系统管理员', dept1Id]);

  db.run(`
    INSERT INTO user_roles (id, user_id, role_id) VALUES (?, ?, ?)
  `, [uuidv4(), adminUserId, adminRoleId]);

  const testEmployeePassword = bcrypt.hashSync('Employee@123', 10);
  const testEmployeeId = uuidv4();
  
  db.run(`
    INSERT INTO users (id, username, email, password_hash, real_name, status, organization_id)
    VALUES (?, ?, ?, ?, ?, 'active', ?)
  `, [testEmployeeId, 'employee', 'employee@company.com', testEmployeePassword, '测试员工', dept1Id]);

  db.run(`
    INSERT INTO user_roles (id, user_id, role_id) VALUES (?, ?, ?)
  `, [uuidv4(), testEmployeeId, employeeRoleId]);

  const auditorPassword = bcrypt.hashSync('Auditor@123', 10);
  const auditorUserId = uuidv4();
  
  db.run(`
    INSERT INTO users (id, username, email, password_hash, real_name, status, organization_id)
    VALUES (?, ?, ?, ?, ?, 'active', ?)
  `, [auditorUserId, 'auditor', 'auditor@company.com', auditorPassword, '安全审计员', rootOrgId]);

  db.run(`
    INSERT INTO user_roles (id, user_id, role_id) VALUES (?, ?, ?)
  `, [uuidv4(), auditorUserId, auditorRoleId]);
};

const saveDatabase = () => {
  if (db && dbFilePath) {
    const data = db.export();
    const buffer = Buffer.from(data);
    const dir = path.dirname(dbFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbFilePath, buffer);
  }
};

const normalizeParams = (params) => {
  return params.map(param => param === undefined ? null : param);
};

const getDb = () => db;

const query = (sql, params = []) => {
  if (!db) throw new Error('Database not initialized');
  const normalizedParams = normalizeParams(params);
  const stmt = db.prepare(sql);
  if (normalizedParams.length > 0) {
    stmt.bind(normalizedParams);
  }
  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }
  stmt.free();
  return results;
};

const run = (sql, params = []) => {
  if (!db) throw new Error('Database not initialized');
  const normalizedParams = normalizeParams(params);
  db.run(sql, normalizedParams);
  saveDatabase();
  return { changes: db.getRowsModified() };
};

const runWithId = (sql, params = []) => {
  if (!db) throw new Error('Database not initialized');
  const normalizedParams = normalizeParams(params);
  db.run(sql, normalizedParams);
  saveDatabase();
  const result = query('SELECT last_insert_rowid() as id');
  return { lastInsertRowid: result[0]?.id, changes: db.getRowsModified() };
};

module.exports = {
  initializeDatabase,
  getDb,
  query,
  run,
  runWithId,
  saveDatabase
};

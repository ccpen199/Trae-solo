import Database from 'better-sqlite3';
import * as bcrypt from 'bcryptjs';
import { config } from './config';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from './logger';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dataDir = path.dirname(config.database.path);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(config.database.path);
    db.pragma('journal_mode = WAL');
    db.pragma('busy_timeout = 5000');
    
    initializeDatabase();
  }
  return db;
}

function initializeDatabase() {
  if (!db) return;

  db.exec(`
    -- 角色表
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_code TEXT NOT NULL UNIQUE,
      role_name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 权限表
    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      permission_code TEXT NOT NULL UNIQUE,
      permission_name TEXT NOT NULL,
      module TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 角色权限关联表
    CREATE TABLE IF NOT EXISTS role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(role_id, permission_id)
    );

    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      real_name TEXT,
      role_id INTEGER NOT NULL,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 账户表
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      balance REAL DEFAULT 0.00,
      freeze_balance REAL DEFAULT 0.00,
      total_used REAL DEFAULT 0.00,
      credit_limit REAL DEFAULT 0.00,
      balance_warning_threshold REAL DEFAULT 100.00,
      auto_recharge_enabled INTEGER DEFAULT 0,
      auto_recharge_amount REAL DEFAULT 0.00,
      auto_recharge_trigger_amount REAL DEFAULT 0.00,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 短信模板表
    CREATE TABLE IF NOT EXISTS sms_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_code TEXT NOT NULL UNIQUE,
      template_name TEXT NOT NULL,
      template_content TEXT NOT NULL,
      template_type TEXT NOT NULL,
      sign_name TEXT,
      variables TEXT,
      status INTEGER DEFAULT 0,
      operator_id INTEGER NOT NULL,
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      review_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 敏感词表
    CREATE TABLE IF NOT EXISTS sensitive_words (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL UNIQUE,
      level INTEGER DEFAULT 1,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 通道商表
    CREATE TABLE IF NOT EXISTS providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_code TEXT NOT NULL UNIQUE,
      provider_name TEXT NOT NULL,
      description TEXT,
      status INTEGER DEFAULT 1,
      priority INTEGER DEFAULT 0,
      config TEXT,
      price_per_sms REAL DEFAULT 0.045,
      supported_template_types TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 发送任务表
    CREATE TABLE IF NOT EXISTS send_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_code TEXT NOT NULL UNIQUE,
      task_name TEXT NOT NULL,
      template_id INTEGER NOT NULL,
      template_content_snapshot TEXT,
      sender_id INTEGER NOT NULL,
      total_count INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      fail_count INTEGER DEFAULT 0,
      pending_count INTEGER DEFAULT 0,
      intercept_count INTEGER DEFAULT 0,
      status INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 短信记录表
    CREATE TABLE IF NOT EXISTS sms_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sms_code TEXT NOT NULL UNIQUE,
      task_id INTEGER,
      template_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      provider_id INTEGER,
      phone_number TEXT NOT NULL,
      content TEXT NOT NULL,
      template_variables TEXT,
      status INTEGER DEFAULT 0,
      intercept_reason TEXT,
      fail_reason TEXT,
      price REAL DEFAULT 0.00,
      amount REAL DEFAULT 0.00,
      request_id TEXT,
      request_at DATETIME,
      receive_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 频控规则表
    CREATE TABLE IF NOT EXISTS frequency_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_code TEXT NOT NULL UNIQUE,
      rule_name TEXT NOT NULL,
      target_type TEXT NOT NULL,
      time_window INTEGER NOT NULL,
      max_count INTEGER NOT NULL,
      template_type TEXT,
      priority INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 拦截记录表
    CREATE TABLE IF NOT EXISTS intercept_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      intercept_code TEXT NOT NULL UNIQUE,
      sms_record_id INTEGER NOT NULL,
      intercept_type TEXT NOT NULL,
      intercept_reason TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      template_id INTEGER,
      content_snapshot TEXT,
      intercept_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 回执原始记录表
    CREATE TABLE IF NOT EXISTS receipt_raws (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      raw_content TEXT NOT NULL,
      provider_id INTEGER NOT NULL,
      request_id TEXT,
      parsed INTEGER DEFAULT 0,
      parse_error TEXT,
      source_ip TEXT,
      received_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 合规规则表
    CREATE TABLE IF NOT EXISTS compliance_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_code TEXT NOT NULL UNIQUE,
      rule_name TEXT NOT NULL,
      rule_type TEXT NOT NULL,
      rule_content TEXT NOT NULL,
      action TEXT DEFAULT 'block',
      replace_text TEXT,
      priority INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 路由规则表
    CREATE TABLE IF NOT EXISTS routing_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_code TEXT NOT NULL UNIQUE,
      rule_name TEXT NOT NULL,
      template_type TEXT,
      phone_prefix TEXT,
      target_provider_id INTEGER,
      weight INTEGER DEFAULT 1,
      conditions TEXT,
      priority INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 审计日志表
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_code TEXT NOT NULL UNIQUE,
      user_id INTEGER,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 消费记录表
    CREATE TABLE IF NOT EXISTS consumption_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_code TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      sms_record_id INTEGER NOT NULL,
      template_id INTEGER,
      task_id INTEGER,
      provider_id INTEGER,
      phone_number TEXT,
      price REAL DEFAULT 0.00,
      amount REAL DEFAULT 0.00,
      balance_before REAL,
      balance_after REAL,
      status INTEGER DEFAULT 1,
      refund_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 充值记录表
    CREATE TABLE IF NOT EXISTS recharge_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recharge_code TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT,
      payment_transaction_id TEXT,
      status INTEGER DEFAULT 0,
      is_auto_recharge INTEGER DEFAULT 0,
      balance_before REAL,
      balance_after REAL,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 余额预警记录表
    CREATE TABLE IF NOT EXISTS balance_warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      warning_code TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      current_balance REAL NOT NULL,
      warning_threshold REAL NOT NULL,
      warning_level INTEGER DEFAULT 1,
      notified INTEGER DEFAULT 0,
      notified_at DATETIME,
      auto_recharge_triggered INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_sms_records_phone_number ON sms_records(phone_number);
    CREATE INDEX IF NOT EXISTS idx_sms_records_task_id ON sms_records(task_id);
    CREATE INDEX IF NOT EXISTS idx_sms_records_status ON sms_records(status);
    CREATE INDEX IF NOT EXISTS idx_sms_records_created_at ON sms_records(created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_consumption_records_user_id ON consumption_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_consumption_records_created_at ON consumption_records(created_at);
    CREATE INDEX IF NOT EXISTS idx_recharge_records_user_id ON recharge_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_recharge_records_created_at ON recharge_records(created_at);
    CREATE INDEX IF NOT EXISTS idx_balance_warnings_user_id ON balance_warnings(user_id);
  `);

  const rolesCount = db.prepare('SELECT COUNT(*) as count FROM roles').get();
  if (rolesCount.count === 0) {
    logger.info('初始化数据库数据...');
    initializeDefaultData();
    logger.info('数据库初始化完成！');
  }
}

function initializeDefaultData() {
  if (!db) return;

  const passwordHash = bcrypt.hashSync('password123', 10);

  // 角色
  const insertRole = db.prepare(`
    INSERT INTO roles (role_code, role_name, description) VALUES (?, ?, ?)
  `);
  insertRole.run('operator', '运营人员', '负责模板管理、短信发送等运营工作');
  insertRole.run('developer', '开发者', '负责API对接、通道配置等开发工作');
  insertRole.run('provider', '通道商', '短信通道供应商');
  insertRole.run('finance', '财务人员', '负责财务报表、充值管理等财务工作');
  insertRole.run('admin', '管理员', '系统管理员');

  // 权限
  const insertPermission = db.prepare(`
    INSERT INTO permissions (permission_code, permission_name, module) VALUES (?, ?, ?)
  `);
  const permissions = [
    ['template:create', '创建模板', 'template'],
    ['template:edit', '编辑模板', 'template'],
    ['template:view', '查看模板', 'template'],
    ['template:review', '审核模板', 'template'],
    ['template:delete', '删除模板', 'template'],
    ['sms:send', '发送短信', 'sms'],
    ['sms:view', '查看短信记录', 'sms'],
    ['sms:task:create', '创建发送任务', 'sms'],
    ['sms:task:view', '查看发送任务', 'sms'],
    ['provider:create', '创建通道', 'provider'],
    ['provider:edit', '编辑通道', 'provider'],
    ['provider:view', '查看通道', 'provider'],
    ['provider:delete', '删除通道', 'provider'],
    ['rule:frequency:edit', '编辑频控规则', 'rule'],
    ['rule:frequency:view', '查看频控规则', 'rule'],
    ['rule:routing:edit', '编辑路由规则', 'rule'],
    ['rule:routing:view', '查看路由规则', 'rule'],
    ['rule:compliance:edit', '编辑合规规则', 'rule'],
    ['rule:compliance:view', '查看合规规则', 'rule'],
    ['audit:view', '查看审计日志', 'audit'],
    ['finance:view', '查看财务报表', 'finance'],
    ['finance:recharge', '充值', 'finance'],
    ['finance:consumption:view', '查看消费记录', 'finance'],
    ['finance:balance:view', '查看余额', 'finance'],
  ];
  permissions.forEach(([code, name, module]) => {
    insertPermission.run(code, name, module);
  });

  // 角色权限关联
  const getRoleId = db.prepare('SELECT id FROM roles WHERE role_code = ?');
  const getPermissionId = db.prepare('SELECT id FROM permissions WHERE permission_code = ?');
  const insertRolePermission = db.prepare(`
    INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)
  `);

  // 运营人员权限
  const operatorId = getRoleId.get('operator').id;
  const operatorPerms = [
    'template:create', 'template:edit', 'template:view',
    'sms:send', 'sms:view', 'sms:task:create', 'sms:task:view',
    'finance:balance:view',
    'audit:view'
  ];
  operatorPerms.forEach(code => {
    const perm = getPermissionId.get(code);
    if (perm) insertRolePermission.run(operatorId, perm.id);
  });

  // 开发者权限
  const developerId = getRoleId.get('developer').id;
  const developerPerms = [
    'template:view',
    'sms:view', 'sms:task:view',
    'provider:create', 'provider:edit', 'provider:view', 'provider:delete',
    'rule:frequency:edit', 'rule:frequency:view',
    'rule:routing:edit', 'rule:routing:view',
    'rule:compliance:edit', 'rule:compliance:view',
    'audit:view'
  ];
  developerPerms.forEach(code => {
    const perm = getPermissionId.get(code);
    if (perm) insertRolePermission.run(developerId, perm.id);
  });

  // 财务人员权限
  const financeId = getRoleId.get('finance').id;
  const financePerms = [
    'finance:view', 'finance:recharge', 'finance:consumption:view', 'finance:balance:view',
    'audit:view'
  ];
  financePerms.forEach(code => {
    const perm = getPermissionId.get(code);
    if (perm) insertRolePermission.run(financeId, perm.id);
  });

  // 管理员权限（全部）
  const adminId = getRoleId.get('admin').id;
  const allPerms = db.prepare('SELECT id FROM permissions').all();
  allPerms.forEach((perm: any) => {
    insertRolePermission.run(adminId, perm.id);
  });

  // 插入用户
  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, email, phone, real_name, role_id, status)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  const operatorRole = getRoleId.get('operator');
  const developerRole = getRoleId.get('developer');
  const financeRole = getRoleId.get('finance');
  const adminRole = getRoleId.get('admin');

  const operatorResult = insertUser.run('operator', passwordHash, 'operator@example.com', '13800138001', '张运营', operatorRole.id);
  const developerResult = insertUser.run('developer', passwordHash, 'developer@example.com', '13800138002', '李开发', developerRole.id);
  const financeResult = insertUser.run('finance', passwordHash, 'finance@example.com', '13800138003', '王财务', financeRole.id);
  const adminResult = insertUser.run('admin', passwordHash, 'admin@example.com', '13800138000', '系统管理员', adminRole.id);

  // 插入账户
  const insertAccount = db.prepare(`
    INSERT INTO accounts (user_id, balance, freeze_balance, total_used, balance_warning_threshold)
    VALUES (?, ?, 0.00, 0.00, ?)
  `);
  insertAccount.run(operatorResult.lastInsertRowid, 1000.00, 100.00);
  insertAccount.run(adminResult.lastInsertRowid, 5000.00, 500.00);

  // 插入通道商
  const insertProvider = db.prepare(`
    INSERT INTO providers (provider_code, provider_name, description, status, priority, price_per_sms, supported_template_types)
    VALUES (?, ?, ?, 1, ?, ?, ?)
  `);
  insertProvider.run('aliyun_sms', '阿里云短信', '阿里云短信服务', 10, 0.045, '["验证码", "通知", "营销"]');
  insertProvider.run('tencent_sms', '腾讯云短信', '腾讯云短信服务', 9, 0.040, '["验证码", "通知", "营销"]');
  insertProvider.run('huawei_sms', '华为云短信', '华为云短信服务', 8, 0.038, '["验证码", "通知"]');

  // 插入默认模板（已激活）
  const insertTemplate = db.prepare(`
    INSERT INTO sms_templates (
      template_code, template_name, template_content, template_type,
      sign_name, variables, status, operator_id, reviewed_by, reviewed_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 2, ?, ?, datetime('now'), datetime('now'))
  `);
  
  const insertTemplateWithoutReview = db.prepare(`
    INSERT INTO sms_templates (
      template_code, template_name, template_content, template_type,
      sign_name, variables, status, operator_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, datetime('now'))
  `);

  insertTemplate.run(
    'TPL001', '登录验证码', 
    '您的验证码是{code}，有效期5分钟，请勿泄露给他人。', 
    '验证码', '【短信平台】', 
    '["code"]', 
    operatorResult.lastInsertRowid, 
    adminResult.lastInsertRowid
  );
  
  insertTemplate.run(
    'TPL002', '订单通知', 
    '尊敬的{name}，您的订单{orderNo}已成功提交，预计{date}送达。', 
    '通知', '【短信平台】', 
    '["name", "orderNo", "date"]', 
    operatorResult.lastInsertRowid, 
    adminResult.lastInsertRowid
  );
  
  insertTemplateWithoutReview.run(
    'TPL003', '营销推广', 
    '尊敬的用户，您的专属优惠已到账！点击链接查看详情：{url}', 
    '营销', '【短信平台】', 
    '["url"]', 
    operatorResult.lastInsertRowid
  );

  // 插入频控规则
  const insertFreqRule = db.prepare(`
    INSERT INTO frequency_rules (rule_code, rule_name, target_type, time_window, max_count, priority, status, description)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `);
  insertFreqRule.run('phone_1min_5', '同一手机号1分钟内最多5条', 'phone', 60, 5, 10, '防止对同一手机号频繁发送');
  insertFreqRule.run('phone_1hour_20', '同一手机号1小时内最多20条', 'phone', 3600, 20, 9, '防止对同一手机号频繁发送');
  insertFreqRule.run('phone_1day_100', '同一手机号1天内最多100条', 'phone', 86400, 100, 8, '防止对同一手机号频繁发送');
  insertFreqRule.run('user_1min_1000', '同一用户1分钟内最多1000条', 'user', 60, 1000, 5, '用户级别发送量限制');
  insertFreqRule.run('user_1day_100000', '同一用户1天内最多100000条', 'user', 86400, 100000, 4, '用户级别日发送量限制');

  // 插入敏感词
  const insertSensitiveWord = db.prepare(`
    INSERT INTO sensitive_words (word, level, category) VALUES (?, ?, ?)
  `);
  const sensitiveWords = [
    ['赌博', 2, '违法违规'],
    ['色情', 2, '违法违规'],
    ['毒品', 2, '违法违规'],
    ['诈骗', 2, '违法违规'],
    ['办证', 1, '敏感内容'],
    ['刻章', 1, '敏感内容'],
    ['代开发票', 2, '违法违规'],
    ['中奖', 1, '营销敏感'],
    ['免费', 1, '营销敏感'],
    ['绝对', 1, '极限词'],
  ];
  sensitiveWords.forEach(([word, level, category]) => {
    insertSensitiveWord.run(word, level, category);
  });

  // 插入合规规则
  const insertComplianceRule = db.prepare(`
    INSERT INTO compliance_rules (rule_code, rule_name, rule_type, rule_content, action, priority, status, description)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `);
  insertComplianceRule.run('sensitive_word_check', '敏感词检查', 'sensitive_word', 'all', 'block', 100, '检查是否包含敏感词');
  insertComplianceRule.run('max_length_70', '短信长度限制', 'length', '70', 'block', 90, '单条短信最大长度70字符');
  insertComplianceRule.run('phone_blacklist', '黑名单号码', 'blacklist', '', 'block', 80, '检查号码是否在黑名单');

  // 插入路由规则
  const getProviderId = db.prepare('SELECT id FROM providers WHERE provider_code = ?');
  const aliyunId = getProviderId.get('aliyun_sms').id;
  const tencentId = getProviderId.get('tencent_sms').id;
  const huaweiId = getProviderId.get('huawei_sms').id;

  const insertRoutingRule = db.prepare(`
    INSERT INTO routing_rules (rule_code, rule_name, template_type, target_provider_id, weight, priority, status)
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `);
  insertRoutingRule.run('verification_aliyun', '验证码优先阿里云', '验证码', aliyunId, 3, 100);
  insertRoutingRule.run('marketing_tencent', '营销优先腾讯', '营销', tencentId, 2, 90);
  insertRoutingRule.run('notification_huawei', '通知优先华为', '通知', huaweiId, 1, 80);

  logger.info('默认数据已初始化');
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

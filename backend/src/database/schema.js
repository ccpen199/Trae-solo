const createTables = (db) => {
  db.exec(`
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      phone TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 角色表
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 用户角色关联表
    CREATE TABLE IF NOT EXISTS user_roles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (role_id) REFERENCES roles(id),
      UNIQUE(user_id, role_id)
    );

    -- 权限表
    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 角色权限关联表
    CREATE TABLE IF NOT EXISTS role_permissions (
      id TEXT PRIMARY KEY,
      role_id TEXT NOT NULL,
      permission_id TEXT NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id),
      FOREIGN KEY (permission_id) REFERENCES permissions(id),
      UNIQUE(role_id, permission_id)
    );

    -- 套餐表
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT,
      billing_cycle TEXT NOT NULL, -- monthly, quarterly, yearly
      price REAL NOT NULL,
      currency TEXT DEFAULT 'CNY',
      status TEXT DEFAULT 'draft', -- draft, active, inactive
      trial_days INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 套餐特性表
    CREATE TABLE IF NOT EXISTS plan_features (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      feature_key TEXT NOT NULL,
      feature_name TEXT NOT NULL,
      feature_value TEXT,
      feature_type TEXT DEFAULT 'boolean', -- boolean, numeric, string
      is_primary BOOLEAN DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_id) REFERENCES plans(id)
    );

    -- 定价历史表
    CREATE TABLE IF NOT EXISTS pricing_history (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      old_price REAL,
      new_price REAL NOT NULL,
      change_reason TEXT,
      changed_by TEXT NOT NULL,
      effective_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_id) REFERENCES plans(id),
      FOREIGN KEY (changed_by) REFERENCES users(id)
    );

    -- 订阅表
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending', -- pending, active, past_due, cancelled, expired
      quantity INTEGER DEFAULT 1,
      current_period_start DATETIME,
      current_period_end DATETIME,
      trial_start DATETIME,
      trial_end DATETIME,
      cancel_at_period_end BOOLEAN DEFAULT 0,
      cancelled_at DATETIME,
      cancel_reason TEXT,
      next_billing_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (plan_id) REFERENCES plans(id)
    );

    -- 订阅变更记录表
    CREATE TABLE IF NOT EXISTS subscription_changes (
      id TEXT PRIMARY KEY,
      subscription_id TEXT NOT NULL,
      change_type TEXT NOT NULL, -- create, update, cancel, renew, pause, resume
      old_plan_id TEXT,
      new_plan_id TEXT,
      old_status TEXT,
      new_status TEXT,
      change_reason TEXT,
      changed_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
    );

    -- 账单表
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      subscription_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      invoice_number TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'draft', -- draft, open, paid, void, uncollectible
      amount_due REAL NOT NULL,
      amount_paid REAL DEFAULT 0,
      currency TEXT DEFAULT 'CNY',
      billing_period_start DATETIME NOT NULL,
      billing_period_end DATETIME NOT NULL,
      due_at DATETIME NOT NULL,
      paid_at DATETIME,
      voided_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 账单项目表
    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      description TEXT NOT NULL,
      unit_amount REAL NOT NULL,
      quantity INTEGER NOT NULL,
      amount REAL NOT NULL,
      plan_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id),
      FOREIGN KEY (plan_id) REFERENCES plans(id)
    );

    -- 支付记录表
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      invoice_id TEXT,
      subscription_id TEXT,
      user_id TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'CNY',
      status TEXT NOT NULL, -- pending, succeeded, failed, refunded
      transaction_id TEXT,
      gateway_response TEXT,
      failure_reason TEXT,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id),
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 权益表
    CREATE TABLE IF NOT EXISTS entitlements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subscription_id TEXT,
      feature_key TEXT NOT NULL,
      feature_value TEXT,
      is_active BOOLEAN DEFAULT 1,
      valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
      valid_to DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id)
    );

    -- 权益使用记录表
    CREATE TABLE IF NOT EXISTS entitlement_usage (
      id TEXT PRIMARY KEY,
      entitlement_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      usage_count INTEGER DEFAULT 1,
      usage_details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (entitlement_id) REFERENCES entitlements(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 通知表
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      role_id TEXT,
      type TEXT NOT NULL, -- email, in_app, sms
      template_key TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      status TEXT DEFAULT 'pending', -- pending, sent, failed, read
      sent_at DATETIME,
      read_at DATETIME,
      failure_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );

    -- 通知模板表
    CREATE TABLE IF NOT EXISTS notification_templates (
      id TEXT PRIMARY KEY,
      template_key TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      title_template TEXT NOT NULL,
      content_template TEXT,
      variables TEXT, -- JSON array of variable names
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 审计日志表
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      old_value TEXT, -- JSON
      new_value TEXT, -- JSON
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 流失预测表
    CREATE TABLE IF NOT EXISTS churn_predictions (
      id TEXT PRIMARY KEY,
      subscription_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      risk_score REAL NOT NULL,
      risk_level TEXT NOT NULL, -- low, medium, high
      factors TEXT, -- JSON array of risk factors
      predicted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      action_taken TEXT,
      action_taken_at DATETIME,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 系统配置表
    CREATE TABLE IF NOT EXISTS system_configs (
      id TEXT PRIMARY KEY,
      config_key TEXT UNIQUE NOT NULL,
      config_value TEXT NOT NULL,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('数据库表创建完成');
};

module.exports = { createTables };

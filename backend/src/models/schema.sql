-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    real_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL CHECK(role IN ('platform_engineer', 'ops', 'developer', 'app_owner', 'security_admin')),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'disabled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 应用表
CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id TEXT UNIQUE NOT NULL,
    app_name TEXT NOT NULL,
    app_description TEXT,
    owner_id INTEGER REFERENCES users(id),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'pending')),
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 环境表
CREATE TABLE IF NOT EXISTS environments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    env_id TEXT UNIQUE NOT NULL,
    env_name TEXT NOT NULL,
    app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    env_type TEXT NOT NULL CHECK(env_type IN ('dev', 'test', 'staging', 'prod')),
    base_url TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(app_id, env_type)
);

-- MFA配置版本表
CREATE TABLE IF NOT EXISTS mfa_config_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL,
    app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    env_id INTEGER REFERENCES environments(id) ON DELETE CASCADE,
    mfa_type TEXT NOT NULL CHECK(mfa_type IN ('totp', 'sms', 'email', 'webauthn', 'push')),
    config_data TEXT NOT NULL,
    rule_engine TEXT,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'pending', 'approved', 'active', 'deprecated')),
    created_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    approved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 密钥表
CREATE TABLE IF NOT EXISTS mfa_secrets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    secret_id TEXT UNIQUE NOT NULL,
    app_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    env_id INTEGER REFERENCES environments(id) ON DELETE CASCADE,
    config_version_id INTEGER REFERENCES mfa_config_versions(id),
    secret_type TEXT NOT NULL,
    encrypted_secret TEXT NOT NULL,
    key_rotation_schedule TEXT,
    last_rotated_at DATETIME,
    expires_at DATETIME,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'expired', 'revoked')),
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 执行任务表
CREATE TABLE IF NOT EXISTS execution_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT UNIQUE NOT NULL,
    task_type TEXT NOT NULL CHECK(task_type IN ('config_deploy', 'secret_rotation', 'mfa_challenge', 'bulk_operation', 'recovery')),
    app_id INTEGER REFERENCES applications(id),
    env_id INTEGER REFERENCES environments(id),
    config_version_id INTEGER REFERENCES mfa_config_versions(id),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'validating', 'approved', 'executing', 'success', 'failed', 'cancelled', 'rolled_back')),
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high', 'critical')),
    previous_task_id INTEGER REFERENCES execution_tasks(id),
    required_materials TEXT,
    validation_result TEXT,
    executor_id INTEGER REFERENCES users(id),
    approver_id INTEGER REFERENCES users(id),
    approved_at DATETIME,
    started_at DATETIME,
    completed_at DATETIME,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 调用日志表
CREATE TABLE IF NOT EXISTS call_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    log_id TEXT UNIQUE NOT NULL,
    task_id TEXT REFERENCES execution_tasks(task_id),
    app_id INTEGER REFERENCES applications(id),
    env_id INTEGER REFERENCES environments(id),
    operation_type TEXT NOT NULL,
    request_data TEXT NOT NULL,
    response_data TEXT,
    status TEXT NOT NULL CHECK(status IN ('success', 'failed', 'pending')),
    error_code TEXT,
    error_message TEXT,
    execution_time INTEGER,
    source_ip TEXT,
    user_agent TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 变更单表
CREATE TABLE IF NOT EXISTS change_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    change_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    change_type TEXT NOT NULL CHECK(change_type IN ('config', 'secret', 'policy', 'integration')),
    app_id INTEGER REFERENCES applications(id),
    env_id INTEGER REFERENCES environments(id),
    config_version_id INTEGER REFERENCES mfa_config_versions(id),
    task_id TEXT REFERENCES execution_tasks(task_id),
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'reviewing', 'approved', 'rejected', 'implemented', 'cancelled')),
    risk_level TEXT DEFAULT 'medium' CHECK(risk_level IN ('low', 'medium', 'high', 'critical')),
    rollback_plan TEXT,
    created_by INTEGER REFERENCES users(id),
    reviewer_id INTEGER REFERENCES users(id),
    reviewer_comment TEXT,
    reviewed_at DATETIME,
    implemented_by INTEGER REFERENCES users(id),
    implemented_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 告警记录表
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_id TEXT UNIQUE NOT NULL,
    alert_type TEXT NOT NULL CHECK(alert_type IN ('auth_failure', 'config_error', 'secret_expiry', 'system_error', 'security_breach', 'performance')),
    severity TEXT NOT NULL CHECK(severity IN ('info', 'warning', 'error', 'critical')),
    app_id INTEGER REFERENCES applications(id),
    env_id INTEGER REFERENCES environments(id),
    task_id TEXT REFERENCES execution_tasks(task_id),
    log_id TEXT REFERENCES call_logs(log_id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK(status IN ('open', 'acknowledged', 'resolved', 'closed')),
    assignee_id INTEGER REFERENCES users(id),
    acknowledged_by INTEGER REFERENCES users(id),
    acknowledged_at DATETIME,
    resolved_by INTEGER REFERENCES users(id),
    resolved_at DATETIME,
    resolution_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 权限审计表
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_id TEXT UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    ip_address TEXT,
    user_agent TEXT,
    status TEXT NOT NULL CHECK(status IN ('allowed', 'denied')),
    denial_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 异常处理表
CREATE TABLE IF NOT EXISTS exception_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exception_id TEXT UNIQUE NOT NULL,
    task_id TEXT REFERENCES execution_tasks(task_id),
    log_id TEXT REFERENCES call_logs(log_id),
    original_request TEXT NOT NULL,
    failure_reason TEXT NOT NULL,
    error_stack TEXT,
    compensation_action TEXT,
    compensation_status TEXT DEFAULT 'pending' CHECK(compensation_status IN ('pending', 'executing', 'success', 'failed', 'not_required')),
    compensation_result TEXT,
    manual_notes TEXT,
    handled_by INTEGER REFERENCES users(id),
    handled_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_applications_owner ON applications(owner_id);
CREATE INDEX IF NOT EXISTS idx_environments_app ON environments(app_id);
CREATE INDEX IF NOT EXISTS idx_config_versions_app ON mfa_config_versions(app_id);
CREATE INDEX IF NOT EXISTS idx_secrets_app ON mfa_secrets(app_id);
CREATE INDEX IF NOT EXISTS idx_tasks_app ON execution_tasks(app_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON execution_tasks(status);
CREATE INDEX IF NOT EXISTS idx_logs_app ON call_logs(app_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON call_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_change_orders_app ON change_orders(app_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

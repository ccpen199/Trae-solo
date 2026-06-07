-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_type VARCHAR(20) NOT NULL CHECK(user_type IN ('natural', 'legal', 'staff', 'admin')),
    name VARCHAR(100) NOT NULL,
    id_card VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    roles TEXT,
    avatar VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 电子证照表
CREATE TABLE IF NOT EXISTS licenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    license_type VARCHAR(50) NOT NULL,
    license_number VARCHAR(100) NOT NULL,
    holder_name VARCHAR(100) NOT NULL,
    issue_date DATE,
    expiry_date DATE,
    issuer VARCHAR(100),
    status VARCHAR(20) DEFAULT 'valid',
    license_data_encrypted TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 证照使用记录表
CREATE TABLE IF NOT EXISTS license_usage_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    license_id INTEGER NOT NULL,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_by VARCHAR(100),
    purpose VARCHAR(255),
    location VARCHAR(100),
    FOREIGN KEY (license_id) REFERENCES licenses(id)
);

-- 政务服务事项表
CREATE TABLE IF NOT EXISTS service_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100),
    category VARCHAR(50),
    handling_time_limit INTEGER DEFAULT 20,
    running_count INTEGER DEFAULT 0,
    handling_depth VARCHAR(50),
    scenario_tree_json TEXT,
    form_schema_json TEXT,
    material_list_json TEXT,
    version INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'online',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 办件表
CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_no VARCHAR(50) UNIQUE NOT NULL,
    service_id INTEGER NOT NULL,
    applicant_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    form_data TEXT,
    scenario_path TEXT,
    material_hash_list TEXT,
    current_flow_node_id INTEGER,
    submitted_at DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES service_items(id),
    FOREIGN KEY (applicant_id) REFERENCES users(id)
);

-- 办件材料表
CREATE TABLE IF NOT EXISTS application_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    material_name VARCHAR(255),
    material_type VARCHAR(50),
    file_hash VARCHAR(64),
    file_path VARCHAR(255),
    is_from_license BOOLEAN DEFAULT 0,
    license_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id)
);

-- 审批流表
CREATE TABLE IF NOT EXISTS approval_flows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER NOT NULL,
    nodes_json TEXT,
    version INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES service_items(id)
);

-- 审批节点表
CREATE TABLE IF NOT EXISTS approval_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    flow_id INTEGER NOT NULL,
    node_name VARCHAR(100),
    department VARCHAR(100),
    operator_id INTEGER,
    action VARCHAR(20),
    comment TEXT,
    handled_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id),
    FOREIGN KEY (flow_id) REFERENCES approval_flows(id)
);

-- 操作审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    application_id INTEGER,
    action VARCHAR(100),
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 效能统计表
CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stat_date DATE UNIQUE,
    total_applications INTEGER DEFAULT 0,
    completed_applications INTEGER DEFAULT 0,
    avg_handling_time INTEGER DEFAULT 0,
    satisfaction_score INTEGER DEFAULT 0,
    nps_score INTEGER DEFAULT 0,
    over_warning_count INTEGER DEFAULT 0
);

-- 数据资源目录表
CREATE TABLE IF NOT EXISTS api_resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255),
    code VARCHAR(50) UNIQUE,
    provider VARCHAR(100),
    endpoint VARCHAR(255),
    call_count INTEGER DEFAULT 0,
    avg_response_time INTEGER DEFAULT 0,
    error_rate INTEGER DEFAULT 0,
    last_called_at DATETIME
);

-- 接口调用日志表
CREATE TABLE IF NOT EXISTS api_call_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_resource_id INTEGER,
    request_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    response_time INTEGER,
    status_code INTEGER,
    error_message TEXT,
    FOREIGN KEY (api_resource_id) REFERENCES api_resources(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_application ON audit_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_licenses_user ON licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_service_items_category ON service_items(category);
CREATE INDEX IF NOT EXISTS idx_approval_nodes_application ON approval_nodes(application_id);

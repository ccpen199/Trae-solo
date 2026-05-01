-- 短信营销与通知平台数据库初始化脚本

CREATE DATABASE IF NOT EXISTS sms_platform DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE sms_platform;

-- 角色表
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_code VARCHAR(50) NOT NULL UNIQUE,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 权限表
CREATE TABLE IF NOT EXISTS permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    permission_code VARCHAR(100) NOT NULL UNIQUE,
    permission_name VARCHAR(200) NOT NULL,
    module VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 角色权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id),
    UNIQUE KEY uk_role_permission (role_id, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(20),
    real_name VARCHAR(100),
    role_id BIGINT NOT NULL,
    status TINYINT DEFAULT 1 COMMENT '1: 正常, 0: 禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 账户表（用于计费）
CREATE TABLE IF NOT EXISTS accounts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    balance DECIMAL(18, 2) DEFAULT 0.00,
    freeze_balance DECIMAL(18, 2) DEFAULT 0.00,
    total_used DECIMAL(18, 2) DEFAULT 0.00,
    credit_limit DECIMAL(18, 2) DEFAULT 0.00,
    balance_warning_threshold DECIMAL(18, 2) DEFAULT 100.00,
    auto_recharge_enabled TINYINT DEFAULT 0,
    auto_recharge_amount DECIMAL(18, 2) DEFAULT 0.00,
    auto_recharge_trigger_amount DECIMAL(18, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 短信模板表
CREATE TABLE IF NOT EXISTS sms_templates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    template_code VARCHAR(100) NOT NULL UNIQUE,
    template_name VARCHAR(200) NOT NULL,
    template_content TEXT NOT NULL,
    template_type VARCHAR(50) NOT NULL COMMENT '验证码, 通知, 营销',
    sign_name VARCHAR(100) COMMENT '短信签名',
    variables JSON COMMENT '模板变量定义',
    status TINYINT DEFAULT 0 COMMENT '0: 草稿, 1: 审核中, 2: 已激活, 3: 已禁用',
    operator_id BIGINT NOT NULL COMMENT '创建的运营人员ID',
    reviewed_by BIGINT COMMENT '审核人ID',
    reviewed_at TIMESTAMP NULL,
    review_reason TEXT COMMENT '审核意见',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (operator_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 敏感词表
CREATE TABLE IF NOT EXISTS sensitive_words (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    word VARCHAR(200) NOT NULL UNIQUE,
    level TINYINT DEFAULT 1 COMMENT '1: 普通敏感词, 2: 高风险敏感词',
    category VARCHAR(100) COMMENT '分类',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 通道商表
CREATE TABLE IF NOT EXISTS providers (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    provider_code VARCHAR(100) NOT NULL UNIQUE,
    provider_name VARCHAR(200) NOT NULL,
    description TEXT,
    status TINYINT DEFAULT 1 COMMENT '1: 可用, 0: 不可用',
    priority INT DEFAULT 0 COMMENT '优先级，越高越优先',
    config JSON COMMENT '通道配置信息（API地址、密钥等，加密存储）',
    price_per_sms DECIMAL(10, 4) DEFAULT 0.00 COMMENT '每条短信价格',
    supported_template_types JSON COMMENT '支持的模板类型',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 发送任务表
CREATE TABLE IF NOT EXISTS send_tasks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_code VARCHAR(100) NOT NULL UNIQUE,
    task_name VARCHAR(200) NOT NULL,
    template_id BIGINT NOT NULL,
    template_content_snapshot TEXT COMMENT '发送时的模板内容快照',
    sender_id BIGINT NOT NULL COMMENT '发起发送的用户ID',
    total_count INT DEFAULT 0 COMMENT '目标号码总数',
    success_count INT DEFAULT 0 COMMENT '成功发送数',
    fail_count INT DEFAULT 0 COMMENT '发送失败数',
    pending_count INT DEFAULT 0 COMMENT '待发送数',
    intercept_count INT DEFAULT 0 COMMENT '被拦截数',
    status TINYINT DEFAULT 0 COMMENT '0: 待处理, 1: 处理中, 2: 已完成, 3: 已取消',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES sms_templates(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 短信记录表
CREATE TABLE IF NOT EXISTS sms_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    sms_code VARCHAR(100) NOT NULL UNIQUE,
    task_id BIGINT COMMENT '所属任务ID',
    template_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    provider_id BIGINT COMMENT '使用的通道商ID',
    phone_number VARCHAR(20) NOT NULL COMMENT '目标手机号',
    content TEXT NOT NULL COMMENT '实际发送的内容',
    template_variables JSON COMMENT '模板变量值',
    status TINYINT DEFAULT 0 COMMENT '0: 待发送, 1: 发送中, 2: 发送成功, 3: 发送失败, 4: 被拦截',
    intercept_reason VARCHAR(500) COMMENT '拦截原因',
    fail_reason VARCHAR(500) COMMENT '失败原因',
    price DECIMAL(10, 4) DEFAULT 0.00 COMMENT '本次发送单价',
    amount DECIMAL(10, 4) DEFAULT 0.00 COMMENT '本次扣费金额',
    request_id VARCHAR(200) COMMENT '通道商返回的请求ID',
    request_at TIMESTAMP NULL COMMENT '发送请求时间',
    receive_at TIMESTAMP NULL COMMENT '收到回执时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES send_tasks(id),
    FOREIGN KEY (template_id) REFERENCES sms_templates(id),
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (provider_id) REFERENCES providers(id),
    INDEX idx_phone_number (phone_number),
    INDEX idx_task_id (task_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 频控规则表
CREATE TABLE IF NOT EXISTS frequency_rules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rule_code VARCHAR(100) NOT NULL UNIQUE,
    rule_name VARCHAR(200) NOT NULL,
    target_type VARCHAR(50) NOT NULL COMMENT 'phone, ip, user',
    time_window BIGINT NOT NULL COMMENT '时间窗口（秒）',
    max_count INT NOT NULL COMMENT '最大发送次数',
    template_type VARCHAR(50) COMMENT '针对的模板类型，NULL表示全部',
    priority INT DEFAULT 0 COMMENT '优先级',
    status TINYINT DEFAULT 1 COMMENT '1: 启用, 0: 禁用',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 频控记录
CREATE TABLE IF NOT EXISTS frequency_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    target_type VARCHAR(50) NOT NULL,
    target_value VARCHAR(200) NOT NULL,
    count INT DEFAULT 0,
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_target_window (target_type, target_value, window_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 拦截记录表
CREATE TABLE IF NOT EXISTS intercept_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    intercept_code VARCHAR(100) NOT NULL UNIQUE,
    sms_record_id BIGINT NOT NULL,
    intercept_type VARCHAR(50) NOT NULL COMMENT 'frequency, compliance, routing',
    intercept_reason VARCHAR(500) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    template_id BIGINT,
    content_snapshot TEXT,
    intercept_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sms_record_id) REFERENCES sms_records(id),
    FOREIGN KEY (template_id) REFERENCES sms_templates(id),
    INDEX idx_phone_number (phone_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 回执原始记录表
CREATE TABLE IF NOT EXISTS receipt_raws (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    raw_content TEXT NOT NULL COMMENT '回执原文',
    provider_id BIGINT NOT NULL,
    request_id VARCHAR(200) COMMENT '通道商返回的请求ID',
    parsed TINYINT DEFAULT 0 COMMENT '0: 未解析, 1: 已解析',
    parse_error VARCHAR(500),
    source_ip VARCHAR(50) COMMENT '来源IP',
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES providers(id),
    INDEX idx_request_id (request_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 合规过滤规则表
CREATE TABLE IF NOT EXISTS compliance_rules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rule_code VARCHAR(100) NOT NULL UNIQUE,
    rule_name VARCHAR(200) NOT NULL,
    rule_type VARCHAR(50) NOT NULL COMMENT 'sensitive_word, regex, length, blacklist',
    rule_content TEXT NOT NULL COMMENT '规则内容',
    action VARCHAR(50) DEFAULT 'block' COMMENT 'block, warn, replace',
    replace_text VARCHAR(200) COMMENT '替换文本，当action为replace时使用',
    priority INT DEFAULT 0,
    status TINYINT DEFAULT 1,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 路由规则表
CREATE TABLE IF NOT EXISTS routing_rules (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rule_code VARCHAR(100) NOT NULL UNIQUE,
    rule_name VARCHAR(200) NOT NULL,
    template_type VARCHAR(50) COMMENT '模板类型',
    phone_prefix VARCHAR(50) COMMENT '手机号前缀',
    target_provider_id BIGINT COMMENT '目标通道商ID',
    weight INT DEFAULT 1 COMMENT '权重',
    conditions JSON COMMENT '额外条件',
    priority INT DEFAULT 0,
    status TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (target_provider_id) REFERENCES providers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 审计日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    audit_code VARCHAR(100) NOT NULL UNIQUE,
    user_id BIGINT COMMENT '操作用户ID',
    module VARCHAR(100) NOT NULL COMMENT '模块',
    action VARCHAR(100) NOT NULL COMMENT '动作',
    target_type VARCHAR(100) COMMENT '目标类型',
    target_id BIGINT COMMENT '目标ID',
    old_value TEXT COMMENT '修改前的值',
    new_value TEXT COMMENT '修改后的值',
    ip_address VARCHAR(50) COMMENT '操作IP',
    user_agent VARCHAR(500) COMMENT '用户代理',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_module (module),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 消费记录表
CREATE TABLE IF NOT EXISTS consumption_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    record_code VARCHAR(100) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    sms_record_id BIGINT NOT NULL,
    template_id BIGINT,
    task_id BIGINT,
    provider_id BIGINT,
    phone_number VARCHAR(20),
    price DECIMAL(10, 4) DEFAULT 0.00,
    amount DECIMAL(10, 4) DEFAULT 0.00,
    balance_before DECIMAL(18, 2),
    balance_after DECIMAL(18, 2),
    status TINYINT DEFAULT 1 COMMENT '1: 已扣费, 2: 已退款',
    refund_reason VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (sms_record_id) REFERENCES sms_records(id),
    FOREIGN KEY (template_id) REFERENCES sms_templates(id),
    FOREIGN KEY (task_id) REFERENCES send_tasks(id),
    FOREIGN KEY (provider_id) REFERENCES providers(id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 充值记录表
CREATE TABLE IF NOT EXISTS recharge_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    recharge_code VARCHAR(100) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    amount DECIMAL(18, 2) NOT NULL,
    payment_method VARCHAR(50) COMMENT '支付方式',
    payment_transaction_id VARCHAR(200) COMMENT '支付平台交易号',
    status TINYINT DEFAULT 0 COMMENT '0: 待支付, 1: 已支付, 2: 已取消',
    is_auto_recharge TINYINT DEFAULT 0 COMMENT '是否自动充值',
    balance_before DECIMAL(18, 2),
    balance_after DECIMAL(18, 2),
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 余额预警记录表
CREATE TABLE IF NOT EXISTS balance_warnings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    warning_code VARCHAR(100) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    current_balance DECIMAL(18, 2) NOT NULL,
    warning_threshold DECIMAL(18, 2) NOT NULL,
    warning_level TINYINT DEFAULT 1 COMMENT '1: 一级预警, 2: 二级预警',
    notified TINYINT DEFAULT 0 COMMENT '是否已通知',
    notified_at TIMESTAMP NULL,
    auto_recharge_triggered TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 初始化角色数据
INSERT INTO roles (role_code, role_name, description) VALUES
('operator', '运营人员', '负责模板管理、短信发送等运营工作'),
('developer', '开发者', '负责API对接、通道配置等开发工作'),
('provider', '通道商', '短信通道供应商'),
('finance', '财务人员', '负责财务报表、充值管理等财务工作'),
('admin', '管理员', '系统管理员');

-- 初始化权限数据
INSERT INTO permissions (permission_code, permission_name, module) VALUES
-- 模板管理
('template:create', '创建模板', 'template'),
('template:edit', '编辑模板', 'template'),
('template:view', '查看模板', 'template'),
('template:review', '审核模板', 'template'),
('template:delete', '删除模板', 'template'),

-- 短信发送
('sms:send', '发送短信', 'sms'),
('sms:view', '查看短信记录', 'sms'),
('sms:task:create', '创建发送任务', 'sms'),
('sms:task:view', '查看发送任务', 'sms'),

-- 通道管理
('provider:create', '创建通道', 'provider'),
('provider:edit', '编辑通道', 'provider'),
('provider:view', '查看通道', 'provider'),
('provider:delete', '删除通道', 'provider'),

-- 规则配置
('rule:frequency:edit', '编辑频控规则', 'rule'),
('rule:frequency:view', '查看频控规则', 'rule'),
('rule:routing:edit', '编辑路由规则', 'rule'),
('rule:routing:view', '查看路由规则', 'rule'),
('rule:compliance:edit', '编辑合规规则', 'rule'),
('rule:compliance:view', '查看合规规则', 'rule'),

-- 审计
('audit:view', '查看审计日志', 'audit'),

-- 财务
('finance:view', '查看财务报表', 'finance'),
('finance:recharge', '充值', 'finance'),
('finance:consumption:view', '查看消费记录', 'finance'),
('finance:balance:view', '查看余额', 'finance');

-- 运营人员权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.role_code = 'operator' AND p.permission_code IN (
    'template:create', 'template:edit', 'template:view',
    'sms:send', 'sms:view', 'sms:task:create', 'sms:task:view',
    'audit:view'
);

-- 开发者权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.role_code = 'developer' AND p.permission_code IN (
    'template:view',
    'sms:view', 'sms:task:view',
    'provider:create', 'provider:edit', 'provider:view', 'provider:delete',
    'rule:frequency:edit', 'rule:frequency:view',
    'rule:routing:edit', 'rule:routing:view',
    'rule:compliance:edit', 'rule:compliance:view',
    'audit:view'
);

-- 财务人员权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.role_code = 'finance' AND p.permission_code IN (
    'finance:view', 'finance:recharge', 'finance:consumption:view', 'finance:balance:view',
    'audit:view'
);

-- 管理员权限（全部权限）
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.role_code = 'admin';

-- 初始化默认用户（密码：password123，使用bcrypt加密后的哈希）
-- 运营人员
INSERT INTO users (username, password_hash, email, phone, real_name, role_id, status)
SELECT 'operator', '$2b$10$EjXJ9hFyM2KvL5nQq8rSTuVwXyZaBcDeFgHiJkLmNoPqRsTuVw', 'operator@example.com', '13800138001', '张运营', id, 1
FROM roles WHERE role_code = 'operator';

-- 开发者
INSERT INTO users (username, password_hash, email, phone, real_name, role_id, status)
SELECT 'developer', '$2b$10$EjXJ9hFyM2KvL5nQq8rSTuVwXyZaBcDeFgHiJkLmNoPqRsTuVw', 'developer@example.com', '13800138002', '李开发', id, 1
FROM roles WHERE role_code = 'developer';

-- 财务人员
INSERT INTO users (username, password_hash, email, phone, real_name, role_id, status)
SELECT 'finance', '$2b$10$EjXJ9hFyM2KvL5nQq8rSTuVwXyZaBcDeFgHiJkLmNoPqRsTuVw', 'finance@example.com', '13800138003', '王财务', id, 1
FROM roles WHERE role_code = 'finance';

-- 管理员
INSERT INTO users (username, password_hash, email, phone, real_name, role_id, status)
SELECT 'admin', '$2b$10$EjXJ9hFyM2KvL5nQq8rSTuVwXyZaBcDeFgHiJkLmNoPqRsTuVw', 'admin@example.com', '13800138000', '系统管理员', id, 1
FROM roles WHERE role_code = 'admin';

-- 初始化账户
INSERT INTO accounts (user_id, balance, freeze_balance, total_used, balance_warning_threshold)
SELECT id, 1000.00, 0.00, 0.00, 100.00 FROM users WHERE username = 'operator';

INSERT INTO accounts (user_id, balance, freeze_balance, total_used, balance_warning_threshold)
SELECT id, 5000.00, 0.00, 0.00, 500.00 FROM users WHERE username = 'admin';

-- 初始化示例通道商
INSERT INTO providers (provider_code, provider_name, description, status, priority, price_per_sms, supported_template_types)
VALUES
('aliyun_sms', '阿里云短信', '阿里云短信服务', 1, 10, 0.045, '["验证码", "通知", "营销"]'),
('tencent_sms', '腾讯云短信', '腾讯云短信服务', 1, 9, 0.040, '["验证码", "通知", "营销"]'),
('huawei_sms', '华为云短信', '华为云短信服务', 1, 8, 0.038, '["验证码", "通知"]');

-- 初始化频控规则
INSERT INTO frequency_rules (rule_code, rule_name, target_type, time_window, max_count, template_type, priority, status, description)
VALUES
('phone_1min_5', '同一手机号1分钟内最多5条', 'phone', 60, 5, NULL, 10, 1, '防止对同一手机号频繁发送'),
('phone_1hour_20', '同一手机号1小时内最多20条', 'phone', 3600, 20, NULL, 9, 1, '防止对同一手机号频繁发送'),
('phone_1day_100', '同一手机号1天内最多100条', 'phone', 86400, 100, NULL, 8, 1, '防止对同一手机号频繁发送'),
('user_1min_1000', '同一用户1分钟内最多1000条', 'user', 60, 1000, NULL, 5, 1, '用户级别发送量限制'),
('user_1day_100000', '同一用户1天内最多100000条', 'user', 86400, 100000, NULL, 4, 1, '用户级别日发送量限制');

-- 初始化敏感词
INSERT INTO sensitive_words (word, level, category) VALUES
('赌博', 2, '违法违规'),
('色情', 2, '违法违规'),
('毒品', 2, '违法违规'),
('诈骗', 2, '违法违规'),
('办证', 1, '敏感内容'),
('刻章', 1, '敏感内容'),
('代开发票', 2, '违法违规'),
('中奖', 1, '营销敏感'),
('免费', 1, '营销敏感'),
('绝对', 1, '极限词');

-- 初始化合规规则
INSERT INTO compliance_rules (rule_code, rule_name, rule_type, rule_content, action, priority, status, description)
VALUES
('sensitive_word_check', '敏感词检查', 'sensitive_word', 'all', 'block', 100, 1, '检查是否包含敏感词'),
('max_length_70', '短信长度限制', 'length', '70', 'block', 90, 1, '单条短信最大长度70字符'),
('phone_blacklist', '黑名单号码', 'blacklist', '', 'block', 80, 1, '检查号码是否在黑名单');

-- 初始化路由规则
INSERT INTO routing_rules (rule_code, rule_name, template_type, phone_prefix, target_provider_id, weight, priority, status)
VALUES
('verification_aliyun', '验证码优先阿里云', '验证码', NULL, (SELECT id FROM providers WHERE provider_code = 'aliyun_sms'), 3, 100, 1),
('marketing_tencent', '营销优先腾讯', '营销', NULL, (SELECT id FROM providers WHERE provider_code = 'tencent_sms'), 2, 90, 1),
('notification_huawei', '通知优先华为', '通知', NULL, (SELECT id FROM providers WHERE provider_code = 'huawei_sms'), 1, 80, 1);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 账户表
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK(category IN ('asset', 'liability')),
    currency VARCHAR(10) NOT NULL DEFAULT 'CNY',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_category ON accounts(category);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);

-- 估值记录表
CREATE TABLE IF NOT EXISTS valuations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    market_value DECIMAL(20,4) NOT NULL,
    cost_value DECIMAL(20,4) NOT NULL DEFAULT 0,
    exchange_rate DECIMAL(15,6) NOT NULL DEFAULT 1,
    valuation_date DATE NOT NULL,
    data_source VARCHAR(50) NOT NULL,
    manual_adjust_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_valuations_account_id ON valuations(account_id);
CREATE INDEX IF NOT EXISTS idx_valuations_valuation_date ON valuations(valuation_date);

-- 收支流水表
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(10) NOT NULL CHECK(type IN ('income', 'expense')),
    amount DECIMAL(20,4) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'CNY',
    category VARCHAR(100) NOT NULL,
    tags TEXT,
    member VARCHAR(50),
    project VARCHAR(100),
    description TEXT,
    transaction_date DATE NOT NULL,
    attachment VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

-- 转账记录表
CREATE TABLE IF NOT EXISTS transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_account_id INTEGER NOT NULL REFERENCES accounts(id),
    to_account_id INTEGER NOT NULL REFERENCES accounts(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    amount DECIMAL(20,4) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'CNY',
    exchange_rate DECIMAL(15,6),
    fee DECIMAL(20,4) DEFAULT 0,
    description TEXT,
    transfer_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transfers_from_account ON transfers(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_account ON transfers(to_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_user_id ON transfers(user_id);
CREATE INDEX IF NOT EXISTS idx_transfers_transfer_date ON transfers(transfer_date);

-- 分类表
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK(type IN ('income', 'expense')),
    parent_id INTEGER REFERENCES categories(id),
    user_id INTEGER REFERENCES users(id),
    is_system BOOLEAN DEFAULT 0,
    UNIQUE(name, type, user_id)
);

-- 标签表
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    color VARCHAR(20),
    UNIQUE(name, user_id)
);

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INTEGER,
    details TEXT,
    ip_address VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_operation_logs_user_id ON operation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_operation_logs_created_at ON operation_logs(created_at);

-- 初始化系统分类
INSERT OR IGNORE INTO categories (name, type, is_system) VALUES
    ('工资', 'income', 1),
    ('奖金', 'income', 1),
    ('投资收益', 'income', 1),
    ('其他收入', 'income', 1),
    ('餐饮', 'expense', 1),
    ('交通', 'expense', 1),
    ('购物', 'expense', 1),
    ('娱乐', 'expense', 1),
    ('医疗', 'expense', 1),
    ('教育', 'expense', 1),
    ('住房', 'expense', 1),
    ('水电煤', 'expense', 1),
    ('通讯', 'expense', 1),
    ('其他支出', 'expense', 1);

-- 初始化默认管理员 (密码: admin123)
INSERT OR IGNORE INTO users (username, email, password_hash, role) VALUES
    ('admin', 'admin@example.com', '$2a$10$gu86gJYF2RqHRimzD9LUAeivcYc7XO.wGbPEBvAhgfE2RAdgFL93e', 'admin');

-- 初始化默认测试用户 (密码: user123)
INSERT OR IGNORE INTO users (username, email, password_hash, role) VALUES
    ('user', 'user@example.com', '$2a$10$itjd758trvSW2AtX6hVaPunOnjDD44JUU3EMXX5ad9pBsyykDmaSK', 'user');

-- 家庭协作者账户 (密码: collab123)
INSERT OR IGNORE INTO users (username, email, password_hash, role) VALUES
    ('collaborator', 'collab@example.com', '$2a$10$XU7yW7yW7yW7yW7yW7yW7yW7yW7yW7yW7yW7yW7yW7yW7yW7yW7', 'collaborator');

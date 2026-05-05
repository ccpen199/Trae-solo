-- 教师管理系统数据库初始化脚本
-- 数据库: teacher_management

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 部门表
CREATE TABLE IF NOT EXISTS departments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 教师档案表
CREATE TABLE IF NOT EXISTS teachers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    birth_date DATE,
    id_card VARCHAR(18) UNIQUE,
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    education VARCHAR(50),
    major VARCHAR(100),
    department_id UUID REFERENCES departments(id),
    position VARCHAR(100),
    entry_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'probation', -- probation, regular, resigned, fired
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 教师账号/教师卡表
CREATE TABLE IF NOT EXISTS teacher_accounts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE UNIQUE,
    card_account VARCHAR(100) NOT NULL UNIQUE,
    card_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 转正审批流程表
CREATE TABLE IF NOT EXISTS approvals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    approval_type VARCHAR(50) NOT NULL DEFAULT 'regularization', -- regularization, promotion, etc.
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    submit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expect_regular_date DATE,
    reason TEXT,
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 审批历史记录表
CREATE TABLE IF NOT EXISTS approval_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    approval_id UUID REFERENCES approvals(id) ON DELETE CASCADE,
    step INTEGER NOT NULL,
    approver VARCHAR(100),
    department VARCHAR(100),
    action VARCHAR(20) NOT NULL, -- approve, reject, transfer
    comment TEXT,
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初始化部门数据
INSERT INTO departments (name, description) VALUES
('语文组', '语文教学部门'),
('数学组', '数学教学部门'),
('英语组', '英语教学部门'),
('物理组', '物理教学部门'),
('化学组', '化学教学部门'),
('生物组', '生物教学部门'),
('历史组', '历史教学部门'),
('地理组', '地理教学部门'),
('政治组', '政治教学部门'),
('行政部', '行政管理部门'),
('人事部', '人事管理部门')
ON CONFLICT (name) DO NOTHING;

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_teachers_name ON teachers(name);
CREATE INDEX IF NOT EXISTS idx_teachers_status ON teachers(status);
CREATE INDEX IF NOT EXISTS idx_teachers_department ON teachers(department_id);
CREATE INDEX IF NOT EXISTS idx_approvals_teacher ON approvals(teacher_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approval_history_approval ON approval_history(approval_id);

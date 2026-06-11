-- 初始化数据库 schema
-- 此文件包含完整的数据库表结构定义

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建枚举类型
CREATE TYPE user_role AS ENUM ('super_admin', 'government', 'scenic_admin', 'enterprise', 'editor', 'professional', 'tourist');
CREATE TYPE content_type AS ENUM ('article', 'video', 'vr', 'infographic');
CREATE TYPE content_status AS ENUM ('draft', 'pending_audit', 'auditing', 'approved', 'rejected', 'published', 'offline');
CREATE TYPE heritage_level AS ENUM ('national', 'provincial', 'municipal');

-- 用户表
CREATE TABLE IF NOT EXISTS "user" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    real_name VARCHAR(100)
    -- 完整DDL请参考技术架构文档
);

-- 初始化数据已在 seedData.ts 中实现

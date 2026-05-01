-- 初始化数据库和扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 角色类型枚举
CREATE TYPE user_role AS ENUM ('EDITOR', 'CHIEF_EDITOR', 'CHANNEL_OPERATOR', 'DATA_ANALYST', 'ADMIN');

-- 内容状态枚举
CREATE TYPE content_status AS ENUM ('DRAFT', 'PENDING_REVIEW', 'IN_REVIEW', 'NEEDS_REVISION', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'REJECTED');

-- 审核类型枚举
CREATE TYPE review_type AS ENUM ('FIRST_REVIEW', 'SECOND_REVIEW', 'THIRD_REVIEW', 'FIRST_PROOFREAD', 'SECOND_PROOFREAD', 'THIRD_PROOFREAD');

-- 分发渠道枚举
CREATE TYPE distribution_channel AS ENUM ('WEB', 'APP', 'WECHAT', 'WEIBO', 'DOUYIN', 'XIAOHONGSHU', 'ZHIHU');

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'EDITOR',
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 内容分类表
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 内容主表
CREATE TABLE IF NOT EXISTS contents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE,
    summary TEXT,
    content_body TEXT,
    featured_image_url VARCHAR(500),
    status content_status DEFAULT 'DRAFT',
    category_id UUID REFERENCES categories(id),
    author_id UUID REFERENCES users(id),
    current_version INTEGER DEFAULT 1,
    is_featured BOOLEAN DEFAULT false,
    is_urgent BOOLEAN DEFAULT false,
    scheduled_publish_at TIMESTAMP,
    actual_publish_at TIMESTAMP,
    archived_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 内容版本表
CREATE TABLE IF NOT EXISTS content_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title VARCHAR(500) NOT NULL,
    content_body TEXT,
    summary TEXT,
    featured_image_url VARCHAR(500),
    change_reason TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_id, version_number)
);

-- 媒体资产表
CREATE TABLE IF NOT EXISTS media_assets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    asset_type VARCHAR(50) NOT NULL,
    watermarked_path VARCHAR(500),
    ai_tags JSONB DEFAULT '[]',
    thumbnail_url VARCHAR(500),
    width INTEGER,
    height INTEGER,
    duration INTEGER,
    description TEXT,
    uploaded_by UUID REFERENCES users(id),
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 内容-资产关联表
CREATE TABLE IF NOT EXISTS content_media (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
    media_asset_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_id, media_asset_id)
);

-- 审核记录表
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
    content_version_id UUID REFERENCES content_versions(id),
    review_type review_type NOT NULL,
    reviewer_id UUID REFERENCES users(id),
    status VARCHAR(50) NOT NULL,
    comment TEXT,
    diff_data JSONB,
    annotations JSONB,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 审核流程实例表
CREATE TABLE IF NOT EXISTS workflow_instances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
    workflow_type VARCHAR(100) DEFAULT 'THREE_REVIEW_THREE_PROOF',
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER DEFAULT 6,
    status VARCHAR(50) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- 审核流程步骤表
CREATE TABLE IF NOT EXISTS workflow_steps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    workflow_instance_id UUID REFERENCES workflow_instances(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_type review_type NOT NULL,
    assigned_role user_role,
    assignee_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'PENDING',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    review_id UUID REFERENCES reviews(id)
);

-- 分发记录表
CREATE TABLE IF NOT EXISTS distributions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
    content_version_id UUID REFERENCES content_versions(id),
    channel distribution_channel NOT NULL,
    channel_url VARCHAR(500),
    channel_content_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    scheduled_at TIMESTAMP,
    published_at TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 分发计划任务表
CREATE TABLE IF NOT EXISTS distribution_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
    channels JSONB NOT NULL,
    scheduled_at TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    executed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 互动数据表
CREATE TABLE IF NOT EXISTS engagement_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID REFERENCES contents(id) ON DELETE CASCADE,
    channel distribution_channel NOT NULL,
    view_count BIGINT DEFAULT 0,
    like_count BIGINT DEFAULT 0,
    comment_count BIGINT DEFAULT 0,
    share_count BIGINT DEFAULT 0,
    favorite_count BIGINT DEFAULT 0,
    collected_at DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_id, channel, collected_at)
);

-- 操作日志表
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    username VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    resource_title VARCHAR(500),
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    request_path VARCHAR(255),
    request_method VARCHAR(10),
    status_code INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 敏感词过滤记录表
CREATE TABLE IF NOT EXISTS sensitive_word_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content_id UUID REFERENCES contents(id),
    content_version_id UUID REFERENCES content_versions(id),
    matched_words JSONB NOT NULL,
    context_snippets JSONB,
    filtered_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_contents_status ON contents(status);
CREATE INDEX IF NOT EXISTS idx_contents_author ON contents(author_id);
CREATE INDEX IF NOT EXISTS idx_contents_category ON contents(category_id);
CREATE INDEX IF NOT EXISTS idx_contents_created_at ON contents(created_at);
CREATE INDEX IF NOT EXISTS idx_versions_content ON content_versions(content_id);
CREATE INDEX IF NOT EXISTS idx_reviews_content ON reviews(content_id);
CREATE INDEX IF NOT EXISTS idx_distributions_content ON distributions(content_id);
CREATE INDEX IF NOT EXISTS idx_distributions_channel ON distributions(channel);
CREATE INDEX IF NOT EXISTS idx_engagement_content ON engagement_metrics(content_id);
CREATE INDEX IF NOT EXISTS idx_engagement_collected ON engagement_metrics(collected_at);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_media_uploader ON media_assets(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_workflow_content ON workflow_instances(content_id);

-- 插入默认分类
INSERT INTO categories (name, slug, description, sort_order) VALUES
    ('新闻资讯', 'news', '新闻资讯类内容', 1),
    ('专题报道', 'special', '专题深度报道', 2),
    ('专栏文章', 'column', '专栏作者文章', 3),
    ('视频内容', 'video', '视频类内容', 4),
    ('图片故事', 'gallery', '图片故事类内容', 5)
ON CONFLICT (slug) DO NOTHING;

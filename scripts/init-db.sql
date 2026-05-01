-- 短视频内容平台数据库初始化脚本
-- 创建时间: 2024-04-28

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 枚举类型定义
CREATE TYPE user_role AS ENUM ('viewer', 'creator', 'auditor', 'advertiser', 'admin');
CREATE TYPE video_status AS ENUM ('uploading', 'transcoding', 'safety_checking', 'pending_review', 'published', 'rejected', 'taken_down');
CREATE TYPE ad_status AS ENUM ('draft', 'pending_review', 'active', 'paused', 'rejected', 'expired');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'view', 'approve', 'reject', 'upload', 'download');
CREATE TYPE interaction_type AS ENUM ('like', 'comment', 'share', 'collect', 'play', 'complete');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'refund');

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'viewer',
    avatar_url VARCHAR(500),
    nickname VARCHAR(100),
    bio TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 用户权限表
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    permission_key VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    can_create BOOLEAN NOT NULL DEFAULT FALSE,
    can_read BOOLEAN NOT NULL DEFAULT FALSE,
    can_update BOOLEAN NOT NULL DEFAULT FALSE,
    can_delete BOOLEAN NOT NULL DEFAULT FALSE,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    UNIQUE(user_id, permission_key, resource_type, resource_id)
);

-- 角色权限模板
CREATE TABLE role_permission_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role user_role NOT NULL,
    permission_key VARCHAR(100) NOT NULL,
    can_create BOOLEAN NOT NULL DEFAULT FALSE,
    can_read BOOLEAN NOT NULL DEFAULT FALSE,
    can_update BOOLEAN NOT NULL DEFAULT FALSE,
    can_delete BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, permission_key)
);

-- 视频表
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    original_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    duration INTEGER NOT NULL DEFAULT 0,
    width INTEGER,
    height INTEGER,
    file_size BIGINT NOT NULL DEFAULT 0,
    format VARCHAR(20),
    status video_status NOT NULL DEFAULT 'uploading',
    visibility VARCHAR(20) NOT NULL DEFAULT 'public',
    category VARCHAR(50),
    tags TEXT[],
    hot_score DECIMAL(10,4) NOT NULL DEFAULT 0,
    view_count BIGINT NOT NULL DEFAULT 0,
    like_count BIGINT NOT NULL DEFAULT 0,
    comment_count BIGINT NOT NULL DEFAULT 0,
    share_count BIGINT NOT NULL DEFAULT 0,
    collect_count BIGINT NOT NULL DEFAULT 0,
    complete_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 视频版本历史表
CREATE TABLE video_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id),
    version INTEGER NOT NULL,
    title VARCHAR(200),
    description TEXT,
    visibility VARCHAR(20),
    tags TEXT[],
    changed_by UUID REFERENCES users(id),
    change_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 视频转码记录
CREATE TABLE video_transcodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id),
    quality VARCHAR(20) NOT NULL,
    resolution VARCHAR(20) NOT NULL,
    bitrate INTEGER NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    duration INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 安全检测记录表
CREATE TABLE safety_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id),
    check_type VARCHAR(50) NOT NULL,
    risk_level risk_level NOT NULL DEFAULT 'low',
    risk_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    risk_categories TEXT[],
    risk_details TEXT,
    is_manual_review_required BOOLEAN NOT NULL DEFAULT FALSE,
    engine_version VARCHAR(50),
    checked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 审核记录表
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id),
    auditor_id UUID REFERENCES users(id),
    previous_status video_status,
    new_status video_status NOT NULL,
    decision_type VARCHAR(20) NOT NULL,
    reason TEXT,
    risk_level risk_level,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 用户观看记录表
CREATE TABLE view_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    video_id UUID NOT NULL REFERENCES videos(id),
    session_id VARCHAR(100),
    device_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    watch_duration INTEGER NOT NULL DEFAULT 0,
    is_complete BOOLEAN NOT NULL DEFAULT FALSE,
    watch_progress DECIMAL(5,4) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 互动记录表
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    video_id UUID NOT NULL REFERENCES videos(id),
    comment_id UUID,
    interaction_type interaction_type NOT NULL,
    content TEXT,
    device_id VARCHAR(100),
    ip_address VARCHAR(45),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_by UUID REFERENCES users(id),
    deleted_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 评论表
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id),
    user_id UUID NOT NULL REFERENCES users(id),
    parent_id UUID REFERENCES comments(id),
    root_id UUID REFERENCES comments(id),
    content TEXT NOT NULL,
    is_filtered BOOLEAN NOT NULL DEFAULT FALSE,
    filter_reason TEXT,
    like_count BIGINT NOT NULL DEFAULT 0,
    reply_count BIGINT NOT NULL DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_by UUID REFERENCES users(id),
    deleted_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 广告表
CREATE TABLE ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advertiser_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    video_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    duration INTEGER NOT NULL DEFAULT 0,
    status ad_status NOT NULL DEFAULT 'draft',
    budget DECIMAL(12,2) NOT NULL DEFAULT 0,
    spent_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    cpc DECIMAL(10,4),
    cpm DECIMAL(10,4),
    target_audience JSONB,
    impression_count BIGINT NOT NULL DEFAULT 0,
    click_count BIGINT NOT NULL DEFAULT 0,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- 广告投放记录
CREATE TABLE ad_placements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ad_id UUID NOT NULL REFERENCES ads(id),
    user_id UUID REFERENCES users(id),
    video_id UUID REFERENCES videos(id),
    session_id VARCHAR(100),
    device_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    impression_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    click_time TIMESTAMP,
    is_impression BOOLEAN NOT NULL DEFAULT TRUE,
    is_click BOOLEAN NOT NULL DEFAULT FALSE,
    cost DECIMAL(10,4) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 收益流水表
CREATE TABLE revenue_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    video_id UUID REFERENCES videos(id),
    ad_placement_id UUID REFERENCES ad_placements(id),
    transaction_type transaction_type NOT NULL,
    amount DECIMAL(12,4) NOT NULL,
    balance_after DECIMAL(12,4) NOT NULL,
    description TEXT,
    reference_type VARCHAR(50),
    reference_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创作者收益统计
CREATE TABLE creator_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id),
    video_id UUID NOT NULL REFERENCES videos(id),
    date DATE NOT NULL,
    view_count BIGINT NOT NULL DEFAULT 0,
    ad_impressions BIGINT NOT NULL DEFAULT 0,
    ad_clicks BIGINT NOT NULL DEFAULT 0,
    revenue DECIMAL(12,4) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(creator_id, video_id, date)
);

-- 用户画像表
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    interests TEXT[],
    preferred_categories TEXT[],
    watch_duration_total BIGINT NOT NULL DEFAULT 0,
    average_watch_duration INTEGER NOT NULL DEFAULT 0,
    complete_rate_avg DECIMAL(5,4) NOT NULL DEFAULT 0,
    like_categories TEXT[],
    collect_categories TEXT[],
    share_categories TEXT[],
    device_info JSONB,
    location_info JSONB,
    last_active_at TIMESTAMP,
    engagement_score DECIMAL(10,4) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 推荐记录表
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    video_id UUID NOT NULL REFERENCES videos(id),
    session_id VARCHAR(100),
    algorithm_version VARCHAR(50),
    recommend_score DECIMAL(10,4) NOT NULL DEFAULT 0,
    position INTEGER NOT NULL,
    is_clicked BOOLEAN NOT NULL DEFAULT FALSE,
    is_watched BOOLEAN NOT NULL DEFAULT FALSE,
    watch_duration INTEGER NOT NULL DEFAULT 0,
    is_complete BOOLEAN NOT NULL DEFAULT FALSE,
    feedback_score DECIMAL(5,4),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 审计日志表
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action audit_action NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    request_id VARCHAR(100),
    session_id VARCHAR(100),
    device_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    service_name VARCHAR(50),
    request_path VARCHAR(255),
    request_method VARCHAR(10),
    response_status INTEGER,
    response_time INTEGER,
    is_successful BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 系统配置表
CREATE TABLE system_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    config_type VARCHAR(20) NOT NULL DEFAULT 'string',
    description TEXT,
    is_encrypted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 索引创建
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_videos_creator_id ON videos(creator_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_created_at ON videos(created_at);
CREATE INDEX idx_videos_hot_score ON videos(hot_score DESC);
CREATE INDEX idx_view_history_user_id ON view_history(user_id);
CREATE INDEX idx_view_history_video_id ON view_history(video_id);
CREATE INDEX idx_interactions_user_id ON interactions(user_id);
CREATE INDEX idx_interactions_video_id ON interactions(video_id);
CREATE INDEX idx_comments_video_id ON comments(video_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_ads_advertiser_id ON ads(advertiser_id);
CREATE INDEX idx_ads_status ON ads(status);
CREATE INDEX idx_ad_placements_ad_id ON ad_placements(ad_id);
CREATE INDEX idx_revenue_transactions_user_id ON revenue_transactions(user_id);
CREATE INDEX idx_creator_earnings_creator_id ON creator_earnings(creator_id);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX idx_recommendations_video_id ON recommendations(video_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_safety_checks_video_id ON safety_checks(video_id);
CREATE INDEX idx_reviews_video_id ON reviews(video_id);
CREATE INDEX idx_reviews_auditor_id ON reviews(auditor_id);
CREATE INDEX idx_video_transcodes_video_id ON video_transcodes(video_id);

-- 角色权限模板初始化
INSERT INTO role_permission_templates (role, permission_key, can_create, can_read, can_update, can_delete, description) VALUES
-- 普通观众权限
('viewer', 'video:view', FALSE, TRUE, FALSE, FALSE, '观看视频'),
('viewer', 'video:search', FALSE, TRUE, FALSE, FALSE, '搜索视频'),
('viewer', 'interaction:like', TRUE, TRUE, TRUE, TRUE, '点赞操作'),
('viewer', 'interaction:comment', TRUE, TRUE, TRUE, TRUE, '评论操作'),
('viewer', 'interaction:share', TRUE, TRUE, FALSE, FALSE, '分享操作'),
('viewer', 'interaction:collect', TRUE, TRUE, TRUE, TRUE, '收藏操作'),
('viewer', 'profile:view', FALSE, TRUE, FALSE, FALSE, '查看个人资料'),
('viewer', 'profile:update', FALSE, FALSE, TRUE, FALSE, '更新个人资料'),

-- 创作者权限（包含观众权限）
('creator', 'video:upload', TRUE, FALSE, FALSE, FALSE, '上传视频'),
('creator', 'video:manage', FALSE, TRUE, TRUE, TRUE, '管理自己的视频'),
('creator', 'video:stats', FALSE, TRUE, FALSE, FALSE, '查看视频数据'),
('creator', 'revenue:view', FALSE, TRUE, FALSE, FALSE, '查看收益'),
('creator', 'revenue:withdraw', FALSE, FALSE, TRUE, FALSE, '提现操作'),

-- 审核员权限
('auditor', 'video:review', FALSE, TRUE, TRUE, FALSE, '审核视频'),
('auditor', 'safety:manage', FALSE, TRUE, TRUE, FALSE, '安全管理'),
('auditor', 'comment:moderate', FALSE, TRUE, TRUE, TRUE, '评论管理'),
('auditor', 'audit:view', FALSE, TRUE, FALSE, FALSE, '查看审计日志'),

-- 广告主权限
('advertiser', 'ad:create', TRUE, FALSE, FALSE, FALSE, '创建广告'),
('advertiser', 'ad:manage', FALSE, TRUE, TRUE, TRUE, '管理广告'),
('advertiser', 'ad:stats', FALSE, TRUE, FALSE, FALSE, '查看广告数据'),
('advertiser', 'recharge:manage', FALSE, TRUE, TRUE, FALSE, '充值管理'),

-- 管理员权限
('admin', 'system:config', TRUE, TRUE, TRUE, TRUE, '系统配置'),
('admin', 'user:manage', TRUE, TRUE, TRUE, TRUE, '用户管理'),
('admin', 'role:manage', TRUE, TRUE, TRUE, TRUE, '角色管理'),
('admin', 'audit:full', FALSE, TRUE, FALSE, FALSE, '完整审计权限'),
('admin', 'report:view', FALSE, TRUE, FALSE, FALSE, '查看报表');

-- 系统配置初始化
INSERT INTO system_configs (config_key, config_value, config_type, description, is_encrypted) VALUES
('video.max_file_size', '536870912', 'number', '视频最大文件大小(512MB)', FALSE),
('video.allowed_formats', '["mp4", "mov", "avi", "mkv", "webm"]', 'json', '允许的视频格式', FALSE),
('video.transcode_qualities', '["360p", "480p", "720p", "1080p"]', 'json', '转码清晰度', FALSE),
('recommendation.feed_size', '10', 'number', '每次推荐视频数量', FALSE),
('recommendation.update_interval', '300', 'number', '推荐权重更新间隔(秒)', FALSE),
('safety.auto_reject_threshold', '0.9', 'number', '自动拒绝风险阈值', FALSE),
('safety.manual_review_threshold', '0.6', 'number', '人工审核风险阈值', FALSE),
('engagement.comment_filter_enabled', 'true', 'boolean', '是否启用评论过滤', FALSE),
('engagement.hot_score_decay', '0.95', 'number', '热度衰减系数', FALSE),
('ad.impression_ratio', '0.1', 'number', '广告展示比例(10%)', FALSE),
('ad.min_cpc', '0.1', 'number', '最小点击单价', FALSE),
('ad.min_cpm', '1.0', 'number', '最小千次展示单价', FALSE),
('revenue.creator_share', '0.7', 'number', '创作者分成比例(70%)', FALSE),
('revenue.min_withdraw', '100.0', 'number', '最低提现金额', FALSE);

-- 创建默认管理员账号（密码: Admin123!，实际使用时请修改）
INSERT INTO users (id, username, email, password_hash, role, nickname, is_active, is_verified) VALUES
(uuid_generate_v4(), 'admin', 'admin@videoplatform.com', '$2b$10$placeholder_hash_change_this', 'admin', '系统管理员', TRUE, TRUE);

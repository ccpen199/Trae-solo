export const schema = `
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operation', 'lecturer', 'legal', 'customer_service')),
  email TEXT,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 讲师表
CREATE TABLE IF NOT EXISTS lecturers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  id_card TEXT UNIQUE,
  phone TEXT,
  email TEXT,
  contract_no TEXT,
  contract_start_date DATE,
  contract_end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 课程表
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  lecturer_id INTEGER,
  category TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'published', 'offline')),
  price DECIMAL(10,2) DEFAULT 0,
  is_free INTEGER DEFAULT 0,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lecturer_id) REFERENCES lecturers(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 素材类型字典
CREATE TABLE IF NOT EXISTS material_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT
);

-- 素材表
CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video', 'courseware', 'handout', 'question_bank', 'authorization', 'other')),
  file_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  duration INTEGER,
  course_id INTEGER,
  lecturer_id INTEGER,
  source TEXT CHECK (source IN ('original', 'authorized', 'public_domain', 'unknown')),
  authorization_status TEXT DEFAULT 'pending' CHECK (authorization_status IN ('pending', 'authorized', 'unauthorized', 'expired')),
  authorization_file_id INTEGER,
  authorization_start_date DATE,
  authorization_end_date DATE,
  usage_scope TEXT CHECK (usage_scope IN ('internal', 'commercial', 'non_commercial', 'limited')),
  usage_scope_detail TEXT,
  watermark_strategy TEXT CHECK (watermark_strategy IN ('none', 'text', 'image', 'embedded')),
  watermark_content TEXT,
  download_permission INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  md5_hash TEXT,
  version TEXT DEFAULT '1.0',
  description TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (lecturer_id) REFERENCES lecturers(id),
  FOREIGN KEY (authorization_file_id) REFERENCES materials(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 素材授权关联表
CREATE TABLE IF NOT EXISTS material_authorizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_id INTEGER NOT NULL,
  authorization_file_id INTEGER,
  authorization_no TEXT,
  authorization_type TEXT CHECK (authorization_type IN ('exclusive', 'non_exclusive', 'sublicense')),
  authorized_party TEXT,
  authorizing_party TEXT,
  start_date DATE,
  end_date DATE,
  territory TEXT,
  terms TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (material_id) REFERENCES materials(id),
  FOREIGN KEY (authorization_file_id) REFERENCES materials(id)
);

-- 上架检查表
CREATE TABLE IF NOT EXISTS publication_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  reviewer_id INTEGER,
  review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
  authorization_verified INTEGER DEFAULT 0,
  source_verified INTEGER DEFAULT 0,
  watermark_configured INTEGER DEFAULT 0,
  download_permission_set INTEGER DEFAULT 0,
  validity_verified INTEGER DEFAULT 0,
  issues TEXT,
  suggestions TEXT,
  reviewed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

-- 盗版线索表
CREATE TABLE IF NOT EXISTS piracy_clues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  clue_no TEXT UNIQUE NOT NULL,
  source_channel TEXT CHECK (source_channel IN ('online_search', 'user_report', 'internal_monitor', 'third_party', 'other')),
  infringing_url TEXT,
  infringing_platform TEXT,
  infringing_content TEXT,
  similarity_score INTEGER,
  related_course_id INTEGER,
  related_material_id INTEGER,
  impact_scope TEXT CHECK (impact_scope IN ('minor', 'moderate', 'major', 'critical')),
  estimated_loss DECIMAL(15,2),
  evidence_screenshots TEXT,
  evidence_description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'confirmed', 'processing', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  discovered_date DATE,
  discovered_by INTEGER,
  assigned_to INTEGER,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (related_course_id) REFERENCES courses(id),
  FOREIGN KEY (related_material_id) REFERENCES materials(id),
  FOREIGN KEY (discovered_by) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- 维权案件表
CREATE TABLE IF NOT EXISTS enforcement_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_no TEXT UNIQUE NOT NULL,
  piracy_clue_id INTEGER NOT NULL,
  case_type TEXT CHECK (case_type IN ('takedown', 'cease_and_desist', 'lawsuit', 'settlement')),
  status TEXT DEFAULT 'notice_sent' CHECK (status IN ('notice_sent', 'platform_notified', 'lawyer_letter_sent', 'takedown_confirmed', 'reviewing', 'closed', 'appealing')),
  related_course_id INTEGER,
  related_material_id INTEGER,
  infringing_url TEXT,
  infringing_platform TEXT,
  notice_sent_date DATE,
  platform_response_date DATE,
  lawyer_letter_sent_date DATE,
  takedown_date DATE,
  settlement_amount DECIMAL(15,2),
  result_description TEXT,
  handled_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (piracy_clue_id) REFERENCES piracy_clues(id),
  FOREIGN KEY (related_course_id) REFERENCES courses(id),
  FOREIGN KEY (related_material_id) REFERENCES materials(id),
  FOREIGN KEY (handled_by) REFERENCES users(id)
);

-- 维权证据附件表
CREATE TABLE IF NOT EXISTS enforcement_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  attachment_type TEXT CHECK (attachment_type IN ('evidence', 'notice', 'lawyer_letter', 'response', 'other')),
  description TEXT,
  uploaded_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES enforcement_cases(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- 操作日志表（审计追踪）
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  record_id INTEGER,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_materials_course ON materials(course_id);
CREATE INDEX IF NOT EXISTS idx_materials_lecturer ON materials(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(type);
CREATE INDEX IF NOT EXISTS idx_piracy_clues_status ON piracy_clues(status);
CREATE INDEX IF NOT EXISTS idx_piracy_clues_course ON piracy_clues(related_course_id);
CREATE INDEX IF NOT EXISTS idx_enforcement_cases_status ON enforcement_cases(status);
CREATE INDEX IF NOT EXISTS idx_enforcement_cases_clue ON enforcement_cases(piracy_clue_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
`;

export const initialData = `
-- 插入素材类型
INSERT OR IGNORE INTO material_types (code, name, description) VALUES
('video', '视频', '课程视频录像'),
('courseware', '课件', 'PPT、PDF等教学课件'),
('handout', '讲义', '教学讲义文档'),
('question_bank', '题库', '练习题、考试题'),
('authorization', '授权文件', '版权授权协议、证明文件');

-- 插入默认用户（密码都是 123456）
INSERT OR IGNORE INTO users (username, password_hash, name, role, email) VALUES
('admin', '$2a$10$WvzCm9rU4DwA7wsz.h762uyNkeHFvSVLbAdRgoXkeLl6LKuUGmvwO', '系统管理员', 'admin', 'admin@example.com'),
('operation1', '$2a$10$WvzCm9rU4DwA7wsz.h762uyNkeHFvSVLbAdRgoXkeLl6LKuUGmvwO', '运营专员', 'operation', 'operation1@example.com'),
('lecturer1', '$2a$10$WvzCm9rU4DwA7wsz.h762uyNkeHFvSVLbAdRgoXkeLl6LKuUGmvwO', '张讲师', 'lecturer', 'lecturer1@example.com'),
('legal1', '$2a$10$WvzCm9rU4DwA7wsz.h762uyNkeHFvSVLbAdRgoXkeLl6LKuUGmvwO', '法务专员', 'legal', 'legal1@example.com'),
('cs1', '$2a$10$WvzCm9rU4DwA7wsz.h762uyNkeHFvSVLbAdRgoXkeLl6LKuUGmvwO', '客服专员', 'customer_service', 'cs1@example.com');

-- 插入示例讲师
INSERT OR IGNORE INTO lecturers (name, id_card, phone, email, contract_no, contract_start_date, contract_end_date, status) VALUES
('张明', '110101199001011234', '13800138001', 'zhangming@example.com', 'CT-2024-001', '2024-01-01', '2026-12-31', 'active'),
('李华', '110101199202025678', '13800138002', 'lihua@example.com', 'CT-2024-002', '2024-03-01', '2025-12-31', 'active'),
('王芳', '110101198803039012', '13800138003', 'wangfang@example.com', 'CT-2023-008', '2023-06-01', '2024-06-30', 'active');

-- 插入示例课程
INSERT OR IGNORE INTO courses (course_code, name, description, lecturer_id, category, status, price, created_by) VALUES
('PYTHON-001', 'Python 编程入门到精通', '从零开始学习 Python 编程，适合零基础学员', 1, '编程语言', 'published', 199.00, 1),
('JAVA-001', 'Java 企业级开发实战', 'Java Web 开发全栈教程', 2, '编程语言', 'published', 299.00, 1),
('DESIGN-001', 'UI/UX 设计基础', '用户界面与用户体验设计入门', 3, '设计', 'pending_review', 159.00, 1);

-- 插入示例素材
INSERT OR IGNORE INTO materials (material_code, name, type, course_id, lecturer_id, source, authorization_status, usage_scope, watermark_strategy, download_permission, md5_hash, version, description, created_by, authorization_start_date, authorization_end_date) VALUES
('MAT-VIDEO-001', 'Python 第1讲：环境搭建', 'video', 1, 1, 'original', 'authorized', 'commercial', 'embedded', 0, 'a1b2c3d4e5f6', '1.0', 'Python 入门课程第一讲视频', 2, '2024-01-01', '2026-12-31'),
('MAT-VIDEO-002', 'Python 第2讲：基础语法', 'video', 1, 1, 'original', 'authorized', 'commercial', 'embedded', 0, 'b2c3d4e5f6a1', '1.0', 'Python 入门课程第二讲视频', 2, '2024-01-01', '2026-12-31'),
('MAT-COURSEWARE-001', 'Python 课程PPT', 'courseware', 1, 1, 'original', 'authorized', 'commercial', 'text', 1, 'c3d4e5f6a1b2', '1.1', 'Python 课程全套PPT', 2, '2024-01-01', '2026-12-31'),
('MAT-HANDOUT-001', 'Python 学习讲义', 'handout', 1, 1, 'original', 'authorized', 'commercial', 'none', 1, 'd4e5f6a1b2c3', '1.0', 'Python 课程配套讲义', 2, '2024-01-01', '2026-12-31'),
('MAT-QB-001', 'Python 章节题库', 'question_bank', 1, 1, 'original', 'authorized', 'internal', 'none', 0, 'e5f6a1b2c3d4', '1.0', 'Python 各章节练习题', 2, '2024-01-01', '2026-12-31'),
('MAT-AUTH-001', 'Python 课程授权协议', 'authorization', 1, 1, 'original', 'authorized', 'internal', 'none', 0, 'f6a1b2c3d4e5', '1.0', '讲师授权平台使用课程的协议', 2, '2024-01-01', '2026-12-31'),
('MAT-VIDEO-003', 'Java 第1讲：JDK 安装', 'video', 2, 2, 'original', 'authorized', 'commercial', 'embedded', 0, '1a2b3c4d5e6f', '1.0', 'Java 课程第一讲', 2, '2024-03-01', '2025-12-31'),
('MAT-VIDEO-004', 'UI 设计理论基础', 'video', 3, 3, 'original', 'pending', 'commercial', 'embedded', 0, '2b3c4d5e6f1a', '1.0', 'UI设计课程视频，待审核授权', 2, '2024-06-01', '2024-06-30');

-- 插入示例盗版线索
INSERT OR IGNORE INTO piracy_clues (clue_no, source_channel, infringing_url, infringing_platform, infringing_content, similarity_score, related_course_id, impact_scope, estimated_loss, evidence_description, status, priority, discovered_date, discovered_by, assigned_to) VALUES
('CLUE-2024-001', 'online_search', 'https://bilibili.com/video/BV123456', '哔哩哔哩', '完整Python课程视频上传', 95, 1, 'major', 50000.00, '截图显示完整课程视频被上传，播放量超过10万', 'confirmed', 'high', '2024-05-15', 2, 4),
('CLUE-2024-002', 'user_report', 'https://pan.baidu.com/s/123456', '百度网盘', 'Python课程全套资料打包下载', 100, 1, 'critical', 200000.00, '用户举报的网盘链接，包含全部视频、课件、题库', 'processing', 'urgent', '2024-05-20', 5, 4),
('CLUE-2024-003', 'internal_monitor', 'https://xiaohongshu.com/discovery/item/123', '小红书', 'Java课程视频片段剪辑发布', 85, 2, 'moderate', 10000.00, '多个账号剪辑发布课程片段，引流到私域', 'investigating', 'medium', '2024-05-22', 2, 4),
('CLUE-2024-004', 'third_party', 'https://www.moukeba.com/course/999', '某课堂', '盗版课程低价售卖', 90, 1, 'major', 80000.00, '第三方监测发现某平台以9.9元售卖完整课程', 'pending', 'high', '2024-05-25', 2, 4);

-- 插入示例维权案件
INSERT OR IGNORE INTO enforcement_cases (case_no, piracy_clue_id, case_type, status, related_course_id, related_material_id, infringing_url, infringing_platform, notice_sent_date, platform_response_date, takedown_date, result_description, handled_by) VALUES
('CASE-2024-001', 1, 'takedown', 'takedown_confirmed', 1, 1, 'https://bilibili.com/video/BV123456', '哔哩哔哩', '2024-05-16', '2024-05-17', '2024-05-18', '平台已下架侵权视频，账号被警告', 4),
('CASE-2024-002', 2, 'cease_and_desist', 'lawyer_letter_sent', 1, NULL, 'https://pan.baidu.com/s/123456', '百度网盘', '2024-05-21', NULL, NULL, '已发送律师函，等待网盘平台处理', 4),
('CASE-2024-003', 3, 'takedown', 'platform_notified', 2, 7, 'https://xiaohongshu.com/discovery/item/123', '小红书', '2024-05-23', NULL, NULL, '已通知小红书平台，待处理', 4);

-- 插入示例上架检查记录
INSERT OR IGNORE INTO publication_reviews (course_id, reviewer_id, review_status, authorization_verified, source_verified, watermark_configured, download_permission_set, validity_verified, issues, suggestions, reviewed_at) VALUES
(1, 4, 'approved', 1, 1, 1, 1, 1, NULL, '授权文件齐全，可正常上架', '2024-04-10 10:30:00'),
(2, 4, 'approved', 1, 1, 1, 1, 1, NULL, '资料完整，同意发布', '2024-04-15 14:20:00'),
(3, 4, 'pending', 0, 1, 1, 1, 1, '缺少授权文件', '请补充讲师授权协议后再提交审核', NULL);
`;

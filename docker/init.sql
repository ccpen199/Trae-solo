-- 初始化数据库
-- 创建必要的扩展和初始设置

-- 确保使用正确的数据库
\c online_exam_system;

-- 创建必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建必要的索引优化（已在模型中定义，但确保存在）
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_knowledge_point ON questions(knowledge_point_id);
CREATE INDEX IF NOT EXISTS idx_user_exams_exam_id ON user_exams(exam_id);
CREATE INDEX IF NOT EXISTS idx_user_exams_user_id ON user_exams(user_id);
CREATE INDEX IF NOT EXISTS idx_user_exams_status ON user_exams(status);
CREATE INDEX IF NOT EXISTS idx_anomaly_records_exam_id ON anomaly_records(exam_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_records_user_id ON anomaly_records(user_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_records_status ON anomaly_records(status);

-- 授予权限（如果需要）
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO exam_admin;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO exam_admin;

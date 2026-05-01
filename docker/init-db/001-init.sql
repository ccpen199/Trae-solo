-- 创建数据库和用户
CREATE DATABASE email_marketing;
CREATE DATABASE email_marketing_preview;
CREATE DATABASE email_marketing_test;
CREATE DATABASE email_marketing_mock;

CREATE USER email_marketing WITH ENCRYPTED PASSWORD 'EmailMarketing@2024';
CREATE USER email_marketing_preview WITH ENCRYPTED PASSWORD 'PreviewPassword@2024';
CREATE USER email_marketing_test WITH ENCRYPTED PASSWORD 'TestPassword@2024';
CREATE USER email_marketing_mock WITH ENCRYPTED PASSWORD 'MockPassword@2024';

GRANT ALL PRIVILEGES ON DATABASE email_marketing TO email_marketing;
GRANT ALL PRIVILEGES ON DATABASE email_marketing_preview TO email_marketing_preview;
GRANT ALL PRIVILEGES ON DATABASE email_marketing_test TO email_marketing_test;
GRANT ALL PRIVILEGES ON DATABASE email_marketing_mock TO email_marketing_mock;

-- 创建默认管理员账户 (密码: Admin@2024)
-- 这个密码是经过 bcrypt 哈希的，对应明文密码 "Admin@2024"
INSERT INTO "users" ("id", "email", "password", "name", "role", "is_active", "created_at", "updated_at")
VALUES (
  gen_random_uuid(),
  'admin@example.com',
  '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5E',
  '系统管理员',
  'ADMIN',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

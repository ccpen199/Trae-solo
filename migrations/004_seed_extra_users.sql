-- 为已存在数据库补充 admin/platform/ops 演示账号 + 异常测试用例账号
-- 仅当账号不存在时插入（幂等安全）
-- bcrypt hash 对应明文: 123456

INSERT INTO users (id, role, phone, password_hash, nickname, avatar, status, license_verified, created_at)
SELECT
  'usr_demo_admin_' || lower(hex(randomblob(6))),
  'admin',
  'admin',
  '$2a$10$fCplqM6A4uH4LURNIMj2MeijGRl7F46QtyGETKjKsCUjH5U19eRcS',
  '超级管理员',
  'https://api.dicebear.com/7.x/shapes/svg?seed=admin',
  'active',
  1,
  datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = 'admin');

INSERT INTO users (id, role, phone, password_hash, nickname, avatar, status, license_verified, created_at)
SELECT
  'usr_demo_platform_' || lower(hex(randomblob(6))),
  'platform',
  'platform',
  '$2a$10$fCplqM6A4uH4LURNIMj2MeijGRl7F46QtyGETKjKsCUjH5U19eRcS',
  '平台运营主管',
  'https://api.dicebear.com/7.x/shapes/svg?seed=platform',
  'active',
  1,
  datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = 'platform');

INSERT INTO users (id, role, phone, password_hash, nickname, avatar, status, license_verified, created_at)
SELECT
  'usr_demo_ops_' || lower(hex(randomblob(6))),
  'ops',
  'ops',
  '$2a$10$fCplqM6A4uH4LURNIMj2MeijGRl7F46QtyGETKjKsCUjH5U19eRcS',
  '运维工程师',
  'https://api.dicebear.com/7.x/shapes/svg?seed=ops',
  'active',
  1,
  datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = 'ops');

INSERT INTO users (id, role, phone, password_hash, nickname, avatar, status, license_verified, created_at)
SELECT
  'usr_test_pending_doctor_' || lower(hex(randomblob(6))),
  'doctor',
  '13900000009',
  '$2a$10$fCplqM6A4uH4LURNIMj2MeijGRl7F46QtyGETKjKsCUjH5U19eRcS',
  '待审孙医生',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=pendingdoctor',
  'active',
  0,
  datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '13900000009');

INSERT INTO users (id, role, phone, password_hash, nickname, avatar, status, license_verified, created_at)
SELECT
  'usr_test_disabled_' || lower(hex(randomblob(6))),
  'owner',
  '13500000001',
  '$2a$10$fCplqM6A4uH4LURNIMj2MeijGRl7F46QtyGETKjKsCUjH5U19eRcS',
  '禁用账号示例',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=disabled',
  'disabled',
  1,
  datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '13500000001');

INSERT INTO users (id, role, phone, password_hash, nickname, avatar, status, license_verified, created_at)
SELECT
  'usr_test_pending_hospital_' || lower(hex(randomblob(6))),
  'hospital',
  '13500000002',
  '$2a$10$fCplqM6A4uH4LURNIMj2MeijGRl7F46QtyGETKjKsCUjH5U19eRcS',
  '待审核医院',
  'https://api.dicebear.com/7.x/shapes/svg?seed=pending',
  'pending_review',
  0,
  datetime('now')
WHERE NOT EXISTS (SELECT 1 FROM users WHERE phone = '13500000002');

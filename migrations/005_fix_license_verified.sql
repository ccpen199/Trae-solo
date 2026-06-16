-- 修复 ALTER TABLE 添加 license_verified 默认 0 带来的旧账号资质状态错误
-- 将 active 状态且应该已验证的账号恢复 license_verified=1
-- 保留：13900000009(待审医生)、13500000002(待审医院)、disabled 账号

UPDATE users SET license_verified=1
WHERE (
  role='doctor' AND status='active'
  AND phone IN ('13900000001','13900000002','13900000003','13900000004')
) OR (
  role='hospital' AND status='active' AND phone LIKE '137%'
) OR (
  role='merchant' AND status='active'
) OR (
  role='owner' AND status='active'
);

import { Router } from 'express';
import { db } from '../database';
import { authMiddleware, rbacMiddleware, AuthRequest, auditMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, rbacMiddleware('permissions', 'view'), (_req, res) => {
  const tenantCount = db.prepare('SELECT COUNT(*) as cnt FROM tenants').get() as { cnt: number };
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  const roleCount = db.prepare('SELECT role, COUNT(*) as cnt FROM users GROUP BY role').all() as any[];
  const permissionCount = db.prepare('SELECT COUNT(*) as cnt FROM permissions').get() as { cnt: number };
  const auditCount = db.prepare('SELECT COUNT(*) as cnt FROM audit_logs').get() as { cnt: number };

  const roleBreakdown: Record<string, number> = {};
  roleCount.forEach((r: any) => { roleBreakdown[r.role] = r.cnt; });

  const modules = [
    { key: 'resumes', name: '简历管理', has_tenant_isolation: 1 },
    { key: 'jobs', name: '岗位管理', has_tenant_isolation: 1 },
    { key: 'matching', name: '智能匹配', has_tenant_isolation: 0 },
    { key: 'community', name: '职场社区', has_tenant_isolation: 1 },
    { key: 'chat', name: '直聊系统', has_tenant_isolation: 1 },
    { key: 'leads', name: '客户线索池', has_tenant_isolation: 1 },
    { key: 'lms', name: '网校课程', has_tenant_isolation: 1 },
  ];

  const rolePermissions = [
    { role: 'jobseeker', permissions: ['resumes:view', 'resumes:edit', 'jobs:view', 'jobs:apply', 'matching:view', 'community:view', 'community:post', 'chat:send', 'courses:view', 'learning:progress', 'certificates:view'] },
    { role: 'hr', permissions: ['resumes:view_all', 'jobs:manage', 'matching:view', 'community:view', 'community:moderate', 'chat:send', 'leads:manage', 'card:manage', 'push:send', 'courses:view'] },
    { role: 'trainer', permissions: ['courses:manage', 'courses:publish', 'learning:view_all', 'certificates:issue', 'community:view', 'community:moderate', 'lms:api'] },
    { role: 'admin', permissions: ['*'] },
  ];

  res.json({
    stats: {
      tenantCount: tenantCount.cnt,
      userCount: userCount.cnt,
      permissionCount: permissionCount.cnt,
      auditCount: auditCount.cnt,
      roleBreakdown
    },
    modules,
    rolePermissions,
    securityLayers: [
      { name: 'JWT 认证', status: 'active', description: '所有接口需 Bearer Token 认证' },
      { name: 'RBAC 权限控制', status: 'active', description: '基于角色的细粒度权限控制' },
      { name: '多租户隔离', status: 'active', description: 'SQL 层自动注入 tenant_id 过滤' },
      { name: '操作审计日志', status: 'active', description: '所有写入操作自动留痕' },
      { name: '敏感词过滤', status: 'active', description: '社区内容、聊天消息自动检测' },
      { name: '密码加密', status: 'active', description: 'bcryptjs 哈希存储，10轮盐值' },
    ]
  });
});

router.get('/roles', authMiddleware, rbacMiddleware('permissions', 'view'), (_req, res) => {
  const roles = [
    { key: 'jobseeker', name: '个人求职者', userCount: db.prepare('SELECT COUNT(*) as cnt FROM users WHERE role = ?').get('jobseeker') as any },
    { key: 'hr', name: 'HR招聘专员', userCount: db.prepare('SELECT COUNT(*) as cnt FROM users WHERE role = ?').get('hr') as any },
    { key: 'trainer', name: '培训管理员', userCount: db.prepare('SELECT COUNT(*) as cnt FROM users WHERE role = ?').get('trainer') as any },
    { key: 'admin', name: '系统管理员', userCount: db.prepare('SELECT COUNT(*) as cnt FROM users WHERE role = ?').get('admin') as any },
  ];
  res.json({ roles });
});

router.post('/roles/:userId', authMiddleware, rbacMiddleware('permissions', 'edit'), auditMiddleware('update_user_role', 'user'), (req: AuthRequest, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  if (!['jobseeker', 'hr', 'trainer', 'admin'].includes(role)) {
    return res.status(400).json({ error: '无效角色' });
  }
  db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(role, userId);
  const user = db.prepare('SELECT id, username, name, email, role, tenant_id FROM users WHERE id = ?').get(userId);
  res.json({ user });
});

export default router;

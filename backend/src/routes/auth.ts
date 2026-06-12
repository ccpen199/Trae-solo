import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database';
import { config } from '../config';
import { authMiddleware, AuthRequest, auditMiddleware } from '../middleware/auth';

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: '用户名和密码必填' });
  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username) as any;
  if (!user) return res.status(401).json({ error: '用户不存在' });
  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: '密码错误' });
  if (user.status !== 'active') return res.status(401).json({ error: '账号已禁用' });
  const token = jwt.sign({ userId: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d' });
  res.json({
    token,
    user: {
      id: user.id, username: user.username, name: user.name, email: user.email,
      role: user.role, tenantId: user.tenant_id, avatar: user.avatar, points: user.points
    }
  });
});

router.post('/register', (req, res) => {
  const { username, email, password, name, role = 'jobseeker', tenantId, tenantName } = req.body;
  if (!username || !email || !password || !name) return res.status(400).json({ error: '必填项缺失' });
  const exist = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (exist) return res.status(400).json({ error: '用户名或邮箱已存在' });
  let tid = tenantId;
  if (!tid && (role === 'hr' || role === 'trainer' || role === 'admin')) {
    tid = uuidv4();
    db.prepare('INSERT INTO tenants (id, name, industry) VALUES (?, ?, ?)').run(tid, tenantName || '企业', '未分类');
  }
  const userId = uuidv4();
  const hashed = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, tenant_id, username, email, password, name, role) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(userId, tid, username, email, hashed, name, role);
  const token = jwt.sign({ userId, role }, config.jwtSecret, { expiresIn: '7d' });
  res.json({ token, user: { id: userId, username, name, email, role, tenantId: tid } });
});

router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  const user = db.prepare('SELECT id, username, name, email, role, tenant_id, avatar, phone, points, status FROM users WHERE id = ?').get(req.user!.id) as any;
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(user.tenant_id) as any;
  res.json({ user: { ...user, tenantId: user.tenant_id }, tenant });
});

router.put('/profile', authMiddleware, auditMiddleware('update_profile', 'user'), (req: AuthRequest, res) => {
  const { name, email, phone, avatar } = req.body;
  db.prepare('UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), avatar = COALESCE(?, avatar), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(name, email, phone, avatar, req.user!.id);
  const user = db.prepare('SELECT id, username, name, email, role, tenant_id, avatar, phone, points FROM users WHERE id = ?').get(req.user!.id);
  res.json({ user });
});

router.post('/switch-role', authMiddleware, (req: AuthRequest, res) => {
  const { role } = req.body;
  if (!['jobseeker', 'hr', 'trainer'].includes(role)) return res.status(400).json({ error: '无效角色' });
  db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(role, req.user!.id);
  const token = jwt.sign({ userId: req.user!.id, role }, config.jwtSecret, { expiresIn: '7d' });
  const user = db.prepare('SELECT id, username, name, email, role, tenant_id, avatar, points FROM users WHERE id = ?').get(req.user!.id) as any;
  res.json({
    token,
    user: {
      id: user.id, username: user.username, name: user.name, email: user.email,
      role: user.role, tenantId: user.tenant_id, avatar: user.avatar, points: user.points
    }
  });
});

router.get('/roles/available', authMiddleware, (_req: AuthRequest, res) => {
  res.json({ roles: [
    { key: 'jobseeker', name: '个人求职者', desc: '投递简历、浏览岗位、社区互动' },
    { key: 'hr', name: 'HR招聘专员', desc: '发布岗位、管理简历、线索池、聊天沟通' },
    { key: 'trainer', name: '培训管理员', desc: '课程管理、学习进度、结业证书' }
  ]});
});

export default router;

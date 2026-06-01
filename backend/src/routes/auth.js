import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/init.js';
import { auth } from '../middleware/auth.js';
import { success, error } from '../utils/response.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'parttime_saas_jwt_secret_2026';

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, phone: user.phone, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function safeUser(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return {
    ...rest,
    identity_tags: JSON.parse(row.identity_tags || '[]'),
    skill_certs: JSON.parse(row.skill_certs || '[]'),
  };
}

function addAuditLog(userId, action, targetType, targetId, detail, ip) {
  const db = getDb();
  db.prepare(
    `INSERT INTO audit_logs (user_id, action, target_type, target_id, detail, ip_address) VALUES (?,?,?,?,?,?)`
  ).run(userId, action, targetType, targetId, JSON.stringify(detail || {}), ip || '');
}

router.post('/register', (req, res) => {
  const { username, phone, password, role, nickname, identity_tags, skill_certs, employer_type, employer_name, business_license, university_name } = req.body;
  if (!password || !role) {
    return res.status(400).json(error('密码和角色为必填项'));
  }
  if (!username && !phone) {
    return res.status(400).json(error('用户名或手机号至少填一项'));
  }
  if (!['worker', 'employer', 'admin', 'platform', 'ops', 'university'].includes(role)) {
    return res.status(400).json(error('角色类型无效'));
  }
  const db = getDb();
  if (username) {
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) return res.status(409).json(error('该用户名已注册'));
  }
  if (phone) {
    const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existing) return res.status(409).json(error('该手机号已注册'));
  }
  const password_hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    `INSERT INTO users (username, phone, password_hash, role, nickname, identity_tags, skill_certs, employer_type, employer_name, business_license, university_name)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    username || null, phone || null, password_hash, role, nickname || '',
    JSON.stringify(identity_tags || []),
    JSON.stringify(skill_certs || []),
    employer_type || '', employer_name || '', business_license || '', university_name || ''
  );
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  addAuditLog(user.id, 'register', 'user', user.id, { role, username, phone }, req.ip);
  const token = signToken(user);
  res.json(success({ token, user: safeUser(user) }));
});

router.post('/login', (req, res) => {
  const { account, password } = req.body;
  if (!account || !password) {
    return res.status(400).json(error('账号和密码为必填项'));
  }
  const db = getDb();
  let user = db.prepare('SELECT * FROM users WHERE username = ?').get(account);
  if (!user) {
    user = db.prepare('SELECT * FROM users WHERE phone = ?').get(account);
  }
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json(error('账号或密码错误'));
  }
  if (user.status === 'banned') {
    return res.status(403).json(error('账号已被封禁'));
  }
  addAuditLog(user.id, 'login', 'user', user.id, { account }, req.ip);
  const token = signToken(user);
  res.json(success({ token, user: safeUser(user) }));
});

router.get('/me', auth, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json(error('用户不存在'));
  res.json(success(safeUser(user)));
});

router.put('/profile', auth, (req, res) => {
  const { nickname, avatar, identity_tags, skill_certs, employer_type, employer_name } = req.body;
  const db = getDb();
  const fields = [];
  const values = [];
  if (nickname !== undefined) { fields.push('nickname = ?'); values.push(nickname); }
  if (avatar !== undefined) { fields.push('avatar = ?'); values.push(avatar); }
  if (identity_tags !== undefined) { fields.push('identity_tags = ?'); values.push(JSON.stringify(identity_tags)); }
  if (skill_certs !== undefined) { fields.push('skill_certs = ?'); values.push(JSON.stringify(skill_certs)); }
  if (employer_type !== undefined) { fields.push('employer_type = ?'); values.push(employer_type); }
  if (employer_name !== undefined) { fields.push('employer_name = ?'); values.push(employer_name); }
  if (fields.length === 0) return res.status(400).json(error('无更新字段'));
  fields.push("updated_at = datetime('now','localtime')");
  values.push(req.user.id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  addAuditLog(req.user.id, 'update_profile', 'user', req.user.id, req.body, req.ip);
  res.json(success(safeUser(user)));
});

router.get('/demo-accounts', (_req, res) => {
  res.json(success([
    { username: 'admin', password: 'admin123', role: 'admin', nickname: '超级管理员' },
    { username: 'platform', password: 'platform123', role: 'platform', nickname: '平台运营' },
    { username: 'ops', password: 'ops123', role: 'ops', nickname: '运营管理' },
    { username: 'worker', password: 'worker123', role: 'worker', nickname: '兼职者' },
    { username: 'employer', password: 'employer123', role: 'employer', nickname: '雇主' },
    { username: 'university', password: 'university123', role: 'university', nickname: '高校就业办' },
  ]));
});

export default router;

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import db from '../utils/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function login(req: AuthRequest, res: Response) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空', code: 'EMPTY_CREDENTIALS' });
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  if (!user) {
    return res.status(401).json({ message: '账号不存在，请检查用户名或注册新账号', code: 'USER_NOT_FOUND' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ message: '密码错误，请重新输入', code: 'INVALID_PASSWORD' });
  }

  if (user.status === 'disabled') {
    return res.status(403).json({ message: '账号已被禁用，请联系管理员', code: 'ACCOUNT_DISABLED' });
  }

  if (user.status === 'pending') {
    return res.status(403).json({ message: '企业账号正在审核中，请耐心等待或联系管理员', code: 'ACCOUNT_PENDING' });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET || 'construction_platform_jwt_secret_key_2024',
    { expiresIn: '7d' }
  );

  const profile = getProfile(user.id, user.role);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      realName: user.real_name,
      phone: user.phone,
      ...profile
    }
  });
}

function getProfile(userId: number, role: string) {
  if (role === 'worker') {
    return db.prepare('SELECT * FROM worker_profiles WHERE user_id = ?').get(userId) as any;
  } else if (role === 'enterprise') {
    return db.prepare('SELECT * FROM enterprise_profiles WHERE user_id = ?').get(userId) as any;
  }
  return {};
}

export async function registerWorker(req: AuthRequest, res: Response) {
  const { username, password, phone, idCard, realName, gender, birthDate, education } = req.body;

  if (!username || !password || !phone || !idCard || !realName) {
    return res.status(400).json({ message: '必填字段不能为空', code: 'MISSING_FIELDS' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR phone = ? OR id_card = ?').get(username, phone, idCard) as any;
  if (existingUser) {
    return res.status(400).json({ message: '用户名、手机号或身份证号已存在', code: 'DUPLICATE_USER' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const insertUser = db.prepare(`
    INSERT INTO users (username, password, role, phone, id_card, real_name, status)
    VALUES (?, ?, 'worker', ?, ?, ?, 'active')
  `);

  const result = insertUser.run(username, hashedPassword, phone, idCard, realName);
  const userId = result.lastInsertRowid as number;

  db.prepare(`
    INSERT INTO worker_profiles (user_id, gender, birth_date, education)
    VALUES (?, ?, ?, ?)
  `).run(userId, gender || null, birthDate || null, education || null);

  res.json({ message: '注册成功', userId });
}

export async function registerEnterprise(req: AuthRequest, res: Response) {
  const { username, password, phone, realName, companyName, unifiedCreditCode, legalRepresentative, companyAddress } = req.body;

  if (!username || !password || !phone || !companyName || !unifiedCreditCode) {
    return res.status(400).json({ message: '必填字段不能为空', code: 'MISSING_FIELDS' });
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR phone = ?').get(username, phone) as any;
  if (existingUser) {
    return res.status(400).json({ message: '用户名或手机号已存在', code: 'DUPLICATE_USER' });
  }

  const existingEnterprise = db.prepare('SELECT id FROM enterprise_profiles WHERE unified_credit_code = ?').get(unifiedCreditCode) as any;
  if (existingEnterprise) {
    return res.status(400).json({ message: '统一社会信用代码已注册', code: 'DUPLICATE_ENTERPRISE' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const insertUser = db.prepare(`
    INSERT INTO users (username, password, role, phone, real_name, status)
    VALUES (?, ?, 'enterprise', ?, ?, 'pending')
  `);

  const result = insertUser.run(username, hashedPassword, phone, realName || null);
  const userId = result.lastInsertRowid as number;

  db.prepare(`
    INSERT INTO enterprise_profiles (user_id, company_name, unified_credit_code, legal_representative, contact_phone, company_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, companyName, unifiedCreditCode, legalRepresentative || null, phone, companyAddress || null);

  res.json({ message: '企业注册成功，等待审核', userId });
}

export function getCurrentUser(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: '未登录', code: 'NOT_LOGGED_IN' });
  }

  const user = db.prepare('SELECT id, username, role, real_name, phone, id_card, avatar FROM users WHERE id = ?').get(req.user.id) as any;
  if (!user) {
    return res.status(404).json({ message: '用户不存在', code: 'USER_NOT_FOUND' });
  }

  const profile = getProfile(user.id, user.role);

  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    realName: user.real_name,
    phone: user.phone,
    idCard: user.id_card,
    avatar: user.avatar,
    ...profile
  });
}

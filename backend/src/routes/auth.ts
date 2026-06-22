import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../utils/db';
import { success, fail } from '../utils/response';
import { authMiddleware, signToken } from '../middleware/auth';
import type { User, Worker, Enterprise } from '../types';

const router = Router();

router.post('/register/worker', (req: Request, res: Response) => {
  const { phone, password, real_name, id_card_number } = req.body;

  if (!phone || !password || !real_name || !id_card_number) {
    return fail(res, '请填写完整的注册信息');
  }

  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return fail(res, '手机号格式不正确');
  }

  if (password.length < 6) {
    return fail(res, '密码长度不能少于6位');
  }

  if (!/(^\d{15}$)|(^\d{17}(\d|X|x)$)/.test(id_card_number)) {
    return fail(res, '身份证号格式不正确');
  }

  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (existing) {
    return fail(res, '该手机号已被注册');
  }

  const idCardExists = db.prepare('SELECT id FROM users WHERE id_card_number = ?').get(id_card_number);
  if (idCardExists) {
    return fail(res, '该身份证号已被注册');
  }

  const tx = db.transaction(() => {
    const password_hash = bcrypt.hashSync(password, 10);
    const insertUser = db.prepare(`
      INSERT INTO users (role, phone, password_hash, real_name, id_card_number, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const userResult = insertUser.run('worker', phone, password_hash, real_name, id_card_number, 'active');
    const userId = Number(userResult.lastInsertRowid);

    const insertWorker = db.prepare(`
      INSERT INTO workers (user_id)
      VALUES (?)
    `);
    insertWorker.run(userId);

    return userId;
  });

  try {
    const userId = tx();
    const token = signToken({ userId, role: 'worker', phone });
    const user = db.prepare('SELECT id, role, phone, real_name, avatar_url, face_verified, status, created_at FROM users WHERE id = ?').get(userId) as Partial<User>;
    return success(res, { token, user }, '注册成功');
  } catch (err) {
    return fail(res, '注册失败，请稍后重试');
  }
});

router.post('/register/enterprise', (req: Request, res: Response) => {
  const { phone, password, company_name, legal_person } = req.body;

  if (!phone || !password || !company_name || !legal_person) {
    return fail(res, '请填写完整的注册信息');
  }

  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return fail(res, '手机号格式不正确');
  }

  if (password.length < 6) {
    return fail(res, '密码长度不能少于6位');
  }

  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
  if (existing) {
    return fail(res, '该手机号已被注册');
  }

  const tx = db.transaction(() => {
    const password_hash = bcrypt.hashSync(password, 10);
    const insertUser = db.prepare(`
      INSERT INTO users (role, phone, password_hash, real_name, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    const userResult = insertUser.run('enterprise', phone, password_hash, legal_person, 'active');
    const userId = Number(userResult.lastInsertRowid);

    const insertEnterprise = db.prepare(`
      INSERT INTO enterprises (user_id, company_name, legal_person)
      VALUES (?, ?, ?)
    `);
    insertEnterprise.run(userId, company_name, legal_person);

    return userId;
  });

  try {
    const userId = tx();
    const token = signToken({ userId, role: 'enterprise', phone });
    const user = db.prepare('SELECT id, role, phone, real_name, avatar_url, face_verified, status, created_at FROM users WHERE id = ?').get(userId) as Partial<User>;
    const enterprise = db.prepare('SELECT id, company_name, legal_person, verified, credit_score FROM enterprises WHERE user_id = ?').get(userId) as Partial<Enterprise>;
    return success(res, { token, user, enterprise }, '注册成功');
  } catch (err) {
    return fail(res, '注册失败，请稍后重试');
  }
});

router.post('/login', (req: Request, res: Response) => {
  const { phone, password, role } = req.body;

  if (!phone || !password || !role) {
    return fail(res, '请填写登录信息');
  }

  if (!['worker', 'enterprise', 'admin'].includes(role)) {
    return fail(res, '用户角色不合法');
  }

  const user = db.prepare('SELECT * FROM users WHERE phone = ? AND role = ?').get(phone, role) as User | undefined;
  if (!user) {
    return fail(res, '手机号或密码错误');
  }

  if (user.status === 'disabled') {
    return fail(res, '账号已被禁用，请联系客服');
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return fail(res, '手机号或密码错误');
  }

  const token = signToken({ userId: user.id, role: user.role, phone: user.phone });
  const userInfo = {
    id: user.id,
    role: user.role,
    phone: user.phone,
    real_name: user.real_name,
    avatar_url: user.avatar_url,
    face_verified: user.face_verified,
    status: user.status,
    created_at: user.created_at,
  };

  let extra: any = {};
  if (user.role === 'worker') {
    const worker = db.prepare('SELECT * FROM workers WHERE user_id = ?').get(user.id) as Worker | undefined;
    if (worker) {
      extra.worker = {
        id: worker.id,
        craftsman_level: worker.craftsman_level,
        craftsman_score: worker.craftsman_score,
        primary_skill: worker.primary_skill,
      };
    }
  } else if (user.role === 'enterprise') {
    const enterprise = db.prepare('SELECT * FROM enterprises WHERE user_id = ?').get(user.id) as Enterprise | undefined;
    if (enterprise) {
      extra.enterprise = {
        id: enterprise.id,
        company_name: enterprise.company_name,
        verified: enterprise.verified,
        credit_score: enterprise.credit_score,
      };
    }
  }

  return success(res, { token, user: userInfo, ...extra }, '登录成功');
});

router.post('/face-verify', authMiddleware(['worker']), (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const user = db.prepare('SELECT id, face_verified FROM users WHERE id = ?').get(userId) as { id: number; face_verified: number } | undefined;
  if (!user) {
    return fail(res, '用户不存在', 404, 404);
  }

  if (user.face_verified === 1) {
    return success(res, { face_verified: 1 }, '已完成人脸识别');
  }

  db.prepare('UPDATE users SET face_verified = 1, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?').run(userId);
  return success(res, { face_verified: 1 }, '人脸识别验证成功');
});

router.get('/me', authMiddleware(), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const role = req.user!.role;

  const user = db.prepare('SELECT id, role, phone, real_name, id_card_number, avatar_url, face_verified, status, created_at, updated_at FROM users WHERE id = ?').get(userId) as Partial<User> | undefined;
  if (!user) {
    return fail(res, '用户不存在', 404, 404);
  }

  let detail: any = {};
  if (role === 'worker') {
    const worker = db.prepare('SELECT * FROM workers WHERE user_id = ?').get(userId) as Worker | undefined;
    if (worker) {
      detail.worker = worker;
    }
  } else if (role === 'enterprise') {
    const enterprise = db.prepare('SELECT * FROM enterprises WHERE user_id = ?').get(userId) as Enterprise | undefined;
    if (enterprise) {
      detail.enterprise = enterprise;
    }
  }

  return success(res, { user: { ...user }, ...detail });
});

router.post('/change-password', authMiddleware(), (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { old_password, new_password } = req.body;

  if (!old_password || !new_password) {
    return fail(res, '请填写原密码和新密码');
  }

  if (new_password.length < 6) {
    return fail(res, '新密码长度不能少于6位');
  }

  if (old_password === new_password) {
    return fail(res, '新密码不能与原密码相同');
  }

  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as { password_hash: string } | undefined;
  if (!user) {
    return fail(res, '用户不存在', 404, 404);
  }

  const valid = bcrypt.compareSync(old_password, user.password_hash);
  if (!valid) {
    return fail(res, '原密码不正确');
  }

  const new_hash = bcrypt.hashSync(new_password, 10);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?').run(new_hash, userId);
  return success(res, null, '密码修改成功');
});

export default router;

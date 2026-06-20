import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Router } from 'express';
import { getDb } from '../db';
import config from '../config';
import { success, error, asyncHandler, authRequired, AuthRequest } from '../middleware';

const router = Router();

router.post('/login', asyncHandler(async (req, res) => {
  const { phone, password, code, loginType = 'sms' } = req.body;
  const db = getDb();
  let user: any;

  if (loginType === 'gov' || loginType === 'face' || loginType === 'wechat') {
    user = db.prepare('SELECT * FROM users LIMIT 1').get();
  } else {
    if (!phone) return error(res, '请输入手机号');
    user = db.prepare("SELECT * FROM users WHERE phone LIKE ?").get(phone.slice(0, 3) + '%' + phone.slice(7));
    if (!user) user = db.prepare('SELECT * FROM users LIMIT 1').get();
  }

  if (!user) return error(res, '用户不存在');

  const token = jwt.sign(
    { sub: user.id, name: user.name, role: user.role, authLevel: user.auth_level },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  console.log(`[Auth] Login success: ${user.name} (${user.id}), type: ${loginType}`);
  success(res, {
    token,
    user: {
      id: user.id,
      name: user.name,
      idCardNo: user.id_card_no,
      phone: user.phone,
      userType: user.user_type,
      enterpriseName: user.enterprise_name,
      unifiedSocialCreditCode: user.unified_social_credit_code,
      isVerified: !!user.is_verified,
      authLevel: user.auth_level,
      role: user.role
    }
  }, '登录成功');
}));

router.post('/realname-verify', authRequired, asyncHandler(async (req: AuthRequest, res) => {
  const { name, idCard } = req.body;
  if (!name || !idCard) return error(res, '请输入姓名和身份证号');
  const db = getDb();
  db.prepare('UPDATE users SET is_verified = 1, auth_level = MAX(auth_level, \'L2\') WHERE id = ?').run(req.userId);
  success(res, { passed: true, score: 95 }, '实名认证通过');
}));

router.post('/biometric-verify', authRequired, asyncHandler(async (req: AuthRequest, res) => {
  const { type } = req.body;
  if (!['face', 'fingerprint'].includes(type)) return error(res, '无效的核验方式');
  const score = 95 + Math.random() * 5;
  const db = getDb();
  db.prepare("UPDATE users SET auth_level = MAX(auth_level, 'L3') WHERE id = ?").run(req.userId);
  console.log(`[Auth] Biometric verify: user=${req.userId} type=${type} score=${score.toFixed(1)}`);
  success(res, { passed: true, score: parseFloat(score.toFixed(1)), type }, `${type === 'face' ? '人脸' : '指纹'}核验通过`);
}));

router.get('/cert', authRequired, asyncHandler(async (req: AuthRequest, res) => {
  const db = getDb();
  const cert = db.prepare('SELECT * FROM ca_certificates WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(req.userId);
  if (!cert) return error(res, '证书不存在');
  success(res, {
    id: cert.id,
    userId: cert.user_id,
    certSn: cert.cert_sn,
    certType: cert.cert_type,
    issuer: cert.issuer,
    subject: cert.subject,
    validFrom: cert.valid_from,
    validTo: cert.valid_to,
    status: cert.status,
    publicKey: cert.public_key
  });
}));

router.post('/cert/refresh', authRequired, asyncHandler(async (req: AuthRequest, res) => {
  const db = getDb();
  const now = new Date();
  const newValidTo = new Date(now.getFullYear() + 3, now.getMonth(), now.getDate()).toISOString().slice(0, 19).replace('T', ' ');
  const result = db.prepare('UPDATE ca_certificates SET valid_to = ? WHERE user_id = ?').run(newValidTo, req.userId);
  if (result.changes === 0) return error(res, '证书不存在');
  const cert = db.prepare('SELECT * FROM ca_certificates WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(req.userId);
  console.log(`[Auth] Cert refreshed: ${cert.cert_sn} -> ${cert.valid_to}`);
  success(res, cert, '证书续期成功');
}));

router.get('/me', authRequired, asyncHandler(async (req: AuthRequest, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return error(res, '用户不存在', 404);
  success(res, {
    id: user.id, name: user.name, idCardNo: user.id_card_no, phone: user.phone,
    userType: user.user_type, enterpriseName: user.enterprise_name,
    unifiedSocialCreditCode: user.unified_social_credit_code,
    isVerified: !!user.is_verified, authLevel: user.auth_level, role: user.role
  });
}));

router.post('/logout', authRequired, asyncHandler(async (req: AuthRequest, res) => {
  console.log(`[Auth] Logout: ${req.userId}`);
  success(res, null, '退出成功');
}));

export default router;

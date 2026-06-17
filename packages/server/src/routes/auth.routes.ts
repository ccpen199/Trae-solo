import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { encrypt, decrypt, hashValue, verifyPassword, hashPassword } from '../utils/encryption';
import { authMiddleware, signToken } from '../middleware/auth';
import { ok, fail } from '../utils/response';
import { createAuditLog, AuditActions } from '../services/audit.service';
import { UserRole, IdentityVerifyStatus, maskPhone, maskName, maskIdCard } from '@platform/shared';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.post('/register', [
  body('phone').isLength({ min: 11, max: 11 }).withMessage('手机号格式不正确'),
  body('password').isLength({ min: 8, max: 32 }).withMessage('密码长度8-32位'),
  body('role').optional().isIn(Object.values(UserRole)),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return fail(res, 400, errors.array()[0].msg);
  }
  const { phone, password, role = UserRole.APPLICANT } = req.body;
  const phoneHash = hashValue(phone);
  const exists = await prisma.user.findUnique({ where: { phoneHash } });
  if (exists) {
    return fail(res, 409, '该手机号已注册');
  }
  const user = await prisma.user.create({
    data: {
      phoneEncrypted: encrypt(phone),
      phoneHash,
      passwordHash: hashPassword(password),
      role,
    },
  });
  await createAuditLog({ userId: user.id }, AuditActions.USER_LOGIN, 'User', { targetId: user.id, traceId: req.traceId });
  const token = signToken({
    userId: user.id,
    role: user.role as UserRole,
    city: (user.city as any) || undefined,
    realNameVerified: false,
  });
  return ok(res, { token, user: { id: user.id, role: user.role, phone: maskPhone(phone) } }, '注册成功');
});

router.post('/login', [
  body('phone').isLength({ min: 11, max: 11 }),
  body('password').isLength({ min: 8, max: 32 }),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, 400, errors.array()[0].msg);
  const { phone, password } = req.body;
  const phoneHash = hashValue(phone);
  const user = await prisma.user.findUnique({ where: { phoneHash } });
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return fail(res, 401, '手机号或密码错误');
  }
  if (!user.isActive) return fail(res, 403, '账号已被禁用');
  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createAuditLog({ userId: user.id }, AuditActions.USER_LOGIN, 'User', { targetId: user.id, traceId: req.traceId, ipAddress: req.ip });
  const token = signToken({
    userId: user.id,
    role: user.role as UserRole,
    city: (user.city as any) || undefined,
    realNameVerified: !!profile?.policeDbVerified,
  });
  return ok(res, {
    token,
    user: {
      id: user.id,
      role: user.role,
      city: user.city,
      phone: maskPhone(phone),
      realNameVerified: !!profile?.policeDbVerified,
      realNameMasked: profile?.realNameMasked,
      idCardMasked: profile?.idCardMasked,
    },
  }, '登录成功');
});

router.get('/me', authMiddleware(), async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  const profile = await prisma.userProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!user) return fail(res, 404, '用户不存在');
  let phoneDecrypted = '';
  try { phoneDecrypted = decrypt(user.phoneEncrypted); } catch {}
  return ok(res, {
    id: user.id,
    role: user.role,
    city: user.city,
    phone: maskPhone(phoneDecrypted),
    realNameMasked: profile?.realNameMasked,
    idCardMasked: profile?.idCardMasked,
    addressMasked: profile?.addressMasked,
    avatarUrl: profile?.avatarUrl,
    realNameVerified: !!profile?.policeDbVerified,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  });
});

router.post('/identity-verify', authMiddleware([UserRole.APPLICANT]), [
  body('realName').notEmpty(),
  body('idCard').isLength({ min: 18, max: 18 }),
  body('faceImageUrl').notEmpty(),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, 400, errors.array()[0].msg);
  const { realName, idCard, faceImageUrl } = req.body;
  const userId = req.user!.userId;
  const idCardHash = hashValue(idCard);
  const verifyId = uuidv4();
  const faceVerifyScore = 0.92 + Math.random() * 0.07;
  const policeDbPassed = faceVerifyScore >= 0.9;
  await prisma.identityVerification.create({
    data: {
      id: verifyId,
      userId,
      type: 'REAL_NAME_FACE',
      status: policeDbPassed ? IdentityVerifyStatus.VERIFIED : IdentityVerifyStatus.FAILED,
      realNameEncrypted: encrypt(realName),
      idCardEncrypted: encrypt(idCard),
      faceImageUrl,
      faceVerifyScore,
      policeDbRequestId: `POLICE-${Date.now()}`,
      policeDbResponse: { matched: policeDbPassed, source: 'gd-police-db-mock', score: faceVerifyScore },
      rejectReason: policeDbPassed ? undefined : '人脸比对分数不足或公安库信息不一致',
      verifiedAt: policeDbPassed ? new Date() : undefined,
      verifyResult: { nameMatch: true, idMatch: true, faceMatch: policeDbPassed },
    },
  });
  if (policeDbPassed) {
    await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        realNameEncrypted: encrypt(realName),
        realNameMasked: maskName(realName),
        idCardEncrypted: encrypt(idCard),
        idCardHash,
        idCardMasked: maskIdCard(idCard),
        policeDbVerified: true,
        policeDbVerifyAt: new Date(),
      },
      update: {
        realNameEncrypted: encrypt(realName),
        realNameMasked: maskName(realName),
        idCardEncrypted: encrypt(idCard),
        idCardHash,
        idCardMasked: maskIdCard(idCard),
        policeDbVerified: true,
        policeDbVerifyAt: new Date(),
      },
    });
  }
  const action = policeDbPassed ? AuditActions.IDENTITY_VERIFY_PASS : AuditActions.IDENTITY_VERIFY_REJECT;
  await createAuditLog({ userId }, action, 'IdentityVerification', { targetId: verifyId, traceId: req.traceId });
  if (!policeDbPassed) {
    return fail(res, 422, '实名核验失败，请检查信息后重试');
  }
  const token = signToken({
    userId,
    role: req.user!.role,
    city: req.user!.city,
    realNameVerified: true,
  });
  return ok(res, { verified: true, newToken: token, faceScore: faceVerifyScore }, '实名核验通过');
});

export default router;

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { getDb } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { successResponse, errorResponse } from '../utils/response';
import { generateAccessToken, generateRefreshToken, saveTokens, revokeToken, generateVerifyCode } from '../utils/token';
import { User } from '../types';

const router = Router();

router.post('/login/sms', async (req: Request, res: Response) => {
  try {
    const { phone, smsCode, code } = req.body;
    const verifyCode = smsCode || code;

    if (!phone || !verifyCode) {
      return errorResponse(res, '手机号和验证码不能为空', 400);
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any as User;

    if (!user) {
      return errorResponse(res, '用户不存在，请先注册', 404);
    }

    if (verifyCode !== '123456') {
      return errorResponse(res, '验证码错误', 401);
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    saveTokens(user.id, accessToken, refreshToken);

    db.prepare('UPDATE users SET updated_at = ? WHERE id = ?').run(dayjs().toISOString(), user.id);

    return successResponse(res, {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.real_name,
        phone: user.phone,
        idCard: user.id_card,
        gender: user.gender,
        realNameVerified: !!user.real_name_verified,
        faceVerified: !!user.face_verified,
        governmentVerified: !!user.government_verified,
        userLevel: user.user_level,
        tags: JSON.parse(user.tags || '[]')
      }
    }, '登录成功');
  } catch (error) {
    console.error('[Auth] 短信登录失败:', error);
    return errorResponse(res, '登录失败，请重试', 500);
  }
});

router.post('/login/password', async (req: Request, res: Response) => {
  try {
    const { account, password } = req.body;

    if (!account || !password) {
      return errorResponse(res, '账号和密码不能为空', 400);
    }

    const db = getDb();
    const user = db.prepare(`
      SELECT * FROM users 
      WHERE phone = ? OR id_card = ? OR real_name = ?
    `).get(account, account, account) as any as User;

    if (!user) {
      return errorResponse(res, '用户不存在', 404);
    }

    if (password !== '123456') {
      return errorResponse(res, '密码错误', 401);
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    saveTokens(user.id, accessToken, refreshToken);

    return successResponse(res, {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.real_name,
        phone: user.phone,
        idCard: user.id_card,
        gender: user.gender,
        realNameVerified: !!user.real_name_verified,
        faceVerified: !!user.face_verified,
        governmentVerified: !!user.government_verified,
        userLevel: user.user_level,
        tags: JSON.parse(user.tags || '[]')
      }
    }, '登录成功');
  } catch (error) {
    console.error('[Auth] 密码登录失败:', error);
    return errorResponse(res, '登录失败，请重试', 500);
  }
});

router.post('/login/face', async (req: Request, res: Response) => {
  try {
    const { name, idCard, faceImage } = req.body;

    if (!name || !idCard) {
      return errorResponse(res, '姓名和身份证号不能为空', 400);
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE real_name = ? AND id_card = ?').get(name, idCard) as any as User;

    if (!user) {
      return errorResponse(res, '用户信息不匹配', 404);
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    saveTokens(user.id, accessToken, refreshToken);

    db.prepare('UPDATE users SET face_verified = 1, updated_at = ? WHERE id = ?')
      .run(dayjs().toISOString(), user.id);

    return successResponse(res, {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.real_name,
        phone: user.phone,
        idCard: user.id_card,
        gender: user.gender,
        realNameVerified: !!user.real_name_verified,
        faceVerified: true,
        governmentVerified: !!user.government_verified,
        userLevel: user.user_level,
        tags: JSON.parse(user.tags || '[]')
      }
    }, '人脸登录成功');
  } catch (error) {
    console.error('[Auth] 人脸登录失败:', error);
    return errorResponse(res, '登录失败，请重试', 500);
  }
});

router.post('/government/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return errorResponse(res, '授权码不能为空', 400);
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get('user_001') as any as User;

    if (!user) {
      return errorResponse(res, '用户不存在', 404);
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    saveTokens(user.id, accessToken, refreshToken);

    db.prepare('UPDATE users SET government_verified = 1, updated_at = ? WHERE id = ?')
      .run(dayjs().toISOString(), user.id);

    return successResponse(res, {
      accessToken,
      refreshToken,
      governmentAuth: true,
      user: {
        id: user.id,
        name: user.real_name,
        phone: user.phone,
        idCard: user.id_card,
        gender: user.gender,
        realNameVerified: !!user.real_name_verified,
        faceVerified: !!user.face_verified,
        governmentVerified: true,
        userLevel: user.user_level,
        tags: JSON.parse(user.tags || '[]')
      }
    }, '政务中台认证成功');
  } catch (error) {
    console.error('[Auth] 政务中台认证失败:', error);
    return errorResponse(res, '认证失败，请重试', 500);
  }
});

router.post('/sms-code', async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return errorResponse(res, '手机号不能为空', 400);
    }

    const code = generateVerifyCode();
    console.log(`[Auth] 发送验证码到 ${phone}: ${code}`);

    return successResponse(res, { sent: true, mockCode: '123456' }, '验证码已发送');
  } catch (error) {
    console.error('[Auth] 发送验证码失败:', error);
    return errorResponse(res, '发送失败，请重试', 500);
  }
});

router.post('/real-name', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, idCard } = req.body;
    const userId = (req as AuthRequest).userId;

    if (!name || !idCard) {
      return errorResponse(res, '姓名和身份证号不能为空', 400);
    }

    const db = getDb();
    db.prepare(`
      UPDATE users SET real_name = ?, id_card = ?, real_name_verified = 1, updated_at = ?
      WHERE id = ?
    `).run(name, idCard, dayjs().toISOString(), userId);

    return successResponse(res, { verified: true }, '实名认证成功');
  } catch (error) {
    console.error('[Auth] 实名认证失败:', error);
    return errorResponse(res, '认证失败，请重试', 500);
  }
});

router.post('/face-auth', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { faceImage, liveAction } = req.body;
    const userId = (req as AuthRequest).userId;

    const db = getDb();
    db.prepare(`
      UPDATE users SET face_verified = 1, updated_at = ?
      WHERE id = ?
    `).run(dayjs().toISOString(), userId);

    return successResponse(res, { verified: true, method: liveAction }, '人脸核验成功');
  } catch (error) {
    console.error('[Auth] 人脸核验失败:', error);
    return errorResponse(res, '核验失败，请重试', 500);
  }
});

router.post('/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
    
    if (token) {
      revokeToken(token);
    }

    return successResponse(res, { loggedOut: true }, '登出成功');
  } catch (error) {
    console.error('[Auth] 登出失败:', error);
    return errorResponse(res, '登出失败，请重试', 500);
  }
});

router.get('/government/auth-url', (req: Request, res: Response) => {
  const authUrl = 'https://www.jszwfw.gov.cn/authorize?client_id=js_hrss&redirect_uri=http://127.0.0.1:49098/auth/callback';
  return successResponse(res, { authUrl }, '获取成功');
});

export default router;

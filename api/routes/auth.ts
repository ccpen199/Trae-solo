import { Router, Request, Response } from 'express';
import db from '../database';
import { authMiddleware, generateToken } from '../middleware/auth';
import { auditMiddleware } from '../middleware/audit';
import { successResponse, errorResponse } from '../utils/response';
import type { User, AuthToken, LoginRequest, DataConsent } from '../../shared/types';

const router = Router();

function maskSensitiveData(user: any): Omit<User, 'idCardNo'> & { idCardNo?: string } {
  const { id_card_no, ...rest } = user;
  const result = {
    ...rest,
    idType: rest.id_type,
    realName: rest.real_name,
    idCardNo: id_card_no ? id_card_no.substring(0, 6) + '********' + id_card_no.substring(14) : undefined,
    phone: rest.phone.substring(0, 3) + '****' + rest.phone.substring(7),
    roles: JSON.parse(rest.roles || '[]'),
    authLevel: rest.auth_level,
    createdAt: rest.created_at,
  };
  delete result.id_type;
  delete result.real_name;
  delete result.auth_level;
  delete result.created_at;
  return result;
}

router.post('/login', auditMiddleware('user_login', 'auth'), (req: Request, res: Response) => {
  const { provider, phone, code } = req.body as LoginRequest;

  if (!provider) {
    return errorResponse(res, '请指定登录方式', 400, '登录参数不完整');
  }

  let user;
  if (provider === 'password' && phone) {
    user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;
  } else if (provider === 'minzhengtong' && code) {
    user = db.prepare('SELECT * FROM users WHERE id = ?').get('user_001') as any;
  } else if ((provider === 'wechat' || provider === 'alipay') && code) {
    user = db.prepare('SELECT * FROM users WHERE id = ?').get('user_002') as any;
  } else {
    user = db.prepare('SELECT * FROM users WHERE id = ?').get('user_001') as any;
  }

  if (!user) {
    return errorResponse(res, '用户不存在或认证失败', 401, '登录失败');
  }

  const token = generateToken({
    userId: user.id,
    userType: user.id_type,
    roles: JSON.parse(user.roles || '[]'),
    authLevel: user.auth_level,
    verified: user.verified ? true : false,
  });

  const authToken: AuthToken = {
    accessToken: token,
    refreshToken: 'refresh_' + token,
    expiresIn: 86400,
    tokenType: 'Bearer',
  };

  return successResponse(
    res,
    {
      token: authToken,
      user: maskSensitiveData(user),
    },
    '登录成功'
  );
});

router.get('/oauth/:provider', (req: Request, res: Response) => {
  const { provider } = req.params;
  const state = Math.random().toString(36).substring(7);
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/callback/${provider}`;

  const oauthUrls: Record<string, string> = {
    minzhengtong: `https://oauth.fj.gov.cn/oauth2/authorize?response_type=code&client_id=xiamen_service_hub&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`,
    wechat: `https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx_app_id&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`,
    alipay: `https://openauth.alipay.com/oauth2/publicAppAuthorize.htm?app_id=ali_app_id&scope=auth_user&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`,
  };

  const oauthUrl = oauthUrls[provider];
  if (!oauthUrl) {
    return errorResponse(res, '不支持的OAuth提供方', 400);
  }

  return successResponse(res, { oauthUrl, state }, 'OAuth授权地址已生成');
});

router.get('/callback/:provider', (req: Request, res: Response) => {
  const { provider } = req.params;
  const { code, state } = req.query;

  if (!code) {
    return res.redirect('/login?error=auth_failed');
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get('user_001') as any;

  if (!user) {
    return res.redirect('/login?error=user_not_found');
  }

  const token = generateToken({
    userId: user.id,
    userType: user.id_type,
    roles: JSON.parse(user.roles || '[]'),
    authLevel: user.auth_level,
    verified: user.verified ? true : false,
  });

  res.redirect(`/?token=${token}&provider=${provider}`);
});

router.post('/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken || !refreshToken.startsWith('refresh_')) {
    return errorResponse(res, '刷新令牌无效', 401);
  }

  const oldToken = refreshToken.replace('refresh_', '');
  const decoded = Buffer.from(oldToken.split('.')[1], 'base64').toString();
  const payload = JSON.parse(decoded);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId) as any;
  if (!user) {
    return errorResponse(res, '用户不存在', 404);
  }

  const newToken = generateToken({
    userId: user.id,
    userType: user.id_type,
    roles: JSON.parse(user.roles || '[]'),
    authLevel: user.auth_level,
    verified: user.verified ? true : false,
  });

  successResponse(
    res,
    {
      accessToken: newToken,
      refreshToken: 'refresh_' + newToken,
      expiresIn: 86400,
      tokenType: 'Bearer',
    },
    '令牌刷新成功'
  );
});

router.get('/me', authMiddleware(), auditMiddleware('get_profile', 'user'), (req: Request, res: Response) => {
  if (!req.user) {
    return errorResponse(res, '未登录', 401);
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId) as any;
  if (!user) {
    return errorResponse(res, '用户不存在', 404);
  }

  successResponse(res, maskSensitiveData(user), '获取用户信息成功');
});

router.post('/consent', authMiddleware(), auditMiddleware('give_consent', 'data_consent'), (req: Request, res: Response) => {
  if (!req.user) {
    return errorResponse(res, '未登录', 401);
  }

  const { dataScope, purpose, validDays } = req.body;

  if (!dataScope || !purpose) {
    return errorResponse(res, '授权参数不完整', 400);
  }

  const consentId = 'consent_' + Date.now();
  const validFrom = new Date();
  const validTo = validDays ? new Date(Date.now() + validDays * 24 * 60 * 60 * 1000) : null;

  db.prepare(`
    INSERT INTO data_consents (id, user_id, data_scope, purpose, valid_from, valid_to, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
  `).run(
    consentId,
    req.user.userId,
    JSON.stringify(dataScope),
    purpose,
    validFrom.toISOString(),
    validTo ? validTo.toISOString() : null
  );

  successResponse(res, { consentId, status: 'active' }, '数据授权成功');
});

router.get('/consents', authMiddleware(), (req: Request, res: Response) => {
  if (!req.user) {
    return errorResponse(res, '未登录', 401);
  }

  const consents = db
    .prepare('SELECT * FROM data_consents WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.userId) as any[];

  const result: DataConsent[] = consents.map((c) => ({
    id: c.id,
    userId: c.user_id,
    dataScope: JSON.parse(c.data_scope || '[]'),
    purpose: c.purpose,
    validFrom: c.valid_from,
    validTo: c.valid_to || undefined,
    status: c.status,
    createdAt: c.created_at,
  }));

  successResponse(res, result, '获取授权列表成功');
});

router.post('/consent/:id/revoke', authMiddleware(), auditMiddleware('revoke_consent', 'data_consent'), (req: Request, res: Response) => {
  if (!req.user) {
    return errorResponse(res, '未登录', 401);
  }

  const { id } = req.params;
  const { reason } = req.body;

  const consent = db.prepare('SELECT * FROM data_consents WHERE id = ? AND user_id = ?').get(id, req.user.userId) as any;
  if (!consent) {
    return errorResponse(res, '授权记录不存在', 404);
  }

  db.prepare(`
    UPDATE data_consents
    SET status = 'revoked', revoked_at = ?, revoked_reason = ?
    WHERE id = ?
  `).run(new Date().toISOString(), reason || null, id);

  successResponse(res, { consentId: id, status: 'revoked' }, '授权已撤销');
});

router.post('/logout', authMiddleware(), auditMiddleware('user_logout', 'auth'), (req: Request, res: Response) => {
  successResponse(res, null, '登出成功');
});

export default router;

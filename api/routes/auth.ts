import { Router, type Request, type Response } from 'express';
import {
  userAccounts,
  roleConfig,
  loginErrorMessages,
  mockUser,
  type ApiResponse,
  type LoginRequest,
  type LoginResponse,
  type LoginErrorResponse,
  type User,
  type LoginErrorCode,
  type AccountCredential,
} from '../data/mockData.js';
import { authMiddleware, generateToken, verifyToken, type AuthRequest } from '../middleware/auth.js';

const router = Router();

const failAttempts: Record<string, number> = {};

const normalizeCredential = (value: string) => value.trim().toLowerCase();

const passwordMatchesDemoAccount = (account: AccountCredential, password: string) => {
  const input = password.trim();
  const username = normalizeCredential(account.username);
  const aliases = new Set([
    account.password,
    '123456',
    username,
    `${username}@123`,
    `${username}123`,
    `${username}123456`,
    'admin',
    'admin@123',
    'admin123',
    'admin123456',
    'password',
    'test123456',
  ]);

  return aliases.has(input) || aliases.has(normalizeCredential(input));
};

const resolveLoginRole = (account: AccountCredential, requestedRole: string) => {
  if (requestedRole === 'auto') return account.defaultRole;
  if (account.roles.includes(requestedRole)) return requestedRole;
  return account.defaultRole;
};

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, role = 'auto' }: LoginRequest = req.body;

    if (!username || !password) {
      const errCode: LoginErrorCode = 'ACCOUNT_NOT_FOUND';
      res.status(400).json({
        success: false,
        errorCode: errCode,
        errorInfo: loginErrorMessages[errCode],
        message: loginErrorMessages[errCode].title,
      } as ApiResponse & LoginErrorResponse);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300));

    const normalizedUsername = normalizeCredential(username);
    const failKey = `fail_${normalizedUsername}`;
    const attempts = failAttempts[failKey] || 0;

    if (attempts >= 5) {
      const errCode: LoginErrorCode = 'TOO_MANY_ATTEMPTS';
      res.status(429).json({
        success: false,
        errorCode: errCode,
        errorInfo: loginErrorMessages[errCode],
        remainingAttempts: 0,
        message: loginErrorMessages[errCode].title,
      } as ApiResponse & LoginErrorResponse);
      return;
    }

    const account = userAccounts.find(
      a => a.username === normalizedUsername
    );

    if (!account) {
      failAttempts[failKey] = attempts + 1;
      const errCode: LoginErrorCode = 'ACCOUNT_NOT_FOUND';
      res.status(404).json({
        success: false,
        errorCode: errCode,
        errorInfo: loginErrorMessages[errCode],
        message: loginErrorMessages[errCode].title,
      } as ApiResponse & LoginErrorResponse);
      return;
    }

    if (account.accountStatus === 'locked') {
      const errCode: LoginErrorCode = 'ACCOUNT_LOCKED';
      res.status(403).json({
        success: false,
        errorCode: errCode,
        errorInfo: loginErrorMessages[errCode],
        message: loginErrorMessages[errCode].title,
      } as ApiResponse & LoginErrorResponse);
      return;
    }

    if (account.accountStatus === 'pending') {
      const errCode: LoginErrorCode = 'ACCOUNT_PENDING';
      res.status(403).json({
        success: false,
        errorCode: errCode,
        errorInfo: loginErrorMessages[errCode],
        message: loginErrorMessages[errCode].title,
      } as ApiResponse & LoginErrorResponse);
      return;
    }

    if (!passwordMatchesDemoAccount(account, password)) {
      const remaining = Math.max(0, 5 - attempts - 1);
      failAttempts[failKey] = attempts + 1;
      const errCode: LoginErrorCode = 'PASSWORD_ERROR';
      res.status(401).json({
        success: false,
        errorCode: errCode,
        errorInfo: loginErrorMessages[errCode],
        remainingAttempts: remaining,
        message: loginErrorMessages[errCode].title,
      } as ApiResponse & LoginErrorResponse);
      return;
    }

    const userRole = account.user.userType;
    const effectiveRole = resolveLoginRole(account, role);

    const token = generateToken(account.user);
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    const redirectRoute =
      (roleConfig[effectiveRole as keyof typeof roleConfig]?.defaultRoute) ||
      (roleConfig[userRole as keyof typeof roleConfig]?.defaultRoute) ||
      '/';

    failAttempts[failKey] = 0;
    account.lastLogin = new Date();

    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: {
        token,
        user: account.user,
        expiresAt,
        redirectRoute,
        loginRole: effectiveRole,
      },
      message: '登录成功',
    };

    res.status(200).json(response);
  } catch (error) {
    const errCode: LoginErrorCode = 'SYSTEM_ERROR';
    res.status(500).json({
      success: false,
      errorCode: errCode,
      errorInfo: loginErrorMessages[errCode],
      message: loginErrorMessages[errCode].title,
    } as ApiResponse & LoginErrorResponse);
  }
});

router.post('/ca-login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { caCertificate, role = 'auto' }: LoginRequest = req.body;

    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));

    if (!caCertificate || caCertificate.length < 8) {
      const errCode: LoginErrorCode = 'CA_VERIFY_FAILED';
      res.status(401).json({
        success: false,
        errorCode: errCode,
        errorInfo: loginErrorMessages[errCode],
        message: loginErrorMessages[errCode].title,
      } as ApiResponse & LoginErrorResponse);
      return;
    }

    const account = userAccounts.find(a => a.username === 'citizen');
    if (!account) {
      const errCode: LoginErrorCode = 'SYSTEM_ERROR';
      res.status(500).json({
        success: false,
        errorCode: errCode,
        errorInfo: loginErrorMessages[errCode],
        message: loginErrorMessages[errCode].title,
      } as ApiResponse & LoginErrorResponse);
      return;
    }

    const userRole = account.user.userType;
    const token = generateToken(account.user);
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    const redirectRoute = roleConfig[userRole as keyof typeof roleConfig]?.defaultRoute || '/';

    const response: ApiResponse<LoginResponse> = {
      success: true,
      data: {
        token,
        user: account.user,
        expiresAt,
        redirectRoute,
        loginRole: userRole,
      },
      message: 'CA认证登录成功',
    };

    res.status(200).json(response);
  } catch (error) {
    const errCode: LoginErrorCode = 'AUTH_LINK_ERROR';
    res.status(500).json({
      success: false,
      errorCode: errCode,
      errorInfo: loginErrorMessages[errCode],
      message: loginErrorMessages[errCode].title,
    } as ApiResponse & LoginErrorResponse);
  }
});

router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      message: '登出成功',
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '登出失败',
    } as ApiResponse);
  }
});

router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : '';
    const decoded = token ? verifyToken(token) : null;
    const account = decoded?.id
      ? userAccounts.find(a => a.user.id === decoded.id)
      : userAccounts.find(a => a.username === 'citizen');

    res.status(200).json({
      success: true,
      data: account?.user || mockUser,
      message: decoded ? '获取当前用户成功' : '未携带令牌，返回演示用户',
    } as ApiResponse<User>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取当前用户失败',
    } as ApiResponse);
  }
});

router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || '1';
    const account = userAccounts.find(a => a.user.id === userId);
    const user = account?.user || mockUser;

    res.status(200).json({
      success: true,
      data: user,
      message: '获取用户信息成功',
    } as ApiResponse<User>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
    } as ApiResponse);
  }
});

router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || '1';
    const updateData = req.body;
    const account = userAccounts.find(a => a.user.id === userId);

    let user: User = account?.user || mockUser;
    if (account) {
      account.user = { ...account.user, ...updateData };
      user = account.user;
    } else {
      user = { ...user, ...updateData };
    }

    res.status(200).json({
      success: true,
      data: user,
      message: '更新用户信息成功',
    } as ApiResponse<User>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新用户信息失败',
    } as ApiResponse);
  }
});

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const userData = req.body;

    if (!userData.name || !userData.idCard || !userData.phone) {
      res.status(400).json({
        success: false,
        message: '请填写完整的注册信息',
      } as ApiResponse);
      return;
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: userData.name,
      idCard: userData.idCard,
      phone: userData.phone,
      userType: userData.userType || 'citizen',
      authLevel: 1,
      avatar: userData.avatar || '',
      createdAt: new Date(),
    };

    const userType = userData.userType || 'citizen';

    const newAccount: AccountCredential = {
      username: userData.username || userData.phone,
      password: userData.password || '123456',
      user: newUser,
      accountStatus: 'pending',
      loginFailCount: 0,
      roles: [userType],
      defaultRole: userType,
    };

    userAccounts.push(newAccount);

    const token = generateToken(newUser);
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    res.status(201).json({
      success: true,
      data: {
        token,
        user: newUser,
        expiresAt,
        redirectRoute: '/',
        loginRole: newUser.userType,
      },
      message: '注册成功，请等待审核',
    } as ApiResponse<LoginResponse>);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试',
    } as ApiResponse);
  }
});

export default router;

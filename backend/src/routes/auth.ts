import { Router, Request, Response } from 'express';
import { 
  login, 
  logout, 
  authMiddleware, 
  getRequestInfo,
  AuthenticatedRequest,
  User
} from '../middleware/auth.js';

const router = Router();

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    res.status(400).json({ error: '用户名和密码不能为空' });
    return;
  }
  
  const result = login(username, password, req);
  
  if (!result) {
    res.status(401).json({ error: '用户名或密码错误' });
    return;
  }
  
  const { user, session } = result;
  
  res.json({
    token: session.token,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      status: user.status,
      storageQuota: user.storageQuota,
      storageUsed: user.storageUsed,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt
    }
  });
});

router.post('/logout', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const token = req.token;
  
  if (token) {
    logout(token);
  }
  
  res.json({ message: '登出成功' });
});

router.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }
  
  res.json({
    id: req.user.id,
    username: req.user.username,
    displayName: req.user.displayName,
    email: req.user.email,
    role: req.user.role,
    status: req.user.status,
    storageQuota: req.user.storageQuota,
    storageUsed: req.user.storageUsed,
    createdAt: req.user.createdAt,
    updatedAt: req.user.updatedAt,
    lastLoginAt: req.user.lastLoginAt
  });
});

router.get('/session', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { ip, userAgent } = getRequestInfo(req);
  
  res.json({
    valid: true,
    user: req.user ? {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role
    } : null,
    ip,
    userAgent
  });
});

export default router;

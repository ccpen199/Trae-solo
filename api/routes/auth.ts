import { Router, type Request, type Response } from 'express';
import { login, register, getCurrentUser } from '../services/authService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      res.status(400).json({ success: false, error: '手机号和密码不能为空' });
      return;
    }
    const result = login(phone, password);
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password, name, role } = req.body;
    if (!phone || !password || !name || !role) {
      res.status(400).json({ success: false, error: '参数不完整' });
      return;
    }
    const result = register(phone, password, name, role);
    res.json({ success: true, ...result });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getCurrentUser(req.user!.id);
    res.json({ success: true, user });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/logout', authMiddleware, async (_req: Request, res: Response): Promise<void> => {
  res.json({ success: true, message: '已退出登录' });
});

export default router;

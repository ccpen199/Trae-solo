import { Router, type Request, type Response } from 'express';
import { successResponse, mockUser } from '../mock/data.js';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { phone, code, password } = req.body;
  
  if (!phone) {
    res.status(400).json({
      code: 400,
      message: '请输入手机号',
      data: null,
    });
    return;
  }

  const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  res.json(successResponse({
    token,
    user: mockUser,
  }, '登录成功'));
});

router.post('/send-code', async (req: Request, res: Response): Promise<void> => {
  const { phone } = req.body;
  
  if (!phone) {
    res.status(400).json({
      code: 400,
      message: '请输入手机号',
      data: null,
    });
    return;
  }

  console.log(`发送验证码到 ${phone}：123456`);

  res.json(successResponse(null, '验证码已发送'));
});

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.json(successResponse(null, '已退出登录'));
});

export default router;

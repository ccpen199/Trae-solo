import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getQuery, createUser } from '../utils/database';
import { authenticate } from '../middleware/auth';

const router = Router();

const verificationCodes: Map<string, string> = new Map();

router.post('/send-code', (req: Request, res: Response) => {
  const { phone } = req.body;
  
  if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ error: '手机号格式不正确' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes.set(phone, code);
  console.log(`[SMS] Phone: ${phone}, Code: ${code}`);

  res.json({ success: true, message: '验证码已发送', code });
});

router.post('/login', async (req: Request, res: Response) => {
  const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ error: '手机号和验证码不能为空' });
  }

  const storedCode = verificationCodes.get(phone);
  if (!storedCode || storedCode !== code) {
    return res.status(400).json({ error: '验证码错误或已过期' });
  }

  const user = await getQuery('SELECT * FROM users WHERE phone = ?', [phone]);

  if (user) {
    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET || 'planet-secret-key-2024',
      { expiresIn: '7d' }
    );
    return res.json({
      success: true,
      isNewUser: false,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        inviteCode: user.invite_code,
        force: user.force,
        blackDiamond: user.black_diamond,
        blockchainAddress: user.blockchain_address
      }
    });
  }

  res.json({
    success: true,
    isNewUser: true,
    message: '新用户，请完成注册'
  });
});

router.post('/register', async (req: Request, res: Response) => {
  const { phone, nickname, inviteCode, realName, idCard } = req.body;

  if (!phone || !nickname) {
    return res.status(400).json({ error: '手机号和昵称不能为空' });
  }

  const existingUser = await getQuery('SELECT * FROM users WHERE phone = ?', [phone]);
  if (existingUser) {
    return res.status(400).json({ error: '该手机号已注册' });
  }

  const user = createUser({ phone, nickname, inviteCode, realName, idCard });

  const token = jwt.sign(
    { id: user.id, phone: user.phone },
    process.env.JWT_SECRET || 'planet-secret-key-2024',
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      inviteCode: user.invite_code,
      force: user.force,
      blackDiamond: user.black_diamond,
      blockchainAddress: user.blockchain_address
    }
  });
});

router.get('/profile', authenticate, async (req: any, res: Response) => {
  const user = await getQuery('SELECT * FROM users WHERE id = ?', [req.user.id]);
  
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  res.json({
    id: user.id,
    phone: user.phone,
    nickname: user.nickname,
    inviteCode: user.invite_code,
    force: user.force,
    blackDiamond: user.black_diamond,
    blockchainAddress: user.blockchain_address,
    lastCheckinDate: user.last_checkin_date,
    lastDiamondClaimDate: user.last_diamond_claim_date
  });
});

export default router;

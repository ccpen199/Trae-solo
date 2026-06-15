import { Router } from 'express';
import { db } from '../database';
import { generateId, signToken, hashPassword, verifyPassword, now, isVirtualPhone } from '../utils';
import { AuthRequest, authMiddleware, clientInfoMiddleware } from '../middleware/auth';
import { commissionService } from '../services/commission';

const router = Router();

router.post('/register', clientInfoMiddleware, async (req: AuthRequest, res) => {
  try {
    const { phone, password, nickname, referrerCode } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: '手机号和密码不能为空' });
    }
    if (!/^1\d{10}$/.test(phone)) {
      return res.status(400).json({ success: false, message: '手机号格式错误' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码长度至少6位' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existing) {
      return res.status(400).json({ success: false, message: '该手机号已注册' });
    }

    const userId = generateId();
    const hashedPwd = hashPassword(password);
    const t = now();

    let referrerId: string | null = null;
    if (referrerCode) {
      const referrer: any = db.prepare('SELECT id FROM users WHERE id = ? OR phone = ?').get(referrerCode, referrerCode);
      if (referrer) referrerId = referrer.id;
    }

    const isVirtual = isVirtualPhone(phone) ? 1 : 0;

    db.prepare(`
      INSERT INTO users (id, phone, nickname, password_hash, avatar, balance, referrer_id,
        level, total_commission, available_commission, is_virtual, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, 0, 0, 0, ?, ?, ?)
    `).run(userId, phone, nickname || `用户${phone.slice(-4)}`, hashedPwd, null, referrerId, isVirtual, t, t);

    if (referrerId) {
      commissionService.buildRelationChain(userId, referrerId);
    }

    const token = signToken({ userId, role: 'user' });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          phone,
          nickname: nickname || `用户${phone.slice(-4)}`,
          avatar: null,
          balance: 0,
          level: 0
        }
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: '手机号和密码不能为空' });
    }

    const user: any = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(400).json({ success: false, message: '手机号或密码错误' });
    }

    const token = signToken({ userId: user.id, role: 'user' });

    db.prepare('UPDATE users SET updated_at = ? WHERE id = ?').run(now(), user.id);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          balance: user.balance,
          level: user.level,
          totalCommission: user.total_commission,
          availableCommission: user.available_commission
        }
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
      const token = signToken({ userId: 'admin', role: 'admin', username });
      return res.json({ success: true, data: { token, user: { id: 'admin', username, role: 'admin' } } });
    }
    res.status(400).json({ success: false, message: '用户名或密码错误' });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.get('/profile', authMiddleware, (req: AuthRequest, res) => {
  try {
    const user: any = db.prepare(`
      SELECT id, phone, nickname, avatar, balance, level, referrer_id,
             total_commission, available_commission, created_at
      FROM users WHERE id = ?
    `).get(req.userId);

    if (!user) return res.status(404).json({ success: false, message: '用户不存在' });

    const referralCount = commissionService.getReferralCount(user.id);

    res.json({
      success: true,
      data: {
        ...user,
        referralCount
      }
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/profile', authMiddleware, (req: AuthRequest, res) => {
  try {
    const { nickname, avatar } = req.body;
    db.prepare('UPDATE users SET nickname = ?, avatar = ?, updated_at = ? WHERE id = ?')
      .run(nickname, avatar, now(), req.userId);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
});

export default router;

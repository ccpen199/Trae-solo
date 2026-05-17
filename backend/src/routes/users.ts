import { Router, Request, Response } from 'express';
import db from '../database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

router.post('/login', (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码必填' } as ApiResponse);
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' } as ApiResponse);
    }

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' } as ApiResponse);
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'video-player-secret-key-2024',
      { expiresIn: '7d' }
    );

    const { password: _, ...userInfo } = user;
    res.json({ success: true, data: { user: userInfo, token } } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: '登录失败' } as ApiResponse);
  }
});

router.get('/:id/vip-status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT id, username, is_vip, vip_expire_at FROM users WHERE id = ?').get(id);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' } as ApiResponse);
    }

    const now = new Date();
    const vipExpireAt = user.vip_expire_at ? new Date(user.vip_expire_at) : null;
    const isVipValid = user.is_vip && (!vipExpireAt || vipExpireAt > now);

    res.json({
      success: true,
      data: {
        ...user,
        is_vip_valid: isVipValid,
        vip_expired: vipExpireAt ? vipExpireAt <= now : false
      }
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: '获取VIP状态失败' } as ApiResponse);
  }
});

router.get('/:id/play-records', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    const records = db.prepare(`
      SELECT pr.*, v.title, v.thumbnail, v.duration as video_duration
      FROM play_records pr
      LEFT JOIN videos v ON pr.video_id = v.id
      WHERE pr.user_id = ?
      ORDER BY pr.updated_at DESC
      LIMIT ? OFFSET ?
    `).all(id, Number(pageSize), offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM play_records WHERE user_id = ?').get(id);

    res.json({
      success: true,
      data: { list: records, total: total.count, page: Number(page), pageSize: Number(pageSize) }
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: '获取播放记录失败' } as ApiResponse);
  }
});

router.post('/:id/settings', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { auto_play, default_quality } = req.body;

    if (auto_play !== undefined) {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('auto_play', ?)").run(auto_play ? '1' : '0');
    }
    if (default_quality) {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('default_quality', ?)").run(default_quality);
    }

    res.json({ success: true, message: '设置已保存' } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: '保存设置失败' } as ApiResponse);
  }
});

router.get('/settings', (req: Request, res: Response) => {
  try {
    const settings = db.prepare('SELECT * FROM settings').all();
    const result: any = {};
    settings.forEach((s: any) => {
      result[s.key] = s.value;
    });

    res.json({ success: true, data: result } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: '获取设置失败' } as ApiResponse);
  }
});

export default router;

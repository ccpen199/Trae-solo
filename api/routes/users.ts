import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { success, error } from '../utils/response.js';
import { queryOne, execute } from '../db.js';
import type { User } from '../../shared/types.js';

const router = Router();

router.get('/profile', authMiddleware, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    
    const user = queryOne<User>(
      'SELECT id, username, real_name, phone, email, role, avatar, parent_id, store_id, region, level, status, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      res.status(404).json(error('用户不存在', 404));
      return;
    }

    const result: User = {
      ...user,
      realName: (user as unknown as { real_name: string }).real_name,
      parentId: (user as unknown as { parent_id: number }).parent_id,
      storeId: (user as unknown as { store_id: number }).store_id,
      createdAt: (user as unknown as { created_at: string }).created_at,
    };

    res.json(success(result));
  } catch {
    res.status(500).json(error('获取用户信息失败', 500));
  }
});

router.put('/profile', authMiddleware, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { email, avatar } = req.body;

    execute(
      'UPDATE users SET email = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [email || null, avatar || null, userId]
    );

    res.json(success({ updated: true }, '个人信息更新成功'));
  } catch {
    res.status(500).json(error('更新失败', 500));
  }
});

export default router;

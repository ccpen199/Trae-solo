import { Router, Response } from 'express';
import { db } from '../database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/follow/:userId', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = parseInt(req.params.userId, 10);
    if (targetUserId === req.user!.id) {
      res.status(400).json({ error: '不能关注自己' });
      return;
    }

    const existing = db.prepare('SELECT id FROM follows WHERE follower_id = ? AND following_id = ?').get(req.user!.id, targetUserId);
    if (existing) {
      db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(req.user!.id, targetUserId);
      res.json({ following: false });
    } else {
      db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)').run(req.user!.id, targetUserId);
      res.json({ following: true });
    }
  } catch (error) {
    res.status(500).json({ error: '操作失败' });
  }
});

router.get('/followers', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const followers = db.prepare(`
      SELECT u.id, u.username, u.nickname, u.avatar, u.is_verified
      FROM follows f
      JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
    `).all(req.user!.id);
    res.json({ followers });
  } catch (error) {
    res.status(500).json({ error: '获取粉丝列表失败' });
  }
});

router.get('/following', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const following = db.prepare(`
      SELECT u.id, u.username, u.nickname, u.avatar, u.is_verified
      FROM follows f
      JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
    `).all(req.user!.id);
    res.json({ following });
  } catch (error) {
    res.status(500).json({ error: '获取关注列表失败' });
  }
});

router.post('/appointments', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { post_id, merchant_id, appointment_type, appointment_time, contact_info } = req.body;
    if (!post_id || !appointment_type) {
      res.status(400).json({ error: '缺少必要参数' });
      return;
    }
    const result = db.prepare(`
      INSERT INTO appointments (post_id, user_id, merchant_id, appointment_type, appointment_time, contact_info)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(post_id, req.user!.id, merchant_id, appointment_type, appointment_time, contact_info);
    res.json({ id: result.lastInsertRowid, message: '预约成功' });
  } catch (error) {
    res.status(500).json({ error: '预约失败' });
  }
});

router.get('/appointments', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const appointments = db.prepare(`
      SELECT a.*, p.title as post_title
      FROM appointments a
      JOIN posts p ON a.post_id = p.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
    `).all(req.user!.id);
    res.json({ appointments });
  } catch (error) {
    res.status(500).json({ error: '获取预约列表失败' });
  }
});

router.get('/dating/match', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id);
    const userCityId = user?.city_id || 1;

    const matches = db.prepare(`
      SELECT pd.*, p.title, p.content, u.nickname, u.avatar, u.is_verified, u.city_id
      FROM post_dating pd
      JOIN posts p ON pd.post_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE p.is_deleted = 0 AND p.city_id = ? AND p.user_id != ?
      ORDER BY p.created_at DESC
      LIMIT 20
    `).all(userCityId, req.user!.id);

    res.json({ matches });
  } catch (error) {
    res.status(500).json({ error: '匹配失败' });
  }
});

export default router;

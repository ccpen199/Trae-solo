import { Router, Request, Response } from 'express';
import db from '../database';

const router = Router();

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

const authMiddleware = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未授权' } as ApiResponse);
  }
  next();
};

router.get('/videos', authMiddleware, (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    let whereClause = '1=1';
    const params: any[] = [];

    if (status) {
      whereClause += ' AND v.status = ?';
      params.push(status);
    }

    params.push(Number(pageSize), offset);

    const videos = db.prepare(`
      SELECT v.*, a.title as album_title
      FROM videos v
      LEFT JOIN albums a ON v.album_id = a.id
      WHERE ${whereClause}
      ORDER BY v.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params);

    const total = db.prepare(`SELECT COUNT(*) as count FROM videos v WHERE ${whereClause}`).get(...params.slice(0, params.length - 2));

    res.json({
      success: true,
      data: { list: videos, total: total.count, page: Number(page), pageSize: Number(pageSize) }
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: '获取视频列表失败' } as ApiResponse);
  }
});

router.post('/videos', authMiddleware, (req: Request, res: Response) => {
  try {
    const { title, description, duration, url, thumbnail, status, is_vip, album_id, episode_no, aspect_ratio } = req.body;

    if (!title || !url) {
      return res.status(400).json({ success: false, message: '标题和视频地址必填' } as ApiResponse);
    }

    const result = db.prepare(`
      INSERT INTO videos (title, description, duration, url, thumbnail, status, is_vip, album_id, episode_no, aspect_ratio)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, description || '', duration || 0, url, thumbnail || '', status || 'active', is_vip ? 1 : 0, album_id || null, episode_no || null, aspect_ratio || '16:9');

    res.json({ success: true, data: { id: result.lastInsertRowid }, message: '视频创建成功' } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: '创建视频失败' } as ApiResponse);
  }
});

router.put('/videos/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, duration, url, thumbnail, status, is_vip, album_id, episode_no, aspect_ratio } = req.body;

    db.prepare(`
      UPDATE videos SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        duration = COALESCE(?, duration),
        url = COALESCE(?, url),
        thumbnail = COALESCE(?, thumbnail),
        status = COALESCE(?, status),
        is_vip = COALESCE(?, is_vip),
        album_id = ?,
        episode_no = ?,
        aspect_ratio = COALESCE(?, aspect_ratio),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, duration, url, thumbnail, status, is_vip ? 1 : 0, album_id, episode_no, aspect_ratio, id);

    res.json({ success: true, message: '视频更新成功' } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: '更新视频失败' } as ApiResponse);
  }
});

router.delete('/videos/:id', authMiddleware, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM videos WHERE id = ?').run(id);
    db.prepare('DELETE FROM video_quality WHERE video_id = ?').run(id);
    db.prepare('DELETE FROM play_records WHERE video_id = ?').run(id);

    res.json({ success: true, message: '视频删除成功' } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: '删除视频失败' } as ApiResponse);
  }
});

router.get('/ads', authMiddleware, (req: Request, res: Response) => {
  try {
    const ads = db.prepare('SELECT * FROM advertisements ORDER BY created_at DESC').all();
    res.json({ success: true, data: ads } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: '获取广告列表失败' } as ApiResponse);
  }
});

router.post('/ads', authMiddleware, (req: Request, res: Response) => {
  try {
    const { type, title, video_url, duration, target_url, status, position } = req.body;

    if (!type || !title || !video_url) {
      return res.status(400).json({ success: false, message: '类型、标题和视频地址必填' } as ApiResponse);
    }

    const result = db.prepare(`
      INSERT INTO advertisements (type, title, video_url, duration, target_url, status, position)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(type, title, video_url, duration || 5, target_url || '', status || 'active', position || 0);

    res.json({ success: true, data: { id: result.lastInsertRowid }, message: '广告创建成功' } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: '创建广告失败' } as ApiResponse);
  }
});

router.get('/stats', authMiddleware, (req: Request, res: Response) => {
  try {
    const totalVideos = db.prepare('SELECT COUNT(*) as count FROM videos').get();
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const totalPlays = db.prepare('SELECT COUNT(*) as count FROM play_records').get();
    const totalAds = db.prepare('SELECT COUNT(*) as count FROM advertisements').get();
    const vipUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_vip = 1').get();

    res.json({
      success: true,
      data: {
        totalVideos: totalVideos.count,
        totalUsers: totalUsers.count,
        totalPlays: totalPlays.count,
        totalAds: totalAds.count,
        vipUsers: vipUsers.count
      }
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: '获取统计数据失败' } as ApiResponse);
  }
});

export default router;

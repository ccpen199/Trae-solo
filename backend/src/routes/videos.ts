import { Router, Request, Response } from 'express';
import db from '../database';

const router = Router();

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errorCode?: string;
}

router.get('/', (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);
    
    const videos = db.prepare(`
      SELECT v.*, a.title as album_title 
      FROM videos v 
      LEFT JOIN albums a ON v.album_id = a.id 
      WHERE v.status = 'active'
      ORDER BY v.created_at DESC
      LIMIT ? OFFSET ?
    `).all(Number(pageSize), offset);

    const total = db.prepare("SELECT COUNT(*) as count FROM videos WHERE status = 'active'").get();

    res.json({
      success: true,
      data: { list: videos, total: total.count, page: Number(page), pageSize: Number(pageSize) }
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: '获取视频列表失败' } as ApiResponse);
  }
});

router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const video = db.prepare('SELECT * FROM videos WHERE id = ?').get(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: '视频不存在',
        errorCode: 'VIDEO_NOT_FOUND'
      } as ApiResponse);
    }

    if (video.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: '视频审核未通过',
        errorCode: 'VIDEO_NOT_APPROVED'
      } as ApiResponse);
    }

    const qualities = db.prepare('SELECT * FROM video_quality WHERE video_id = ?').all(id);

    res.json({
      success: true,
      data: { ...video, qualities }
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: '获取视频详情失败' } as ApiResponse);
  }
});

router.get('/:id/qualities', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const qualities = db.prepare('SELECT * FROM video_quality WHERE video_id = ?').all(id);
    
    res.json({ success: true, data: qualities } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: '获取清晰度失败' } as ApiResponse);
  }
});

router.post('/:id/progress', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { progress, duration, userId } = req.body;

    if (progress === undefined) {
      return res.status(400).json({ success: false, message: '进度参数必填' } as ApiResponse);
    }

    const existing = db.prepare('SELECT id FROM play_records WHERE video_id = ? AND user_id = ?').get(id, userId || null);
    
    if (existing) {
      db.prepare(`
        UPDATE play_records 
        SET progress = ?, duration = ?, is_complete = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(progress, duration || 0, progress >= (duration || 0) * 0.9 ? 1 : 0, existing.id);
    } else {
      db.prepare(`
        INSERT INTO play_records (video_id, user_id, progress, duration, is_complete, client_ip)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, userId || null, progress, duration || 0, 0, req.ip);
    }

    res.json({ success: true, message: '进度已保存' } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, message: '保存进度失败' } as ApiResponse);
  }
});

export default router;
